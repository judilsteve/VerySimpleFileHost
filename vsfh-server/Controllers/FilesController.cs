using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.IO.Compression;
using System.Text;
using ICSharpCode.SharpZipLib.Tar;
using ICSharpCode.SharpZipLib.GZip;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.ActionResults;
using VerySimpleFileHost.Utils;
using VerySimpleFileHost.Middleware;

namespace VerySimpleFileHost.Controllers;

public class FilesController : ControllerBase
{
    private readonly FilesConfiguration config;

    public FilesController(FilesConfiguration config)
    {
        this.config = config;
    }

    public class FileDto
    {
        public required string DisplayName { get; init; }
        public long SizeBytes { get; init; }
    }

    public class DirectoryDto
    {
        public required string DisplayName { get; init; }
        public IEnumerable<FileDto>? Files { get; init; } // TODO_JU Serialise this as a JSON dictionary instead of an array?
        public IEnumerable<DirectoryDto>? Subdirectories { get; init; } // TODO_JU Serialise this as a JSON dictionary instead of an array?
    }

    private const string rootPathName = "<root>";

    private static string NotFoundMessage(string path) =>
        $"File/directory with path \"{path}\" could not be found";

    /// <summary>
    /// Retrieve file listing for path
    /// </summary>
    /// <param name="path">Unescaped path relative to root share directory (note that Swagger/OpenAPI doesn't support unescaped wildcards yet)</param>
    /// <param name="depth"></param>
    /// <returns></returns>
    [HttpGet("{**path}")]
    [CompressResponse]
    public ActionResult<DirectoryDto> Listing(string? path, [Range(1, int.MaxValue)]int? depth)
    {
        path ??= "";

        var absolutePath = Path.GetFullPath(Path.Combine(config.RootSharedDirectory, path));
        if(!absolutePath.ExistsAndIsAccessible(config, out var isDirectory))
            return NotFound(NotFoundMessage(path));

        if(!isDirectory) return BadRequest("Only directories can be listed");

        var directoryInfo = new DirectoryInfo(absolutePath);
        return new DirectoryDto
        {
            DisplayName = path == "" ? rootPathName : directoryInfo.Name,
            Files = GetFiles(directoryInfo),
            Subdirectories = GetSubdirectories(directoryInfo, depth.HasValue ? depth.Value - 1 : null)
        };
    }

    private IEnumerable<FileDto> GetFiles(DirectoryInfo directoryInfo)
    {
        foreach(var fileInfo in directoryInfo.EnumerateAccessibleFiles(config, sort: true, recurseSubdirectories: false))
        {
            yield return new FileDto
            {
                DisplayName = fileInfo.Name,
                SizeBytes = fileInfo.Length
            };
            // Checking the cancellation token here is a good idea here since recursively listing
            // a large directory tree on a spinning rust drive can take a very long time
            HttpContext.RequestAborted.ThrowIfCancellationRequested();
        }
    }

    private IEnumerable<DirectoryDto> GetSubdirectories(DirectoryInfo directoryInfo, int? depth)
    {
        var goDeeper = !depth.HasValue || depth > 0;
        foreach(var subdirectoryInfo in directoryInfo.EnumerateAccessibleDirectories(config, sort: true))
        {
            yield return new DirectoryDto
            {
                DisplayName = subdirectoryInfo.Name,
                Files = goDeeper
                    ? GetFiles(subdirectoryInfo)
                    : null,
                Subdirectories = goDeeper
                    ? GetSubdirectories(subdirectoryInfo, depth.HasValue ? depth.Value - 1 : null)
                    : null
            };
            // Checking the cancellation token here is a good idea here since recursively listing
            // a large directory tree on a spinning rust drive can take a very long time
            HttpContext.RequestAborted.ThrowIfCancellationRequested();
        }
    }

    public enum ArchiveFormat
    {
        Tar,
        Zip
    }

    private const int maxFileNameLength = 255;

    private string GetDownloadName(string absolutePath)
    {
        var fileName = Path.GetFileName(Path.GetRelativePath(config.RootSharedDirectory, absolutePath));
        // "<" and ">" characters are illegal for file/directory names in Windows filesystems
        return fileName == "." ? "_root_" : fileName;
    }

    private void AddAttachmentHeader(string fileNameWithoutExtension, string extension)
    {
        var availableChars = maxFileNameLength - extension.Length;
        string trimmedFileName;
        if(availableChars < 0)
        {
            trimmedFileName = fileNameWithoutExtension.Substring(0, maxFileNameLength);
        }
        else if(availableChars < fileNameWithoutExtension.Length)
        {
            trimmedFileName = $"{fileNameWithoutExtension.Substring(0, availableChars)}{extension}";
        }
        else
        {
            trimmedFileName = $"{fileNameWithoutExtension}{extension}";
        }
        HttpContext.Response.Headers.Add(
            "Content-Disposition",
            $"attachment; filename*=UTF-8''{Uri.EscapeDataString(trimmedFileName)}");
    }

    private string GetArchiveMimeType(ArchiveFormat archiveFormat)
    {
        return archiveFormat switch
        {
            ArchiveFormat.Tar => config.GzipCompressionLevel.HasValue
                ? "application/gzip"
                : "application/x-tar",
            ArchiveFormat.Zip => "application/zip",
            _ => throw new ArgumentException("Unrecognised archive format", nameof(archiveFormat))
        };
    }

    private const string defaultMimeType = "application/octet-stream";

    /// <summary>
    /// Download file/directory
    /// </summary>
    /// <param name="path">Unescaped path relative to root share directory (note that Swagger/OpenAPI doesn't support unescaped wildcards yet)</param>
    /// <param name="archiveFormat"></param>
    /// <param name="asAttachment"></param>
    /// <returns></returns>
    [HttpGet("{**path}")]
    public ActionResult Download(string? path, ArchiveFormat? archiveFormat, bool? asAttachment)
    {
        path ??= "";

        var absolutePath = Path.GetFullPath(Path.Combine(config.RootSharedDirectory, path));
        if(!absolutePath.ExistsAndIsAccessible(config, out var isDirectory))
            return NotFound(NotFoundMessage(path));

        if(isDirectory)
        {
            if(!archiveFormat.HasValue)
                return BadRequest($"\"{nameof(archiveFormat)}\" is required when downloading a directory");

            if(asAttachment ?? false) AddAttachmentHeader(GetDownloadName(absolutePath), GetArchiveExtension(archiveFormat.Value));

            return new FileCallbackResult(
                (outputStream, _) => WriteArchiveToStream(
                    new[]{ (absolutePath, isDirectory: true) },
                    outputStream,
                    archiveFormat.Value),
                GetArchiveMimeType(archiveFormat.Value));
        }

        var extension = Path.GetExtension(absolutePath);
        var mimeType = string.IsNullOrEmpty(extension) ? defaultMimeType : config.MimeTypesByExtension
            .GetValueOrDefault(extension.Substring(1), defaultMimeType);

        if(asAttachment ?? false) AddAttachmentHeader(Path.GetFileNameWithoutExtension(GetDownloadName(absolutePath)), extension);

        return new PhysicalFileResult(absolutePath, mimeType)
        {
            EnableRangeProcessing = true
        };
    }

    private Task WriteArchiveToStream(
        IList<(string absolutePath, bool isDirectory)> absolutePaths,
        Stream outputStream,
        ArchiveFormat archiveFormat)
    {
        return archiveFormat switch
        {
            ArchiveFormat.Tar => WriteTarToStream(absolutePaths, outputStream),
            ArchiveFormat.Zip => WriteZipToStream(absolutePaths, outputStream),
            _ => throw new ArgumentException($"Unhandled archive format", nameof(archiveFormat))
        };
    }

    private async Task WriteZipToStream(
        IList<(string absolutePath, bool isDirectory)> absolutePaths,
        Stream outputStream)
    {
        using var zip = new ZipArchive(outputStream, ZipArchiveMode.Create, leaveOpen: true);
        foreach(var (absolutePath, isDirectory) in absolutePaths)
        {
            if(isDirectory)
            {
                var directoryInfo = new DirectoryInfo(absolutePath);
                foreach(var fileInfo in directoryInfo.EnumerateAccessibleFiles(config, sort: false, recurseSubdirectories: true))
                {
                    // If we are only making a zip from a single directory and nothing else,
                    // omit the top-level folder name
                    var zipEntryPath = Path.GetRelativePath(absolutePath, fileInfo.FullName);
                    if(absolutePaths.Count > 1)
                    {
                        zipEntryPath = Path.Combine(directoryInfo.Name, zipEntryPath);
                    }

                    var zipEntry = zip.CreateEntry(zipEntryPath, config.ZipCompressionLevel);
                    using var zipEntryStream = zipEntry.Open();
                    using var fileStream = fileInfo.OpenRead();
                    await fileStream.CopyToAsync(zipEntryStream, HttpContext.RequestAborted);
                    HttpContext.RequestAborted.ThrowIfCancellationRequested();
                }
            }
            else
            {
                var zipEntry = zip.CreateEntry(Path.GetFileName(absolutePath), config.ZipCompressionLevel);
                using var zipEntryStream = zipEntry.Open();
                using var fileStream = System.IO.File.OpenRead(absolutePath);
                await fileStream.CopyToAsync(zipEntryStream, HttpContext.RequestAborted);
                HttpContext.RequestAborted.ThrowIfCancellationRequested();
            }
        }
    }

    private async Task WriteTarToStream(
        IList<(string absolutePath, bool isDirectory)> absolutePaths,
        Stream outputStream)
    {
        if(config.GzipCompressionLevel.HasValue)
        {
            using var gzipOutputStream = new GZipOutputStream(outputStream)
            {
                IsStreamOwner = false
            };
            using var tarOutputStream = new TarOutputStream(gzipOutputStream, Encoding.UTF8)
            {
                IsStreamOwner = false
            };
            await WriteTarStream(absolutePaths, tarOutputStream);
        }
        else
        {
            using var tarOutputStream = new TarOutputStream(outputStream, Encoding.UTF8)
            {
                IsStreamOwner = false
            };
            await WriteTarStream(absolutePaths, tarOutputStream);
        }
    }

    private async Task WriteTarStream(
        IList<(string absolutePath, bool isDirectory)> absolutePaths,
        TarOutputStream tarOutputStream)
    {
        foreach(var (absolutePath, isDirectory) in absolutePaths)
        {
            if(isDirectory)
            {
                var directoryInfo = new DirectoryInfo(absolutePath);
                foreach(var fileInfo in directoryInfo.EnumerateAccessibleFiles(config, sort: false, recurseSubdirectories: true))
                {
                    // If we are only making a tar from a single directory and nothing else,
                    // omit the top-level folder name
                    var tarEntryPath = Path.GetRelativePath(absolutePath, fileInfo.FullName);
                    if(absolutePaths.Count > 1)
                    {
                        tarEntryPath = Path.Combine(directoryInfo.Name, tarEntryPath);
                    }
                    // TODO_JU Migrate to System.Formats.Tar when 7.0 goes GA
                    // https://devblogs.microsoft.com/dotnet/announcing-dotnet-7-preview-4/#added-new-tar-apis
                    var tarEntry = TarEntry.CreateTarEntry(tarEntryPath);
                    tarEntry.Size = fileInfo.Length;
                    tarOutputStream.PutNextEntry(tarEntry);
                    using var fileStream = fileInfo.OpenRead();
                    await fileStream.CopyToAsync(tarOutputStream, HttpContext.RequestAborted);
                    HttpContext.RequestAborted.ThrowIfCancellationRequested();
                    tarOutputStream.CloseEntry();
                }
            }
            else
            {
                var fileInfo = new FileInfo(absolutePath);
                var tarEntry = TarEntry.CreateTarEntry(Path.GetFileName(absolutePath));
                tarEntry.Size = fileInfo.Length;
                tarOutputStream.PutNextEntry(tarEntry);
                using var fileStream = fileInfo.OpenRead();
                await fileStream.CopyToAsync(tarOutputStream, HttpContext.RequestAborted);
                HttpContext.RequestAborted.ThrowIfCancellationRequested();
                tarOutputStream.CloseEntry();
            }
        }
        tarOutputStream.Close();
    }

    private string GetArchiveExtension(ArchiveFormat archiveFormat)
    {
        return archiveFormat switch
        {
            ArchiveFormat.Tar => config.GzipCompressionLevel.HasValue ? ".tar.gz" : ".tar",
            ArchiveFormat.Zip => ".zip",
            _ => throw new ArgumentException("Unrecognised archive format", nameof(archiveFormat))
        };
    }

    private void AddAttachmentHeader(IEnumerable<string> absolutePaths, string extension)
    {
        var builder = new StringBuilder(maxFileNameLength);
        foreach(var absolutePath in absolutePaths)
        {
            var downloadName = GetDownloadName(absolutePath);
            builder.Append($"{(builder.Length > 0 ? "+" : "")}{downloadName}");
            if(builder.Length > maxFileNameLength) break;
        }
        AddAttachmentHeader(builder.ToString(), extension);
    }

    [HttpPost]
    public ActionResult DownloadMany([MinLength(1)] string[] paths, [Required]ArchiveFormat? archiveFormat, bool? asAttachment)
    {
        var absolutePaths = new List<(string absolutePath, bool isDirectory)>(paths.Length);
        foreach(var path in paths)
        {
            // Don't ask me how, but on the form version of this endpoint (which delegates to here) it's possible to receive a null path
            var absolutePath = Path.GetFullPath(Path.Combine(config.RootSharedDirectory, path ?? ""));
            if(!absolutePath.ExistsAndIsAccessible(config, out var isDirectory))
                return NotFound(NotFoundMessage(path ?? ""));
            absolutePaths.Add((absolutePath, isDirectory));
        }

        if(asAttachment ?? false)
            AddAttachmentHeader(
                absolutePaths.Select(p => p.absolutePath),
                GetArchiveExtension(archiveFormat!.Value));

        return new FileCallbackResult(
            (outputStream, _) => WriteArchiveToStream(
                absolutePaths,
                outputStream,
                archiveFormat!.Value),
            GetArchiveMimeType(archiveFormat!.Value));
    }

    [HttpPost]
    public ActionResult DownloadManyForm([MinLength(1)][FromForm] string[] paths, [Required]ArchiveFormat? archiveFormat, bool? asAttachment)
    {
        return DownloadMany(paths, archiveFormat, asAttachment);
    }
}
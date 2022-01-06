using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.IO.Compression;
using System.Text;
using ICSharpCode.SharpZipLib.Tar;
using ICSharpCode.SharpZipLib.GZip;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.ActionResults;
using VerySimpleFileHost.Utils;

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
        public string DisplayName { get; init; } = null!;
        public long SizeBytes { get; init; }
    }

    public class DirectoryDto
    {
        public string DisplayName { get; init; } = null!;
        public IEnumerable<FileDto>? Files { get; init; }
        public IEnumerable<DirectoryDto>? Subdirectories { get; init; }
    }

    private const string rootPathName = "<root>";
    private const string noRootMessage = "Ask an administrator to configure the root shared directory";

    private static string NotFoundMessage(string path) =>
        $"File/directory with path \"{path}\" could not be found";

    /// <summary>
    /// Retrieve file listing for path
    /// </summary>
    /// <param name="path">Unescaped path relative to root share directory (note that Swagger/OpenAPI doesn't support unescaped wildcards yet)</param>
    /// <param name="depth"></param>
    /// <returns></returns>
    [HttpGet("{**path}")]
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
            DisplayName = rootPathName,
            Files = GetFiles(directoryInfo),
            Subdirectories = GetSubdirectories(directoryInfo, depth.HasValue ? depth.Value - 1 : null)
        };
    }

    private static readonly EnumerationOptions skipInaccessible = new()
    {
        AttributesToSkip = FileAttributes.Hidden | FileAttributes.System,
        IgnoreInaccessible = true
    };

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

    private void AddAttachmentHeader(string absolutePath, string extension)
    {
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(absolutePath);
        // "<" and ">" characters are illegal for file/directory names in Windows filesystems
        if(string.IsNullOrEmpty(fileNameWithoutExtension)) fileNameWithoutExtension = "_root_";
        var maxFileNameLength = 255;
        var availableChars = maxFileNameLength - extension.Length;
        string trimmedFileName;
        if(availableChars < 0)
        {
            trimmedFileName = Path.GetFileName(absolutePath).Substring(0, maxFileNameLength);
        }
        else if(availableChars < fileNameWithoutExtension.Length)
        {
            // TODO_JU This is throwing an ArgumentOutOfRangeException
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

            if(asAttachment ?? false) AddAttachmentHeader(absolutePath, GetArchiveExtension(archiveFormat.Value));

            return new FileCallbackResult(
                (outputStream, _) => WriteArchiveToStream(
                    new[]{ absolutePath },
                    outputStream,
                    archiveFormat.Value),
                GetArchiveMimeType(archiveFormat.Value));
        }

        var extension = Path.GetExtension(absolutePath);
        var mimeType = config.MimeTypesByExtension
            .GetValueOrDefault(extension.Substring(1), "application/octet-stream");

        if(asAttachment ?? false) AddAttachmentHeader(absolutePath, extension);

        return new PhysicalFileResult(absolutePath, mimeType)
        {
            EnableRangeProcessing = true
        };
    }

    private Task WriteArchiveToStream(
        IEnumerable<string> absolutePaths,
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

    private async Task WriteZipToStream(IEnumerable<string> absolutePaths, Stream outputStream)
    {
        using var zip = new ZipArchive(outputStream, ZipArchiveMode.Create, leaveOpen: true);
        foreach(var absolutePath in absolutePaths)
        {
            var directoryInfo = new DirectoryInfo(absolutePath);
            foreach(var fileInfo in directoryInfo.EnumerateAccessibleFiles(config, sort: false, recurseSubdirectories: true))
            {
                var zipEntry = zip.CreateEntry(
                    Path.GetRelativePath(absolutePath, fileInfo.FullName),
                    config.ZipCompressionLevel);
                using var zipEntryStream = zipEntry.Open();
                using var fileStream = fileInfo.OpenRead();
                await fileStream.CopyToAsync(zipEntryStream, HttpContext.RequestAborted);
                HttpContext.RequestAborted.ThrowIfCancellationRequested();
            }
        }
    }

    private async Task WriteTarToStream(IEnumerable<string> absolutePaths, Stream outputStream)
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

    private async Task WriteTarStream(IEnumerable<string> absolutePaths, TarOutputStream tarOutputStream)
    {
        foreach(var absolutePath in absolutePaths)
        {
            var directoryInfo = new DirectoryInfo(absolutePath);
            foreach(var fileInfo in directoryInfo.EnumerateAccessibleFiles(config, sort: false, recurseSubdirectories: true))
            {
                var tarEntry = TarEntry.CreateTarEntry(Path.GetRelativePath(absolutePath, fileInfo.FullName));
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

    [HttpPost]
    public ActionResult DownloadMany([MinLength(1)] string[] paths, [Required]ArchiveFormat? archiveFormat, bool? asAttachment)
    {
        var absolutePaths = new List<string>(paths.Length);
        foreach(var path in paths)
        {
            var absolutePath = Path.GetFullPath(Path.Combine(config.RootSharedDirectory, path));
            if(!absolutePath.ExistsAndIsAccessible(config, out var isDirectory))
                return NotFound(NotFoundMessage(path));
            absolutePaths.Add(absolutePath);
        }

        if(asAttachment ?? false) AddAttachmentHeader(string.Join(",", absolutePaths), GetArchiveExtension(archiveFormat!.Value));

        return new FileCallbackResult(
            (outputStream, _) => WriteArchiveToStream(
                absolutePaths,
                outputStream,
                archiveFormat!.Value),
            GetArchiveMimeType(archiveFormat.Value));
    }
}
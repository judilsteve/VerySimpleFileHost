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

    // TODO_JU Need to use workaround for proper swagger gen:
    // https://github.com/domaindrivendev/Swashbuckle.AspNetCore/issues/1100
    [HttpGet("{**path}")]
    public ActionResult<DirectoryDto> Listing(string? path, [Range(1, int.MaxValue)]int? depth)
    {
        path ??= "";

        var absolutePath = Path.GetFullPath(Path.Combine(config.RootSharedDirectory, path));
        if(!PathUtils.ExistsAndIsVisible(absolutePath, config, out var isDirectory))
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

    private IEnumerable<FileDto> GetFiles(DirectoryInfo directoryInfo)
    {
        foreach(var fileInfo in directoryInfo.EnumerateFiles()) // TODO_JU How comes this throws UnauthorizedAccessException?
        {
            if(!PathUtils.IsVisible(fileInfo, config)) continue;
            yield return new FileDto
            {
                DisplayName = fileInfo.Name,
                SizeBytes = fileInfo.Length
            };
        }
    }

    private IEnumerable<DirectoryDto> GetSubdirectories(DirectoryInfo directoryInfo, int? depth)
    {
        var goDeeper = !depth.HasValue || depth > 0;
        foreach(var subdirectoryInfo in directoryInfo.EnumerateDirectories()) // TODO_JU How comes this throws UnauthorisedAccessException
        {
            if(!PathUtils.IsVisible(subdirectoryInfo, config)) continue;
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
        var maxFileNameLength = 255;
        var availableChars = maxFileNameLength - extension.Length;
        string trimmedFileName;
        if(availableChars < 0)
        {
            trimmedFileName = Path.GetFileName(absolutePath).Substring(0, maxFileNameLength);
        }
        else
        {
            trimmedFileName = $"{fileNameWithoutExtension.Substring(0, availableChars)}{extension}";
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

    [HttpGet("{**path}")]
    public ActionResult Download(string? path, ArchiveFormat? archiveFormat, bool asAttachment = false)
    {
        path ??= "";

        var absolutePath = Path.GetFullPath(Path.Combine(config.RootSharedDirectory, path));
        if(!PathUtils.ExistsAndIsVisible(absolutePath, config, out var isDirectory))
            return NotFound(NotFoundMessage(path));

        if(isDirectory)
        {
            if(!archiveFormat.HasValue)
                return BadRequest($"\"{nameof(archiveFormat)}\" is required when downloading a directory");

            return new FileCallbackResult(
                (outputStream, _) => WriteArchiveToStream(
                    new[]{ absolutePath },
                    outputStream,
                    archiveFormat.Value,
                    HttpContext.RequestAborted),
                GetArchiveMimeType(archiveFormat.Value));
        }

        var extension = Path.GetExtension(absolutePath);
        var mimeType = config.MimeTypesByExtension
            .GetValueOrDefault(extension.Substring(1), "application/octet-stream");

        if(asAttachment) AddAttachmentHeader(absolutePath, extension);

        return new PhysicalFileResult(absolutePath, mimeType)
        {
            EnableRangeProcessing = true
        };
    }

    private Task WriteArchiveToStream(
        IEnumerable<string> absolutePaths,
        Stream outputStream,
        ArchiveFormat archiveFormat,
        CancellationToken cancellationToken)
    {
        return archiveFormat switch
        {
            ArchiveFormat.Tar => WriteTarToStream(absolutePaths, outputStream, cancellationToken),
            ArchiveFormat.Zip => WriteZipToStream(absolutePaths, outputStream, cancellationToken),
            _ => throw new ArgumentException($"Unhandled archive format", nameof(archiveFormat))
        };
    }

    private async Task WriteZipToStream(IEnumerable<string> absolutePaths, Stream outputStream, CancellationToken cancellationToken)
    {
        using var zip = new ZipArchive(outputStream, ZipArchiveMode.Create, leaveOpen: true);
        foreach(var absolutePath in absolutePaths)
        {
            var directoryInfo = new DirectoryInfo(absolutePath);
            foreach(var fileInfo in directoryInfo.EnumerateFiles("*", SearchOption.AllDirectories)) // TODO_JU How come this throws UnauthorizedAccessException
            {
                var zipEntry = zip.CreateEntry(
                    Path.GetRelativePath(absolutePath, fileInfo.FullName),
                    config.ZipCompressionLevel);
                using var zipEntryStream = zipEntry.Open();
                using var fileStream = fileInfo.OpenRead();
                await fileStream.CopyToAsync(zipEntryStream, cancellationToken);
                cancellationToken.ThrowIfCancellationRequested();
            }
        }
    }

    private async Task WriteTarToStream(IEnumerable<string> absolutePaths, Stream outputStream, CancellationToken cancellationToken)
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
            await WriteTarStream(absolutePaths, tarOutputStream, cancellationToken);
        }
        else
        {
            using var tarOutputStream = new TarOutputStream(outputStream, Encoding.UTF8)
            {
                IsStreamOwner = false
            };
            await WriteTarStream(absolutePaths, tarOutputStream, cancellationToken);
        }
    }

    private static async Task WriteTarStream(IEnumerable<string> absolutePaths, TarOutputStream tarOutputStream, CancellationToken cancellationToken)
    {
        foreach(var absolutePath in absolutePaths)
        {
            var directoryInfo = new DirectoryInfo(absolutePath);
            foreach(var fileInfo in directoryInfo.EnumerateFiles("*", SearchOption.AllDirectories)) // TODO_JU How come this throws UnauthorizedAccessException
            {
                var tarEntry = TarEntry.CreateTarEntry(Path.GetRelativePath(absolutePath, fileInfo.FullName));
                tarEntry.Size = fileInfo.Length;
                tarOutputStream.PutNextEntry(tarEntry);
                using var fileStream = fileInfo.OpenRead();
                await fileStream.CopyToAsync(tarOutputStream, cancellationToken);
                cancellationToken.ThrowIfCancellationRequested();
                tarOutputStream.CloseEntry();
            }
        }
        tarOutputStream.Close();
    }

    [HttpPost("{**path}")]
    public ActionResult DownloadMany([MinLength(1)] string[] paths, [Required]ArchiveFormat? archiveFormat, bool asAttachment = false)
    {
        var absolutePaths = new List<string>(paths.Length);
        foreach(var path in paths)
        {
            var absolutePath = Path.GetFullPath(Path.Combine(config.RootSharedDirectory, path));
            if(!PathUtils.ExistsAndIsVisible(absolutePath, config, out var isDirectory))
                return NotFound(NotFoundMessage(path));
            absolutePaths.Add(absolutePath);
        }

        var archiveExtension = archiveFormat!.Value switch
        {
            ArchiveFormat.Tar => config.GzipCompressionLevel.HasValue ? ".tar.gz" : ".tar",
            ArchiveFormat.Zip => ".zip",
            _ => throw new ArgumentException("Unrecognised archive format", nameof(archiveFormat))
        };

        if(asAttachment) AddAttachmentHeader(string.Join(",", absolutePaths), archiveExtension);

        return new FileCallbackResult(
            (outputStream, _) => WriteArchiveToStream(
                absolutePaths,
                outputStream,
                archiveFormat!.Value,
                HttpContext.RequestAborted),
            GetArchiveMimeType(archiveFormat.Value));
    }
}
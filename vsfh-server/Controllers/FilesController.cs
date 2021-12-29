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

    [HttpGet(nameof(Listing))]
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
        foreach(var fileInfo in directoryInfo.EnumerateFiles())
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
        foreach(var subdirectoryInfo in directoryInfo.EnumerateDirectories())
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

    [HttpGet(nameof(Download))]
    public ActionResult Download(string? path, ArchiveFormat? archiveFormat)
    {
        // TODO_JU Set name with Content-Disposition
        // https://stackoverflow.com/questions/93551/how-to-encode-the-filename-parameter-of-content-disposition-header-in-http
        // Note that filenames should be no longer than 255 chars

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
                "application/zip");
        }

        var mimeType = "application/octet-stream";
        var lastDotIndex = path.LastIndexOf('.');
        if(lastDotIndex > 0)
        {
            mimeType = config.MimeTypesByExtension
                .GetValueOrDefault(path.Substring(lastDotIndex + 1), "application/octet-stream");
        }

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
            foreach(var fileInfo in directoryInfo.EnumerateFiles("*", SearchOption.AllDirectories))
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
            foreach(var fileInfo in directoryInfo.EnumerateFiles("*", SearchOption.AllDirectories))
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

    [HttpPost(nameof(DownloadMany))]
    public ActionResult DownloadMany([MinLength(1)] string[] paths, [Required]ArchiveFormat? archiveFormat)
    {
        // TODO_JU Set name with Content-Disposition
        // https://stackoverflow.com/questions/93551/how-to-encode-the-filename-parameter-of-content-disposition-header-in-http
        // Note that filenames should be no longer than 255 chars
        var absolutePaths = new List<string>(paths.Length);
        foreach(var path in paths)
        {
            var absolutePath = Path.GetFullPath(Path.Combine(config.RootSharedDirectory, path));
            if(!PathUtils.ExistsAndIsVisible(absolutePath, config, out var isDirectory))
                return NotFound(NotFoundMessage(path));
            absolutePaths.Add(absolutePath);
        }

        return new FileCallbackResult(
            (outputStream, _) => WriteArchiveToStream(
                absolutePaths,
                outputStream,
                archiveFormat!.Value,
                HttpContext.RequestAborted),
            "application/zip");
    }

    [HttpGet(nameof(PathSeparator))]
    public string PathSeparator() => Path.PathSeparator.ToString();
}
using System.IO.Compression;
using VerySimpleFileHost.Utils;

namespace VerySimpleFileHost.Configuration;

public class FilesConfiguration : IValidatableConfiguration
{
    public string RootSharedDirectory { get; init; } = null!;
    public Dictionary<string, string> MimeTypesByExtension { get; init; } = null!;
    public bool IncludeHiddenFilesAndDirectories { get; init; }
    public bool IncludeSystemFilesAndDirectories { get; init; }
    public int? GzipCompressionLevel { get; init; }
    public CompressionLevel ZipCompressionLevel { get; init; }

    public IEnumerable<string> Validate()
    {
        if(string.IsNullOrEmpty(RootSharedDirectory))
            yield return $"{nameof(RootSharedDirectory)} must be specified";
        if(!PathUtils.ExistsAndIsVisible(RootSharedDirectory, this, out var basePathIsDirectory))
            yield return $"{nameof(RootSharedDirectory)} could not be found";
        if(!basePathIsDirectory)
            yield return $"{nameof(RootSharedDirectory)} was not a directory";

        if(GzipCompressionLevel.HasValue)
            if(!ValidationUtils.ValidateRange(GzipCompressionLevel.Value, 1, 9, nameof(GzipCompressionLevel), out var gzipError))
                yield return gzipError;

        if(!Enum.IsDefined<CompressionLevel>(ZipCompressionLevel))
            yield return $"{nameof(ZipCompressionLevel)} must be one of: {string.Join(", ", Enum.GetValues<CompressionLevel>())}";
    }
}
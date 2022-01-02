using System.IO.Compression;
using System.ComponentModel.DataAnnotations;
using VerySimpleFileHost.Utils;

namespace VerySimpleFileHost.Configuration;

public class FilesConfiguration : IValidatableObject
{
    public string RootSharedDirectory { get; init; } = null!;
    public Dictionary<string, string> MimeTypesByExtension { get; init; } = null!;
    public bool IncludeHiddenFilesAndDirectories { get; init; }
    public bool IncludeSystemFilesAndDirectories { get; init; }
    [Range(1, 9)] public int? GzipCompressionLevel { get; init; }
    public CompressionLevel ZipCompressionLevel { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext _)
    {
        if(!PathUtils.ExistsAndIsVisible(RootSharedDirectory, this, out var basePathIsDirectory))
            yield return new ValidationResult($"{nameof(RootSharedDirectory)} could not be found on disk");
        if(!basePathIsDirectory)
            yield return new ValidationResult($"{nameof(RootSharedDirectory)} was not a directory");

        if(!Enum.IsDefined<CompressionLevel>(ZipCompressionLevel))
            yield return new ValidationResult($"{nameof(ZipCompressionLevel)} must be one of: {string.Join(", ", Enum.GetValues<CompressionLevel>())}");
    }
}
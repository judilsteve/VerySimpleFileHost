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
    public CompressionLevel TarCompressionLevel { get; init; }
    public CompressionLevel ZipCompressionLevel { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext _)
    {
        if(!PathUtils.ExistsAndIsAccessible(RootSharedDirectory, this, out var basePathIsDirectory))
            yield return new ValidationResult($"{nameof(RootSharedDirectory)} \"{RootSharedDirectory}\" did not exist or was not accessible");
        if(!basePathIsDirectory)
            yield return new ValidationResult($"{nameof(RootSharedDirectory)} \"{RootSharedDirectory}\" was not a directory");

        if(!Enum.IsDefined<CompressionLevel>(ZipCompressionLevel))
            yield return new ValidationResult($"{nameof(ZipCompressionLevel)} must be one of: {string.Join(", ", Enum.GetValues<CompressionLevel>())}");

        if(!Enum.IsDefined<CompressionLevel>(TarCompressionLevel))
            yield return new ValidationResult($"{nameof(TarCompressionLevel)} must be one of: {string.Join(", ", Enum.GetValues<CompressionLevel>())}");
    }
}
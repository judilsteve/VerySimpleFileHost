using System.CommandLine;
using System.IO.Compression;

namespace VsfhCompressor.Run;

/// <summary>
/// VSFH Compressor
/// </summary>
public static class VsfhCompressor
{
    private const double maxCompressionRatio = 0.8;

    private class ConcurrentTally
    {
        private readonly SemaphoreSlim semaphore = new(1,1);
        private long tally = 0;

        public async Task Add(long value)
        {
            await semaphore.WaitAsync();
            try
            {
                tally += value;
            } 
            finally
            {
                semaphore.Release();
            }
        }

        public long Value => tally;
    }

    private const long fileSizeStepFactor = 1024;
    private static readonly string[] fileSizeSuffixes = [ "B", "KiB", "MiB", "GiB", "TiB" ];

    private static string HumaniseBytes(long bytes)
    {
        int step;
        double displayValue;
        if (bytes == 0L) // Log would return infinity in this case
        {
            step = 0;
            displayValue = 0;
        }
        else
        {
            step = (int)Math.Floor(Math.Min(
                Math.Log(bytes, fileSizeStepFactor),
                fileSizeSuffixes.Length - 1));
            displayValue = bytes / Math.Pow(fileSizeStepFactor, step);
        }
        return $"{displayValue.ToString(step == 0 ? "F0" : "F2")}{fileSizeSuffixes[step]}";
    }

    /// <summary>
    /// Creates gzipped and brotli compressed versions of all "compressible" static web content files in the provided directory.
    /// </summary>
    /// <param name="path">
    /// Path to files which should be compressed
    /// </param>
    public static async Task Compress(string path)
    {
        var compressibleExtensions = new[]
        {
            "css",
            "js",
            "htm",
            "html",
            "svg",
            "txt",
            "xml",
            "json",
            "ico",
            "map", // Source maps
            "ttf",
            "eot",
            "wasm"
        };
        var compressibleFilePaths = compressibleExtensions
            .SelectMany(e => Directory.EnumerateFiles(path, $"*.{e}", SearchOption.AllDirectories));

        var totalOriginalSizeBytes = new ConcurrentTally();
        var totalGzipSizeBytes = new ConcurrentTally();
        var totalBrotliSizeBytes = new ConcurrentTally();
        var totalZstdSizeBytes = new ConcurrentTally();

        await Parallel.ForEachAsync(compressibleFilePaths, async (filePath, cancellationToken) =>
        {
            var originalSizeBytes = new FileInfo(filePath).Length;
            var countsForTotal = !filePath.EndsWith(".map");
            if(countsForTotal) await totalOriginalSizeBytes.Add(originalSizeBytes);

            if(originalSizeBytes < 1024)
            {
                await Console.Out.WriteLineAsync($"Skipping file \"{filePath}\" because it is already smaller than 1kB");

                if(countsForTotal)
                {
                    await totalGzipSizeBytes.Add(originalSizeBytes);
                    await totalBrotliSizeBytes.Add(originalSizeBytes);
                    await totalZstdSizeBytes.Add(originalSizeBytes);
                }

                return;
            }

            using var inputStream = File.OpenRead(filePath);

            async Task Compress(string suffix, Func<Stream, Stream> makeCompressedStream, ConcurrentTally tally)
            {
                var compressedPath = $"{filePath}.{suffix}";
                using(var compressedFileStream = File.Create(compressedPath))
                {
                    using var compressedStream = makeCompressedStream(compressedFileStream);
                    await inputStream.CopyToAsync(compressedStream, cancellationToken);
                }

                var compressedSizeBytes = new FileInfo(compressedPath).Length;
                var compressionRatio = (double)compressedSizeBytes / (double)originalSizeBytes;
                if(compressionRatio > maxCompressionRatio)
                {
                    await Console.Out.WriteLineAsync($"Skipping {suffix} compression of file \"{filePath}\" because the compression ratio ({compressionRatio}) was poor");
                    File.Delete(compressedPath);
                    if(countsForTotal) await tally.Add(originalSizeBytes);
                }
                else if(countsForTotal)
                {
                    await tally.Add(compressedSizeBytes);
                }
            }

            await Compress("gz", fs => new GZipStream(fs, CompressionLevel.SmallestSize), totalGzipSizeBytes);
            inputStream.Seek(0, SeekOrigin.Begin);
            await Compress("br", fs => new BrotliStream(fs, CompressionLevel.SmallestSize), totalBrotliSizeBytes);
            inputStream.Seek(0, SeekOrigin.Begin);
            // Browsers don't support zstd "ultra" levels (>19)
            await Compress("zst", fs => new ZstdSharp.CompressionStream(fs, level: 19), totalZstdSizeBytes);
        });

        async Task PrintStats(string name, ConcurrentTally tally)
        {
            var ratio = tally.Value / (double)totalOriginalSizeBytes.Value;
            await Console.Out.WriteLineAsync($"{name} size: {HumaniseBytes(tally.Value)} ({ratio * 100.0:F2}% of original size)");
        }

        await PrintStats("Original", totalOriginalSizeBytes);
        await PrintStats("Gzipped", totalGzipSizeBytes);
        await PrintStats("Brotlid", totalBrotliSizeBytes);
        await PrintStats("Zstd", totalZstdSizeBytes);
    }

    public static Task Main(string[] args)
    {
        var pathOption = new Argument<DirectoryInfo>("path", "Directory to compress");
        var rootCommand = new RootCommand("Compresses static web content");
        rootCommand.AddArgument(pathOption);
        rootCommand.SetHandler(dir => Compress(dir.FullName), pathOption);
        return rootCommand.InvokeAsync(args);
    }
}

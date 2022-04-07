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
    private static readonly string[] fileSizeSuffixes = new[]{ "B", "KiB", "MiB", "GiB", "TiB" };

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
    public static async Task Main(string path)
    {
        var compressibleExtensions = new[]
        {
            "css",
            "js",
            "html",
            "svg",
            "txt",
            "xml",
            "json",
            "ico",
            "map", // Source maps
            "ttf",
            "eot"
        };
        var compressibleFilePaths = compressibleExtensions
            .SelectMany(e => Directory.EnumerateFiles(path, $"*.{e}", SearchOption.AllDirectories));

        var totalOriginalSizeBytes = new ConcurrentTally();
        var totalGzipSizeBytes = new ConcurrentTally();
        var totalBrotliSizeBytes = new ConcurrentTally();

        await Parallel.ForEachAsync(compressibleFilePaths, async (filePath, _) =>
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
                }

                return;
            }

            using var inputStream = File.OpenRead(filePath);

            var fileGzPath = $"{filePath}.gz";
            using(var gzippedFileStream = File.Create(fileGzPath))
            {
                using var gzipStream = new GZipStream(gzippedFileStream, CompressionLevel.SmallestSize);
                await inputStream.CopyToAsync(gzipStream);
            }

            var gzSizeBytes = new FileInfo(fileGzPath).Length;
            var gzRatio = (double)gzSizeBytes / (double)originalSizeBytes;
            if(gzRatio > maxCompressionRatio)
            {
                await Console.Out.WriteLineAsync($"Skipping gzip compression of file \"{filePath}\" because the compression ratio ({gzRatio}) was poor");
                File.Delete(fileGzPath);
                if(countsForTotal) await totalGzipSizeBytes.Add(originalSizeBytes);
            }
            else if(countsForTotal)
            {
                await totalGzipSizeBytes.Add(gzSizeBytes);
            }

            inputStream.Seek(0, SeekOrigin.Begin);

            var fileBrPath = $"{filePath}.br";
            using(var brotlidFileStream = File.Create(fileBrPath))
            {
                using var brotliStream = new BrotliStream(brotlidFileStream, CompressionLevel.SmallestSize);
                await inputStream.CopyToAsync(brotliStream);
            }

            var brSizeBytes = new FileInfo(fileBrPath).Length;
            var brRatio = (double)brSizeBytes / (double)originalSizeBytes;
            if(brRatio > maxCompressionRatio)
            {
                await Console.Out.WriteLineAsync($"Skipping brotli compression of file \"{filePath}\" because the compression ratio ({brRatio}) was poor");
                File.Delete(fileBrPath);
                if(countsForTotal) await totalBrotliSizeBytes.Add(originalSizeBytes);
            }
            else if(countsForTotal)
            {
                await totalBrotliSizeBytes.Add(brSizeBytes);
            }
        });

        await Console.Out.WriteLineAsync($"Original size: {HumaniseBytes(totalOriginalSizeBytes.Value)}");
        var gzRatio = (double)totalGzipSizeBytes.Value / (double)totalOriginalSizeBytes.Value;
        await Console.Out.WriteLineAsync($"Gzipped size: {HumaniseBytes(totalGzipSizeBytes.Value)} ({gzRatio * 100.0:F2}% of original size)");
        var brRatio = (double)totalBrotliSizeBytes.Value / (double)totalOriginalSizeBytes.Value;
        await Console.Out.WriteLineAsync($"Brotlid size: {HumaniseBytes(totalBrotliSizeBytes.Value)} ({brRatio * 100.0:F2}% of original size)");
    }
}

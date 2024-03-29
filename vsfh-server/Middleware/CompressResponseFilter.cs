using Microsoft.AspNetCore.Mvc.Filters;
using System.Text.RegularExpressions;
using System.IO.Compression;

namespace VerySimpleFileHost.Middleware;

public class CompressResponseAttribute : ActionFilterAttribute
{
    private const string brotli = "br";
    private const string gzip = "gzip";

    // Quality must be between 0 and 1
    private static readonly Regex qualityRegex = new Regex(@"q=([01]\.?\d+)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private enum Encoding
    {
        Brotli,
        Gzip
    }

    private Encoding? ParseEncoding(string encoding)
    {
        return encoding switch
        {
            brotli => Encoding.Brotli,
            gzip => Encoding.Gzip,
            _ => null
        };
    }

    public override void OnActionExecuted(ActionExecutedContext filterContext)
    {
        var acceptedEncodings = filterContext.HttpContext.Request.Headers["Accept-Encoding"]
            .Where(sv => sv is not null)
            .SelectMany(sv => sv!.Split(','));

        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
        Encoding? preferredEncoding = null;
        float preferredEncodingQuality = 0.0f;
        foreach (var encoding in acceptedEncodings)
        {
            Encoding? parsedEncoding = null;
            float parsedEncodingQuality = 0.0f;

            var split = encoding.Trim().Split(';');

            if (split.Length < 1 || split.Length > 2) continue;

            parsedEncoding = ParseEncoding(split[0]);

            if(!parsedEncoding.HasValue) continue;

            if(split.Length == 2)
            {
                var match = qualityRegex.Match(split[1]);
                if(!match.Success) continue;
                if(!float.TryParse(match.Groups[1].Value, out parsedEncodingQuality)) continue;
            }

            if (preferredEncoding is null || parsedEncodingQuality > preferredEncodingQuality)
            {
                preferredEncoding = parsedEncoding;
            }
            else if (parsedEncodingQuality == preferredEncodingQuality && parsedEncoding == Encoding.Brotli)
            {
                // If the client places equal preference on gzip and brotli, we as the server should prefer brotli
                preferredEncoding = parsedEncoding;
            }

            if (preferredEncodingQuality == 1.0f && preferredEncoding == Encoding.Brotli)
            {
                // Brotli is a top preference of both the client and the server, no point checking anything else
                break;
            }
        }

        if (preferredEncoding is null)
        {
            base.OnActionExecuted(filterContext);
            return;
        }

        var response = filterContext.HttpContext.Response;
        // TODO_JU Use pipelines? https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/request-response?view=aspnetcore-6.0
        if (preferredEncoding == Encoding.Brotli)
        {
            response.Headers.Add("Content-Encoding", brotli);
            response.Body = new BrotliStream(response.Body, CompressionLevel.Fastest);
        }
        else // gzip
        {
            response.Headers.Add("Content-Encoding", gzip);
            response.Body = new GZipStream(response.Body, CompressionLevel.Fastest);
        }

        base.OnActionExecuted(filterContext);
    }

    public override void OnResultExecuted(ResultExecutedContext context)
    {
        var body = context.HttpContext.Response.Body;
        if(body is BrotliStream || body is GZipStream)
        {
            // BrotliStream needs to write a trailer or else it will fail in some browsers (Firefox 102+)
            // Do it for GZipStream as well because although I haven't seen any issues without DisposeAsync(),
            // I also don't see any issues with DisposeAsync()
            context.HttpContext.Response.Body.DisposeAsync();
        }
        base.OnResultExecuted(context);
    }
}
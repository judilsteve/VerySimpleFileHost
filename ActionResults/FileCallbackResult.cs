using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;

namespace VerySimpleFileHost.ActionResults;

// Nicked from https://blog.stephencleary.com/2016/11/streaming-zip-on-aspnet-core.html
public class FileCallbackResult : FileResult
{
    private readonly Func<Stream, ActionContext, Task> callback;

    public FileCallbackResult(
        Func<Stream, ActionContext, Task> callback,
        string mimeType)
        : base(mimeType)
    {
        this.callback = callback;
    }

    public override Task ExecuteResultAsync(ActionContext context)
    {
        var executor = new FileCallbackResultExecutor(
            context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>());
        return executor.ExecuteAsync(context, this);
    }

    private class FileCallbackResultExecutor : FileResultExecutorBase
    {
        public FileCallbackResultExecutor(ILoggerFactory loggerFactory)
            : base(CreateLogger<FileCallbackResultExecutor>(loggerFactory))
        {
        }

        public Task ExecuteAsync(ActionContext context, FileCallbackResult result)
        {
            SetHeadersAndLog(context, result, null, enableRangeProcessing: false);
            return result.callback(context.HttpContext.Response.Body, context);
        }
    }
}
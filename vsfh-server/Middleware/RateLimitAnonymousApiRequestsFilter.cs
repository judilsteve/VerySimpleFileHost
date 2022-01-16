using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace VerySimpleFileHost.Middleware;

/// <summary>
/// Extremely rudimentary DDoS protection.
/// This is mostly here to protect the host from being overloaded.
/// By "the host" we mean the other processes on the machine, not
/// our application.
/// In the event of a DDoS attack, the response time of anonymous
/// API endpoints will still be extremely degraded for real users.
/// </summary>
// TODO_JU Turn this into a simple static member that lives in the login controller,
// and applies a concurrency limit to *just* the hash checking
public class RateLimitAnonymousApiRequestsFilter : IAsyncActionFilter
{
    private readonly SemaphoreSlim semaphore;
    private readonly TimeSpan timeout;

    public RateLimitAnonymousApiRequestsFilter(int maxConcurrentRequests, TimeSpan anonymousRequestTimeout)
    {
        semaphore = new SemaphoreSlim(maxConcurrentRequests, maxConcurrentRequests);
        timeout = anonymousRequestTimeout;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if(context.HttpContext.User.Identity?.IsAuthenticated ?? false)
        {
            await next();
        }
        else
        {
            // Setting a timeout here ensures that requests don't back up
            var enteredSemaphor = await semaphore.WaitAsync(timeout, context.HttpContext.RequestAborted);
            if(!enteredSemaphor)
            {
                context.Result = new StatusCodeResult(StatusCodes.Status503ServiceUnavailable);
            }
            try
            {
                // Enforce a timeout on the endpoint function so that
                // attackers can't use slow loris attacks to keep the
                // semaphore full indefinitely, which would prevent
                // real requests from getting through
                // TODO_JU This timeout will not actually abort the work
                // happening inside nextTask unless it is observing RequestAborted
                var nextTask = next();
                if(await Task.WhenAny(nextTask, Task.Delay(timeout, context.HttpContext.RequestAborted)) != nextTask)
                {
                    throw new Exception("Request processing timed out");
                }
            }
            finally
            {
                semaphore.Release();
            }
        }
    }
}

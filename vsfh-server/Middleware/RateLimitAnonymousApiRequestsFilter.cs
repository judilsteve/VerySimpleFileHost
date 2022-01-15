using Microsoft.AspNetCore.Mvc.Filters;

namespace VerySimpleFileHost.Middleware;

/// <summary>
/// Extremely rudimentary DDoS protection.
/// This is mostly here to protect the host from being overloaded.
/// In the event of a DDoS attack, the response time of anonymous
/// API endpoints will still be extremely degraded for real users.
/// </summary>
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
            await semaphore.WaitAsync();
            try
            {
                // Enforce a timeout on the endpoint function so that
                // attackers can't use slow loris attacks to keep the
                // semaphore full indefinitely, which would prevent
                // real requests from getting through
                var nextTask = next();
                if(await Task.WhenAny(nextTask, Task.Delay(timeout)) != nextTask)
                {
                    // We hit the timeout
                    throw new Exception("Request processing timed out");
                }
                await next();
            }
            finally
            {
                semaphore.Release();
            }
        }
    }
}

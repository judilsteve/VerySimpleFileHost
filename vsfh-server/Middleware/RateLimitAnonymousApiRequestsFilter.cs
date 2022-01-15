using Microsoft.AspNetCore.Mvc.Filters;

namespace VerySimpleFileHost.Middleware;

/// <summary>
/// Extremely rudimentary DDoS protection.
/// </summary>
public class RateLimitAnonymousApiRequestsFilter : IAsyncActionFilter
{
    private readonly SemaphoreSlim semaphore;

    public RateLimitAnonymousApiRequestsFilter(int maxConcurrentRequests)
    {
        semaphore = new SemaphoreSlim(0, maxConcurrentRequests);
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // TODO_JU Test this
        if(context.HttpContext.User.Identity?.IsAuthenticated ?? false)
        {
            await next();
        }
        else
        {
            await semaphore.WaitAsync();
            try
            {
                await next();
            }
            finally
            {
                semaphore.Release();
            }
        }
    }
}

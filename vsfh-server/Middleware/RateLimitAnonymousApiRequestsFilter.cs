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
        // TODO_JU Test this:
        //  - Fill up the semaphore and then attempt to make another unauthenticated API request
        //      Should spin until a slot becomes available
        //  - Fill up the semaphore and then attempt to load the login page without an auth cookie
        //      Page should still load (this filter shouldn't affect static content, only API requests)
        //  - Fill up the semaphore and then attempt to make an *authenticated* API request
        //      Should still load
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

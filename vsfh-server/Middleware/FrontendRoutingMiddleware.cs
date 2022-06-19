using VerySimpleFileHost.Database;

namespace VerySimpleFileHost.Middleware;

/// <summary>
/// Routes users to the correct frontend page for their particular situation.
/// This must be kept in sync with the frontend routing system in vsfh-client,
/// which is a hassle but it avoids running node for SSR and there's not really
/// much business logic here anyway.
/// </summary>
public class FrontendRoutingMiddleware
{
    private readonly RequestDelegate next;

    public FrontendRoutingMiddleware(RequestDelegate next)
    {
        this.next = next;
    }

    private const string browse = "/Browse/";

    public async Task InvokeAsync(HttpContext httpContext, VsfhContext dbContext)
    {
        if(httpContext.Request.Path == "/") httpContext.Request.Path = browse;
        var isAdminPageRequest = httpContext.Request.Path.StartsWithSegments("/Admin", StringComparison.InvariantCultureIgnoreCase);
        if(httpContext.Request.Path.Equals(browse, StringComparison.InvariantCultureIgnoreCase) || isAdminPageRequest)
        {
            if(!(httpContext.User.Identity?.IsAuthenticated ?? false))
            {
                httpContext.Response.Redirect($"/Login/?then={Uri.EscapeDataString(httpContext.Request.Path)}", permanent: false);
                return;
            }
            if(isAdminPageRequest)
            {
                if(!(await AdminOnlyFilter.UserIsAdmin(httpContext, dbContext)))
                {
                    httpContext.Response.Redirect($"/Error/Unauthorised/", permanent: false);
                    return;
                }
            }
        }
        await next(httpContext);
    }
}
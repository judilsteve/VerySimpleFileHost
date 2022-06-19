using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Utils;

namespace VerySimpleFileHost.Middleware;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AdminOnlyAttribute : Attribute
{
}

public class AdminOnlyFilter : IAsyncAuthorizationFilter
{
    public static async Task<bool> UserIsAdmin(HttpContext httpContext, VsfhContext dbContext)
    {
        var isAdmin = false;
        var userIdString = httpContext.User.Identity?.Name;
        if(userIdString is not null)
        {
            isAdmin = await dbContext.Users
                .Where(u => u.Id == Guid.Parse(userIdString))
                .Select(u => (bool?)u.IsAdministrator)
                .SingleOrDefaultAsync()
                ?? false;
        }
        return isAdmin;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var actionDescriptor = (context.ActionDescriptor as ControllerActionDescriptor);
        var attributes = (actionDescriptor?.MethodInfo.CustomAttributes ?? Enumerable.Empty<CustomAttributeData>())
            .Concat(actionDescriptor?.ControllerTypeInfo.CustomAttributes ?? Enumerable.Empty<CustomAttributeData>());

        if(!attributes.Any(ca => ca.AttributeType == typeof(AdminOnlyAttribute)))
        {
            return;
        }

        var services = context.HttpContext.RequestServices;
        var dbContext = services.GetRequiredService<VsfhContext>();

        if(!(await UserIsAdmin(context.HttpContext, dbContext)))
        {
            await TaskUtils.RandomWait();
            context.Result = new ForbidResult();
        }
    }
}
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
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var actionDescriptor = (context.ActionDescriptor as ControllerActionDescriptor);
        var attributes = (actionDescriptor?.MethodInfo.CustomAttributes ?? Enumerable.Empty<CustomAttributeData>())
            .Concat(actionDescriptor?.ControllerTypeInfo.CustomAttributes ?? Enumerable.Empty<CustomAttributeData>());

        var services = context.HttpContext.RequestServices;
        var dbContext = services.GetRequiredService<VsfhContext>();

        var isAdmin = await dbContext.Users
            .Where(u => u.Id == Guid.Parse(context.HttpContext.User.Identity!.Name!))
            .Select(u => (bool?)u.IsAdministrator)
            .SingleOrDefaultAsync();

        if(isAdmin != true)
        {
            if(attributes.Any(ca => ca.AttributeType == typeof(AdminOnlyAttribute)))
            {
                await TaskUtils.RandomWait();
                context.Result = new ForbidResult();
            }
        }
    }
}
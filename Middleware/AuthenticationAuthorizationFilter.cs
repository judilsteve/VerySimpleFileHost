using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using System.Globalization;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Utils;

namespace VerySimpleFileHost.Middleware;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AllowExpiredPasswordAttribute : Attribute
{
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AdminOnlyAttribute : Attribute
{
}

public class AuthenticationAuthorizationFilter : IAsyncAuthorizationFilter
{
    public const string CookieCreatedOnUtcClaimType = "CookieCreatedOnUtc";
    public const string CookieCreatedOnUtcDateFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";

    private enum CheckResult
    {
        Allow,
        FailAuthentication,
        FailAuthorization
    }

    private static async Task<CheckResult> RequestIsAllowed(AuthorizationFilterContext context)
    {
        var actionDescriptor = (context.ActionDescriptor as ControllerActionDescriptor);
        var attributes = (actionDescriptor?.MethodInfo.CustomAttributes ?? Enumerable.Empty<CustomAttributeData>())
            .Concat(actionDescriptor?.ControllerTypeInfo.CustomAttributes ?? Enumerable.Empty<CustomAttributeData>());

        if(attributes.Any(ca => ca.AttributeType == typeof(AllowAnonymousAttribute)))
            return CheckResult.Allow;

        var services = context.HttpContext.RequestServices;
        var dbContext = services.GetRequiredService<VsfhContext>();
        var config = services.GetRequiredService<AuthenticationConfiguration>();

        var userSecurityInfo = await dbContext.Users
            .Where(u => u.Id == Guid.Parse(context.HttpContext.User.Identity!.Name!))
            .Select(u => new
            {
                u.IsAdministrator,
                u.LastAuthChangeUtc,
                HasPassword = u.PasswordHash != null
            })
            .SingleOrDefaultAsync();

        if(userSecurityInfo is null)
        {
            return CheckResult.FailAuthentication;
        }

        var lastAuthChange = DateTime.SpecifyKind(userSecurityInfo.LastAuthChangeUtc, DateTimeKind.Utc);
        var cookieCreatedOn = DateTimeOffset.ParseExact(
            context.HttpContext.User.Claims
                .Where(c => c.Type == CookieCreatedOnUtcClaimType)
                .Select(c => c.Value)
                .Single(),
            CookieCreatedOnUtcDateFormat,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal);
        if(cookieCreatedOn < lastAuthChange)
        {
            return CheckResult.FailAuthentication;
        }

        if(PasswordUtils.PasswordExpired(lastAuthChange, config.PasswordExpiryDays))
        {
            var allowExpiredPassword = attributes
                .Any(ca => ca.AttributeType == typeof(AllowExpiredPasswordAttribute));

            if(!allowExpiredPassword)
            {
                return CheckResult.FailAuthorization;
            }
        }

        if(attributes.Any(ca => ca.AttributeType == typeof(AdminOnlyAttribute)))
        {
            if(!userSecurityInfo.IsAdministrator)
            {
                return CheckResult.FailAuthorization;
            }
        }

        return CheckResult.Allow;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var checkResult = await RequestIsAllowed(context);
        if(checkResult != CheckResult.Allow)
        {
            await TaskUtils.RandomWait();
            context.Result = checkResult switch
            {
                CheckResult.FailAuthentication => new UnauthorizedResult(),
                CheckResult.FailAuthorization => new ForbidResult(),
                _ => throw new ArgumentException("Unhandled check result", nameof(checkResult))
            };
        }
    }
}
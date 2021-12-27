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

public enum AuthenticationFailureReasonCode
{
    PasswordExpired,
    InvalidCredentials,
    InvalidInviteKey
}

public class AuthenticationFailureDto
{
    public static AuthenticationFailureDto PasswordExpired(string userName) => new()
    {
        ReasonCode = AuthenticationFailureReasonCode.PasswordExpired,
        Reason = "Your password has expired and must be changed",
        UserName = userName
    };

    public static readonly AuthenticationFailureDto InvalidCredentials = new()
    {
        ReasonCode = AuthenticationFailureReasonCode.InvalidCredentials,
        Reason = "Incorrect username or password"
    };

    public static readonly AuthenticationFailureDto InvalidInviteKey = new()
    {
        ReasonCode = AuthenticationFailureReasonCode.InvalidInviteKey,
        Reason = "Invalid or expired invite key"
    };

    public AuthenticationFailureReasonCode? ReasonCode { get; init; }
    public string? Reason { get; init; }
    public string? UserName { get; init; }
}

public class AuthenticationFilter : IAsyncAuthorizationFilter
{
    public const string CookieCreatedOnUtcClaimType = "CookieCreatedOnUtc";
    public const string CookieCreatedOnUtcDateFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";

    private static async Task<(bool, AuthenticationFailureDto?)> RequestIsAllowed(AuthorizationFilterContext context)
    {
        var actionDescriptor = (context.ActionDescriptor as ControllerActionDescriptor);
        var attributes = (actionDescriptor?.MethodInfo.CustomAttributes ?? Enumerable.Empty<CustomAttributeData>())
            .Concat(actionDescriptor?.ControllerTypeInfo.CustomAttributes ?? Enumerable.Empty<CustomAttributeData>());

        if(attributes.Any(ca => ca.AttributeType == typeof(AllowAnonymousAttribute)))
            return (true, null);

        var services = context.HttpContext.RequestServices;
        var dbContext = services.GetRequiredService<VsfhContext>();
        var config = services.GetRequiredService<AuthenticationConfiguration>();

        var userSecurityInfo = await dbContext.Users
            .Where(u => u.Id == Guid.Parse(context.HttpContext.User.Identity!.Name!))
            .Select(u => new
            {
                u.IsAdministrator,
                u.LoginName,
                u.LastPasswordChangeUtc,
                u.RejectCookiesOlderThanUtc,
                HasPassword = u.PasswordHash != null
            })
            .SingleOrDefaultAsync();

        if(userSecurityInfo is null)
        {
            return (false, null);
        }

        var cookieCreatedOn = DateTimeOffset.ParseExact(
            context.HttpContext.User.Claims
                .Where(c => c.Type == CookieCreatedOnUtcClaimType)
                .Select(c => c.Value)
                .Single(),
            CookieCreatedOnUtcDateFormat,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal);
        if(cookieCreatedOn < userSecurityInfo.RejectCookiesOlderThanUtc)
        {
            return (false, null);
        }

        if(PasswordUtils.PasswordExpired(userSecurityInfo.LastPasswordChangeUtc, config.PasswordExpiryDays))
        {
            return (false, AuthenticationFailureDto.PasswordExpired(userSecurityInfo.LoginName!));
        }

        return (true, null);
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var (allowed, failureDto) = await RequestIsAllowed(context);
        if(!allowed)
        {
            await TaskUtils.RandomWait();
            context.Result = new UnauthorizedObjectResult(failureDto);
        }
    }
}
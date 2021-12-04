using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Utils;
using VerySimpleFileHost.Middleware;

namespace VerySimpleFileHost.Controllers;

[ApiController]
[Route("[controller]")]
public class LoginController : Controller
{
    private readonly VsfhContext context;
    private readonly AuthenticationConfiguration configuration;

    public LoginController(
        VsfhContext context,
        AuthenticationConfiguration configuration
    )
    {
        this.context = context;
        this.configuration = configuration;
    }

    public class LoginAttemptDto
    {
        public string UserName { get; init; } = null!;
        public string Password { get; init; } = null!;
        [Required] public bool? RememberMe { get; init; }
    }

    public class UserSecurityInfoDto
    {
        public bool IsAdministrator { get; set; }
        public bool MustChangePassword { get; set; }
    }

    private const string RememberMeClaimName = "RememberMe";

    private async Task GrantAuthCookie(Guid userId, bool rememberMe)
    {
        var loginDateTimeUtc = DateTimeOffset.UtcNow;
        IEnumerable<Claim> GetClaims()
        {
            yield return new Claim(ClaimTypes.Name, userId.ToString());
            yield return new Claim(
                AuthenticationAuthorizationFilter.CookieCreatedOnUtcClaimType,
                loginDateTimeUtc.ToString(AuthenticationAuthorizationFilter.CookieCreatedOnUtcDateFormat));
            yield return new Claim(RememberMeClaimName, rememberMe.ToString());
        }

        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(
            GetClaims(), CookieAuthenticationDefaults.AuthenticationScheme));

        var authProperties = new AuthenticationProperties
        {
            AllowRefresh = true,
            ExpiresUtc = configuration.CookieExpiryMinutes.HasValue
                ? loginDateTimeUtc.AddMinutes(configuration.CookieExpiryMinutes.Value)
                : null,
            IsPersistent = rememberMe,
            IssuedUtc = loginDateTimeUtc
        };

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            claimsPrincipal,
            authProperties);
    }

    public class AcceptInviteDto
    {
        public string InviteKey { get; init; } = null!;
        public string NewPassword { get; init; } = null!;
        [Required] public bool? RememberMe { get; init; }
    }

    [HttpPost($"{nameof(AcceptInvite)}/{{inviteKey}}")]
    [AllowAnonymous]
    public async Task<ActionResult> AcceptInvite(AcceptInviteDto acceptDto)
    {
        if(acceptDto.RememberMe!.Value && !configuration.AllowRememberMe)
            return BadRequest("The administrator has disabled the \"Remember Me\" option");

        var user = await context.Users
            .AsTracking()
            .SingleOrDefaultAsync(u => u.InviteKey == WebEncoders.Base64UrlDecode(acceptDto.InviteKey));

        if(user is null)
        {
            await TaskUtils.RandomWait();
            return Unauthorized();
        }

        if(configuration.InviteLinkExpiryHours.HasValue)
        {
            var inviteKeyExpiryUtc = DateTime.SpecifyKind(user.LastAuthChangeUtc, DateTimeKind.Utc)
                .AddHours(configuration.InviteLinkExpiryHours.Value);
            if(inviteKeyExpiryUtc < DateTimeOffset.UtcNow)
            {
                await TaskUtils.RandomWait();
                return Forbid();
            }
        }

        var score = Zxcvbn.Core.EvaluatePassword(acceptDto.NewPassword).Score;
        if(score < configuration.MinimumPasswordScore)
            return BadRequest("New password would be too weak");

        user.InviteKey = null; // Ensure that the invite key cannot be used again
        user.PasswordSalt = PasswordUtils.GenerateSalt();
        user.PasswordHash = PasswordUtils.GenerateSaltedHash(acceptDto.NewPassword, user.PasswordSalt);
        user.LastAuthChangeUtc = DateTime.UtcNow;
        await context.SaveChangesAsync();

        await GrantAuthCookie(user.Id, acceptDto.RememberMe!.Value);

        return Ok();
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<UserSecurityInfoDto>> Login(LoginAttemptDto loginAttempt)
    {
        if(loginAttempt.RememberMe!.Value && !configuration.AllowRememberMe)
            return BadRequest("The administrator has disabled the \"Remember Me\" option");

        var userDetails = await context.Users
            .Where(u => u.Name == loginAttempt.UserName)
            .Select(u => new
            {
                u.Id,
                u.IsAdministrator,
                u.PasswordSalt,
                u.PasswordHash,
                u.LastAuthChangeUtc
            })
            .SingleOrDefaultAsync();

        if(userDetails?.PasswordHash is null)
        {
            await TaskUtils.RandomWait();
            return Unauthorized();
        }

        if(!PasswordUtils.PasswordIsCorrect(loginAttempt.Password, userDetails.PasswordHash, userDetails.PasswordSalt!))
        {
            await TaskUtils.RandomWait();
            return Forbid();
        }

        await GrantAuthCookie(userDetails.Id, loginAttempt.RememberMe!.Value);

        return new UserSecurityInfoDto
        {
            IsAdministrator = userDetails.IsAdministrator,
            MustChangePassword = PasswordUtils.PasswordExpired(
                DateTime.SpecifyKind(userDetails.LastAuthChangeUtc, DateTimeKind.Utc),
                configuration.PasswordExpiryDays)
        };
    }

    [HttpPost(nameof(Logout))]
    public async Task<ActionResult> Logout()
    {
        var user = await context.Users
            .AsTracking()
            .SingleAsync(u => u.Id == Guid.Parse(HttpContext.User.Identity!.Name!));
        user.LastAuthChangeUtc = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok();
    }

    public class ChangePasswordAttemptDto
    {
        public string? CurrentPassword { get; init; }
        public string NewPassword { get; init; } = null!;
    }

    [HttpPut(nameof(ChangePassword))]
    [AllowExpiredPassword]
    public async Task<ActionResult> ChangePassword(ChangePasswordAttemptDto changePasswordAttempt)
    {
        var score = Zxcvbn.Core.EvaluatePassword(changePasswordAttempt.NewPassword).Score;
        if(score < configuration.MinimumPasswordScore)
            return BadRequest("New password would be too weak");

        if(changePasswordAttempt.CurrentPassword == changePasswordAttempt.NewPassword)
            return BadRequest("New password cannot be the same as current password");

        var user = await context.Users
            .AsTracking()
            .SingleAsync(u => u.Id == Guid.Parse(HttpContext.User.Identity!.Name!));

        if(user.PasswordHash is not null)
        {
            if(changePasswordAttempt.CurrentPassword is null
                || !PasswordUtils.PasswordIsCorrect(changePasswordAttempt.CurrentPassword, user.PasswordHash, user.PasswordSalt!))
            {
                await TaskUtils.RandomWait();
                return Unauthorized();
            }
        }

        user.PasswordSalt = PasswordUtils.GenerateSalt();
        user.PasswordHash = PasswordUtils.GenerateSaltedHash(changePasswordAttempt.NewPassword, user.PasswordSalt);
        user.LastAuthChangeUtc = DateTime.UtcNow;

        await context.SaveChangesAsync();

        // Use the user's existing auth cookie to decide
        // if the new session should be persistent
        var rememberMe = HttpContext.User.Claims
            .Where(c => c.Type == RememberMeClaimName)
            .Select(c => bool.Parse(c.Value))
            .Single();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        await GrantAuthCookie(user.Id, rememberMe);

        return Ok();
    }
}
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

public class LoginController : ControllerBase
{
    private readonly VsfhContext context;
    private readonly AuthenticationConfiguration config;

    public LoginController(
        VsfhContext context,
        AuthenticationConfiguration config
    )
    {
        this.context = context;
        this.config = config;
    }

    public class LoginAttemptDto
    {
        [MinLength(1)] public string UserName { get; init; } = null!;
        [MinLength(1)] public string Password { get; init; } = null!;
        [Required] public bool? RememberMe { get; init; }
    }

    private const string RememberMeClaimName = "RememberMe";

    private async Task GrantAuthCookie(Guid userId, bool rememberMe)
    {
        var loginDateTimeUtc = DateTimeOffset.UtcNow;
        IEnumerable<Claim> GetClaims()
        {
            yield return new Claim(ClaimTypes.Name, userId.ToString());
            yield return new Claim(
                AuthenticationFilter.CookieCreatedOnUtcClaimType,
                loginDateTimeUtc.ToString(AuthenticationFilter.CookieCreatedOnUtcDateFormat));
            yield return new Claim(RememberMeClaimName, rememberMe.ToString());
        }

        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(
            GetClaims(), CookieAuthenticationDefaults.AuthenticationScheme));

        var authProperties = new AuthenticationProperties
        {
            AllowRefresh = true,
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
        [MinLength(1)] public string InviteKey { get; init; } = null!;
        [MinLength(1)] public string UserName { get; init; } = null!;
        [MinLength(1)] public string NewPassword { get; init; } = null!;
        [Required] public bool? RememberMe { get; init; }
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult> AcceptInvite(AcceptInviteDto acceptDto)
    {
        if(acceptDto.RememberMe!.Value && !config.AllowRememberMe)
            return BadRequest("The administrator has disabled the \"Remember Me\" option");

        var user = await context.Users
            .AsTracking()
            // This Where statement provides a little extra protection in case an
            // attacker manages to hit this endpoint with a null InviteKey (which
            // shouldn't happen anyway because of the input validation on the DTO).
            // In the case where a null/empty invite key is sent, were it not for
            // this Where statement, the query would simply return the first
            // already-activated user (since their invite key would be null) and
            // set their password to whatever the attacker desires
            .Where(u => u.InviteKey != null)
            .SingleOrDefaultAsync(u => u.InviteKey == WebEncoders.Base64UrlDecode(acceptDto.InviteKey));

        if(user is null)
        {
            await TaskUtils.RandomWait();
            return Unauthorized(AuthenticationFailureDto.InvalidInviteKey);
        }

        if(config.InviteLinkExpiryHours.HasValue)
        {
            var inviteKeyExpiryUtc = user.LastPasswordChangeUtc
                .AddHours(config.InviteLinkExpiryHours.Value);
            if(inviteKeyExpiryUtc < DateTimeOffset.UtcNow)
            {
                await TaskUtils.RandomWait();
                return Unauthorized(AuthenticationFailureDto.InvalidInviteKey);
            }
        }

        var score = Zxcvbn.Core.EvaluatePassword(acceptDto.NewPassword).Score;
        if(score < config.MinimumPasswordScore)
            return BadRequest("New password would be too weak");

        user.InviteKey = null; // Ensure that the invite key cannot be used again
        user.LoginName = acceptDto.UserName;
        user.PasswordSaltedHash = PasswordUtils.GenerateSaltedHash(acceptDto.NewPassword);
        user.LastPasswordChangeUtc = DateTime.UtcNow;
        user.RejectCookiesOlderThanUtc = DateTime.UtcNow;

        try
        {
            await context.TrySaveChangesAsync();
        }
        catch(UniqueIndexConstraintViolationException)
        {
            return BadRequest("A user with this name already exists");
        }

        await GrantAuthCookie(user.Id, acceptDto.RememberMe!.Value);

        return Ok();
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult> Login(LoginAttemptDto loginAttempt)
    {
        if(loginAttempt.RememberMe!.Value && !config.AllowRememberMe)
            return BadRequest("The administrator has disabled the \"Remember Me\" option");

        var userDetails = await context.Users
            .Where(u => u.LoginName == loginAttempt.UserName)
            .Select(u => new
            {
                u.Id,
                u.LastPasswordChangeUtc,
                u.PasswordSaltedHash
            })
            .SingleOrDefaultAsync();

        if(userDetails?.PasswordSaltedHash is null ||
            !PasswordUtils.PasswordIsCorrect(loginAttempt.Password, userDetails.PasswordSaltedHash))
        {
            await TaskUtils.RandomWait();
            return Unauthorized(AuthenticationFailureDto.InvalidCredentials);
        }

        if(config.PasswordExpiryDays.HasValue)
        {
            if(userDetails.LastPasswordChangeUtc.AddDays(config.PasswordExpiryDays.Value) < DateTime.UtcNow)
            {
                await TaskUtils.RandomWait();
                return Unauthorized(AuthenticationFailureDto.PasswordExpired(loginAttempt.UserName));
            }
        }

        await GrantAuthCookie(userDetails.Id, loginAttempt.RememberMe!.Value);

        return Ok();
    }

    [HttpPost]
    public async Task<ActionResult> Logout()
    {
        var user = await context.Users
            .AsTracking()
            .SingleAsync(u => u.Id == Guid.Parse(HttpContext.User.Identity!.Name!));
        user.RejectCookiesOlderThanUtc = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok();
    }

    public class ChangePasswordAttemptDto
    {
        [MinLength(1)] public string UserName { get; set; } = null!;
        [MinLength(1)] public string CurrentPassword { get; init; } = null!;
        [MinLength(1)] public string NewPassword { get; init; } = null!;
        [Required] public bool? RememberMe { get; init; }
    }

    [HttpPut]
    [AllowAnonymous]
    public async Task<ActionResult> ChangePassword(ChangePasswordAttemptDto changePasswordAttempt)
    {
        if(changePasswordAttempt.RememberMe!.Value && !config.AllowRememberMe)
            return BadRequest("The administrator has disabled the \"Remember Me\" option");

        var score = Zxcvbn.Core.EvaluatePassword(changePasswordAttempt.NewPassword).Score;
        if(score < config.MinimumPasswordScore)
            return BadRequest("New password would be too weak");

        if(changePasswordAttempt.CurrentPassword == changePasswordAttempt.NewPassword)
            return BadRequest("New password cannot be the same as current password");

        var user = await context.Users
            .AsTracking()
            .Where(u => u.PasswordSaltedHash != null)
            .SingleOrDefaultAsync(u => u.LoginName == changePasswordAttempt.UserName);

        if(user is null ||
            !PasswordUtils.PasswordIsCorrect(changePasswordAttempt.CurrentPassword, user.PasswordSaltedHash!))
        {
            await TaskUtils.RandomWait();
            return Unauthorized(AuthenticationFailureDto.InvalidCredentials);
        }

        user.PasswordSaltedHash = PasswordUtils.GenerateSaltedHash(changePasswordAttempt.NewPassword);
        user.LastPasswordChangeUtc = DateTime.UtcNow;
        user.RejectCookiesOlderThanUtc = DateTime.UtcNow;

        await context.SaveChangesAsync();

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        await GrantAuthCookie(user.Id, changePasswordAttempt.RememberMe!.Value);

        return Ok();
    }

    public class AuthConfigDto
    {
        public int MinimumPasswordScore { get; init; }
        public bool AllowRememberMe { get; init; }
    }

    [HttpGet]
    [AllowAnonymous]
    public AuthConfigDto AuthConfig() => new AuthConfigDto
    {
        MinimumPasswordScore = config.MinimumPasswordScore,
        AllowRememberMe = config.AllowRememberMe
    };

    public class AuthStatusDto
    {
        public string UserName { get; init; } = null!;
        public bool IsAdministrator { get; init; }
    }

    [HttpGet]
    public Task<AuthStatusDto> AuthStatus() => context.Users
        .Where(u => u.Id == Guid.Parse(HttpContext.User.Identity!.Name!))
        .Select(u => new AuthStatusDto
        {
            UserName = u.LoginName!,
            IsAdministrator = u.IsAdministrator
        })
        .SingleAsync();
}
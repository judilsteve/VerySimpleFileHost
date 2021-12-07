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
        public string UserName { get; init; } = null!;
        public string Password { get; init; } = null!;
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
                AuthenticationAuthorizationFilter.CookieCreatedOnUtcClaimType,
                loginDateTimeUtc.ToString(AuthenticationAuthorizationFilter.CookieCreatedOnUtcDateFormat));
            yield return new Claim(RememberMeClaimName, rememberMe.ToString());
        }

        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(
            GetClaims(), CookieAuthenticationDefaults.AuthenticationScheme));

        var authProperties = new AuthenticationProperties
        {
            AllowRefresh = true,
            ExpiresUtc = config.CookieExpiryMinutes.HasValue
                ? loginDateTimeUtc.AddMinutes(config.CookieExpiryMinutes.Value)
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

    [HttpPost($"{nameof(AcceptInvite)}")]
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
            return Unauthorized();
        }

        if(config.InviteLinkExpiryHours.HasValue)
        {
            var inviteKeyExpiryUtc = user.LastPasswordChangeUtc
                .AddHours(config.InviteLinkExpiryHours.Value);
            if(inviteKeyExpiryUtc < DateTimeOffset.UtcNow)
            {
                await TaskUtils.RandomWait();
                return Forbid(); // TODO_JU This should tell the user why
            }
        }

        var score = Zxcvbn.Core.EvaluatePassword(acceptDto.NewPassword).Score;
        if(score < config.MinimumPasswordScore)
            return BadRequest("New password would be too weak");

        user.InviteKey = null; // Ensure that the invite key cannot be used again
        user.PasswordSalt = PasswordUtils.GenerateSalt();
        user.PasswordHash = PasswordUtils.GenerateSaltedHash(acceptDto.NewPassword, user.PasswordSalt);
        user.LastPasswordChangeUtc = DateTime.UtcNow;
        user.RejectCookiesOlderThanUtc = DateTime.UtcNow;
        await context.SaveChangesAsync();

        await GrantAuthCookie(user.Id, acceptDto.RememberMe!.Value);

        return Ok();
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult> Login(LoginAttemptDto loginAttempt)
    {
        if(loginAttempt.RememberMe!.Value && !config.AllowRememberMe)
            return BadRequest("The administrator has disabled the \"Remember Me\" option");

        var userDetailsQuery = context.Users
            .Where(u => u.Name == loginAttempt.UserName);

        if(config.PasswordExpiryDays.HasValue)
            userDetailsQuery = userDetailsQuery
                .Where(u => u.LastPasswordChangeUtc > DateTime.UtcNow.AddDays(-config.PasswordExpiryDays.Value));

        var userDetails = await userDetailsQuery
            .Select(u => new
            {
                u.Id,
                u.PasswordSalt,
                u.PasswordHash
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

        return Ok();
    }

    [HttpPost(nameof(Logout))]
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
        public string UserName { get; set; } = null!;
        public string CurrentPassword { get; init; } = null!;
        public string NewPassword { get; init; } = null!;
        [Required] public bool? RememberMe { get; init; }
    }

    [HttpPut(nameof(ChangePassword))]
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
            .Where(u => u.PasswordHash != null)
            .SingleOrDefaultAsync(u => u.Name == changePasswordAttempt.UserName);

        if(user is null ||
            !PasswordUtils.PasswordIsCorrect(changePasswordAttempt.CurrentPassword, user.PasswordHash!, user.PasswordSalt!))
        {
            await TaskUtils.RandomWait();
            return Unauthorized();
        }

        user.PasswordSalt = PasswordUtils.GenerateSalt();
        user.PasswordHash = PasswordUtils.GenerateSaltedHash(changePasswordAttempt.NewPassword, user.PasswordSalt);
        user.LastPasswordChangeUtc = DateTime.UtcNow;
        user.RejectCookiesOlderThanUtc = DateTime.UtcNow;

        await context.SaveChangesAsync();

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        await GrantAuthCookie(user.Id, changePasswordAttempt.RememberMe!.Value);

        return Ok();
    }

    [AllowAnonymous]
    [HttpGet(nameof(MinimumPasswordScore))]
    public int MinimumPasswordScore() => config.MinimumPasswordScore;

    [HttpGet(nameof(Ping))]
    public ActionResult Ping() => Ok();
}
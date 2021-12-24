using VerySimpleFileHost.Utils;

namespace VerySimpleFileHost.Configuration;

public class AuthenticationConfiguration : IValidatableConfiguration
{
    public int MinimumPasswordScore { get; init; }
    public double? CookieExpiryMinutes { get; init; }
    public bool AllowRememberMe { get; init; }
    public double? PasswordExpiryDays { get; init; }
    public double? InviteLinkExpiryHours { get; init; }

    public IEnumerable<string> Validate()
    {
        if(!ValidationUtils.ValidateRange(MinimumPasswordScore, 0, 4, nameof(MinimumPasswordScore), out var passwordScoreError))
            yield return passwordScoreError;

        if(!ValidationUtils.ValidatePositiveOrNull(CookieExpiryMinutes, nameof(CookieExpiryMinutes), out var cookieExpiryError))
            yield return cookieExpiryError;

        if(!ValidationUtils.ValidatePositiveOrNull(PasswordExpiryDays, nameof(PasswordExpiryDays), out var passwordExpiryError))
            yield return passwordExpiryError;

        if(!ValidationUtils.ValidatePositiveOrNull(InviteLinkExpiryHours, nameof(InviteLinkExpiryHours), out var inviteExpiryError))
            yield return inviteExpiryError;
    }
}
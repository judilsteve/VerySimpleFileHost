using System.ComponentModel.DataAnnotations;

namespace VerySimpleFileHost.Configuration;

public class AuthenticationConfiguration
{
    [Range(0, 4)] public int MinimumPasswordScore { get; init; }
    [Range(0, double.MaxValue)] public double? CookieExpiryMinutes { get; init; }
    public bool AllowRememberMe { get; init; }
    [Range(0, double.MaxValue)] public double? PasswordExpiryDays { get; init; }
    [Range(0, double.MaxValue)] public double? InviteLinkExpiryHours { get; init; }
    [Range(1, int.MaxValue)] public int? MaxConcurrentAnonymousApiRequests { get; init; }
    [Range(0, double.MaxValue)] public double? AnonymousRequestTimeoutSeconds { get; init; }
}
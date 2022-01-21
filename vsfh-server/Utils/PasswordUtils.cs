using Microsoft.AspNetCore.WebUtilities;
using System.Security.Cryptography;
using VerySimpleFileHost.Entities;
using Sodium;

namespace VerySimpleFileHost.Utils;

public static class PasswordUtils
{
    /// <summary>
    /// Extremely rudimentary DDoS protection.
    ///
    /// Checking a password hash is a very CPU/memory intensive operation,
    /// so if we try to do too many of them at once we can easily exhaust
    /// system resources, making the login endpoint a perfect DDoS vector.
    ///
    /// Using a concurrency limit protects the host from being overloaded.
    /// By "the host" we mean the other processes on the machine, not
    /// our application.
    ///
    /// In the event of a DDoS attack, the response time of endpoints that
    /// verify password hashes will  still be extremely degraded.
    /// </summary>
    private static readonly ConcurrencyLimiter concurrencyLimiter = new(4, TimeSpan.FromSeconds(10));

    private const PasswordHash.StrengthArgon hashStrength = PasswordHash.StrengthArgon.Moderate;

    public static bool PasswordExpired(DateTime lastPasswordChangeUtc, double? passwordExpiryDays)
    {
        if(!passwordExpiryDays.HasValue) return false;
        var passwordExpiry =  lastPasswordChangeUtc.AddDays(passwordExpiryDays.Value);
        return passwordExpiry < DateTimeOffset.UtcNow;
    }

    public static string AssignInviteKey(User user)
    {
        var inviteKey = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));

        user.PasswordSaltedHash = null;
        user.InviteKey = inviteKey;
        user.RejectCookiesOlderThanUtc = DateTime.UtcNow;
        user.LastPasswordChangeUtc = DateTime.UtcNow;

        return inviteKey;
    }

    public static string GenerateSaltedHash(string password)
    {
        var untrimmed = PasswordHash.ArgonHashString(
            password,
            hashStrength
        );

        // Sodium.Core leaves null byte terminators in this string
        // to pad it to 128 chars for some reason. Trim them off.
        // https://github.com/tabrath/libsodium-core/issues/77
        return untrimmed.TrimEnd('\0');
    }

    // TODO_JU Investigate client-side hashing for server relief
    // https://libsodium.gitbook.io/doc/password_hashing#server-relief
    public static async Task<(bool correct, bool rehashed)> PasswordIsCorrect(User user, string attemptedPassword, CancellationToken cancellationToken)
    {
        // With parameters $argon2id$v=19$m=131072,t=6,p=1 ("Moderate" preset at time of writing),
        // a single hash takes approx 225ms to compute on an AMD 5900X and requires 128MB of RAM.
        var correct = await concurrencyLimiter.Run(() => PasswordHash.ArgonHashStringVerify(
            user.PasswordSaltedHash!,
            attemptedPassword
        ), cancellationToken);

        if(!correct)
        {
            return (false, false);
        }

        if(PasswordHash.ArgonPasswordNeedsRehash(user.PasswordSaltedHash, hashStrength))
        {
            user.PasswordSaltedHash = GenerateSaltedHash(attemptedPassword);
            return (true, true);
        }

        return (true , false);
    }
}
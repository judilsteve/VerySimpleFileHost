using Microsoft.AspNetCore.WebUtilities;
using System.Security.Cryptography;
using VerySimpleFileHost.Entities;
using Sodium;

namespace VerySimpleFileHost.Utils;

public static class PasswordUtils
{
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

    public static bool PasswordIsCorrect(User user, string attemptedPassword, out bool rehashed)
    {
        // With parameters $argon2id$v=19$m=131072,t=6,p=1 ("Moderate" preset at time of writing),
        // a single hash takes approx 225ms to compute on an AMD 5900X and requires 128MB of RAM.
        var correct = PasswordHash.ArgonHashStringVerify(
            user.PasswordSaltedHash!,
            attemptedPassword
        );
        rehashed = false;

        if(!correct)
        {
            return false;
        }

        if(PasswordHash.ArgonPasswordNeedsRehash(user.PasswordSaltedHash, hashStrength))
        {
            user.PasswordSaltedHash = GenerateSaltedHash(attemptedPassword);
            rehashed = true;
        }

        return correct;
    }
}
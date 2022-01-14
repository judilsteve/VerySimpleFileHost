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
        return PasswordHash.ArgonHashString(
            password,
            hashStrength
        );
    }

    public static bool PasswordIsCorrect(User user, string attemptedPassword, out bool rehashed)
    {
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
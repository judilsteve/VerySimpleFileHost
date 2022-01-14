using Microsoft.AspNetCore.WebUtilities;
using System.Text;
using System.Security.Cryptography;
using VerySimpleFileHost.Entities;
using Sodium;

namespace VerySimpleFileHost.Utils;

public static class PasswordUtils
{
    private const PasswordHash.StrengthArgon hashStrength = PasswordHash.StrengthArgon.Medium;

    public static bool PasswordExpired(DateTime lastPasswordChangeUtc, double? passwordExpiryDays)
    {
        if(!passwordExpiryDays.HasValue) return false;
        var passwordExpiry =  lastPasswordChangeUtc.AddDays(passwordExpiryDays.Value);
        return passwordExpiry < DateTimeOffset.UtcNow;
    }

    public static string AssignInviteKey(User user)
    {
        var inviteKey = RandomNumberGenerator.GetBytes(64);
        user.PasswordSaltedHash = null;
        user.InviteKey = inviteKey;
        user.RejectCookiesOlderThanUtc = DateTime.UtcNow;
        user.LastPasswordChangeUtc = DateTime.UtcNow;

        return WebEncoders.Base64UrlEncode(inviteKey);
    }

    public static string GenerateSaltedHash(string password)
    {
        return PasswordHash.ArgonHashString(
            password,
            hashStrength
        );
    }

    public static bool PasswordIsCorrect(string attemptedPassword, string passwordHash)
    {
        var correct = PasswordHash.ArgonHashStringVerify(
            passwordHash,
            attemptedPassword
        );

        if(!correct) return false;

        if(PasswordHash.ArgonPasswordNeedsRehash(passwordHash, hashStrength))
        {
            // TODO_JU Re-hash
        }

        return correct;
    }
}
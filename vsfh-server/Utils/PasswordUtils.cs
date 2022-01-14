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

    public static byte[] GenerateSaltedHash(string password)
    {
        return PasswordHash.ArgonHashBinary(
            Encoding.UTF8.GetBytes(password),
            PasswordHash.ArgonGenerateSalt(),
            hashStrength
        );
    }

    public static bool PasswordIsCorrect(string attemptedPassword, byte[] passwordHash)
    {
        var attemptedPasswordBytes = Encoding.UTF8.GetBytes(attemptedPassword);

        var correct = PasswordHash.ArgonHashStringVerify(
            passwordHash,
            attemptedPasswordBytes
        );

        if(!correct) return false;

        if(PasswordHash.ArgonPasswordNeedsRehash(passwordHash, hashStrength))
        {
            // TODO_JU Re-hash
        }

        return correct;
    }
}
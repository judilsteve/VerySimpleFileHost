using Microsoft.AspNetCore.WebUtilities;
using System.Text;
using System.Security.Cryptography;
using VerySimpleFileHost.Entities;

namespace VerySimpleFileHost.Utils;

public static class PasswordUtils
{
    public static byte[] GenerateSalt()
    {
        return RandomNumberGenerator.GetBytes(64);
    }

    public static bool PasswordExpired(DateTime lastPasswordChangeUtc, double? passwordExpiryDays)
    {
        if(!passwordExpiryDays.HasValue) return false;
        var passwordExpiry =  lastPasswordChangeUtc.AddDays(passwordExpiryDays.Value);
        return passwordExpiry < DateTimeOffset.UtcNow;
    }

    public static string AssignInviteKey(User user)
    {
        var inviteKey = RandomNumberGenerator.GetBytes(64);
        user.PasswordSalt = null;
        user.PasswordHash = null;
        user.InviteKey = inviteKey;
        user.LastAuthChangeUtc = DateTime.UtcNow;

        return WebEncoders.Base64UrlEncode(inviteKey);
    }

    public static byte[] GenerateSaltedHash(string password, byte[] salt)
    {
        var algorithm = HashAlgorithm.Create("SHA512")
            ?? throw new ArgumentException("Invalid hash algorithm");

        var saltedPassword = Encoding.UTF8.GetBytes(password)
            .Concat(salt)
            .ToArray();
        return algorithm.ComputeHash(saltedPassword);
    }

    public static bool PasswordIsCorrect(string attemptedPassword, byte[] passwordHash, byte[] salt)
    {
        var attemptedHash = GenerateSaltedHash(attemptedPassword, salt);
        return attemptedHash.SequenceEqual(passwordHash);
    }
}
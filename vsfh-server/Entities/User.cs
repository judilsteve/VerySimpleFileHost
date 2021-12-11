using Microsoft.EntityFrameworkCore;

namespace VerySimpleFileHost.Entities;

[Index(new[]{ nameof(User.LoginName) }, IsUnique=true)]
public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = null!;
    public string? LoginName { get; set; }
    public byte[]? PasswordSalt { get; set; }
    public byte[]? PasswordHash { get; set; }
    public byte[]? InviteKey { get; set; }
    public bool IsAdministrator { get; set; }
    public DateTime LastPasswordChangeUtc { get; set; }
    public DateTime RejectCookiesOlderThanUtc { get; set; }
}
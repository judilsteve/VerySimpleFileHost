using Microsoft.EntityFrameworkCore;

namespace VerySimpleFileHost.Entities;

[Index(new[]{ nameof(User.LoginName) }, IsUnique=true)]
public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = null!;
    public string? LoginName { get; set; }
    public string? PasswordSaltedHash { get; set; }
    public string? InviteKey { get; set; }
    public bool IsAdministrator { get; set; }
    public DateTime LastPasswordChangeUtc { get; set; }
    public DateTime RejectCookiesOlderThanUtc { get; set; }
}
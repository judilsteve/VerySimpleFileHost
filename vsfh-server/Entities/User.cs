using Microsoft.EntityFrameworkCore;

namespace VerySimpleFileHost.Entities;

[Index(new[]{ nameof(User.LoginName) }, IsUnique=true)]
public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = null!;
    public string? LoginName { get; set; }
    public string? PasswordSaltedHash { get; set; }
    public byte[]? InviteKey { get; set; } // TODO_JU This might as well be a string too
    public bool IsAdministrator { get; set; }
    public DateTime LastPasswordChangeUtc { get; set; }
    public DateTime RejectCookiesOlderThanUtc { get; set; }
}
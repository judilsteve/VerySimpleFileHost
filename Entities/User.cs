using Microsoft.EntityFrameworkCore;

namespace VerySimpleFileHost.Entities;

[Index(new[]{ nameof(User.Name) }, IsUnique=true)]
public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public byte[]? PasswordSalt { get; set; }
    public byte[]? PasswordHash { get; set; }
    public byte[]? InviteKey { get; set; }
    public bool IsAdministrator { get; set; }
    public DateTime LastPasswordChangeUtc { get; set; }
    public DateTime RejectCookiesOlderThanUtc { get; set; }
}
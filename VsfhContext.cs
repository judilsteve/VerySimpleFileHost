using Microsoft.EntityFrameworkCore;
using VerySimpleFileHost.Entities;
using VerySimpleFileHost.Utils;

namespace VerySimpleFileHost.Database;

public class VsfhContext : DbContext
{
    public VsfhContext(DbContextOptions<VsfhContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        this.SetupDefaultConverter<VsfhContext, DateTime, DateTime>(
            modelBuilder,
            dt => DateTime.SpecifyKind(dt, DateTimeKind.Utc),
            dt => dt.ToUniversalTime()
        );
    }
}
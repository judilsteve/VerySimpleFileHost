using Microsoft.EntityFrameworkCore;
using VerySimpleFileHost.Entities;

namespace VerySimpleFileHost.Database;

public class VsfhContext : DbContext
{
    public VsfhContext(DbContextOptions<VsfhContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
}
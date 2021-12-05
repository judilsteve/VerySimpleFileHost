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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var entityTypes = typeof(VsfhContext).GetProperties()
            .Select(m => m.PropertyType)
            .Where(t => (typeof(DbSet<>).IsAssignableFrom(t.GetGenericTypeDefinition())))
            .Select(t => t.GetGenericTypeDefinition().GenericTypeArguments[0]);

        foreach(var entityType in entityTypes)
        {
            var dateTimeProperties = entityType.GetProperties()
                .Where(p => p.PropertyType == typeof(DateTime));
            foreach(var dateTimeProperty in dateTimeProperties)
            {
                modelBuilder
                    .Entity(entityType)
                    .Property<DateTime>(dateTimeProperty.Name)
                    .HasConversion(
                        v => v.ToUniversalTime(),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                    );
            }
        }
    }
}
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using System.Linq.Expressions;

namespace VerySimpleFileHost.Utils;

public static class DbContextUtils
{
    public static async Task TrySaveChangesAsync(this DbContext context)
    {
        try
        {
            await context.SaveChangesAsync();
        }
        catch(DbUpdateException e)
        {
            if(e.InnerException is SqliteException sqliteException && sqliteException.SqliteErrorCode == 19)
                throw new UniqueIndexConstraintViolationException(e);
            else throw;
        }
    }

    public static void SetupDefaultConverter<TDbContext, TDbType, TClientType>(
        this TDbContext context,
        ModelBuilder modelBuilder,
        Expression<Func<TDbType, TClientType>> dbToClient,
        Expression<Func<TClientType, TDbType>> clientToDb)
        where TDbContext : notnull, DbContext
    {
        var entityTypes = context.GetType().GetProperties()
            .Select(m => m.PropertyType)
            .Where(t => t.IsGenericType)
            .Where(t => (typeof(DbSet<>).IsAssignableFrom(t.GetGenericTypeDefinition())))
            .Select(t => t.GenericTypeArguments[0]);

        foreach(var entityType in entityTypes)
        {
            var relevantProperties = entityType.GetProperties()
                .Where(p => p.PropertyType == typeof(TClientType));
            foreach(var relevantProperty in relevantProperties)
            {
                modelBuilder
                    .Entity(entityType)
                    .Property<TClientType>(relevantProperty.Name)
                    .HasConversion<TDbType>(
                        clientToDb,
                        dbToClient
                    );
            }
        }
    }
}

public class UniqueIndexConstraintViolationException : Exception
{
    public UniqueIndexConstraintViolationException(Exception inner)
        : base(inner.Message, inner)
    {
    }
}
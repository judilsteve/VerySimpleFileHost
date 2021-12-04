using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;

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
}

public class UniqueIndexConstraintViolationException : Exception
{
    public UniqueIndexConstraintViolationException(Exception inner)
        : base(inner.Message, inner)
    {
    }
}
namespace VerySimpleFileHost.Utils;

public class ConcurrencyLimitReachedException : Exception
{
}

/// <summary>
/// TODO_JU Migrate to https://devblogs.microsoft.com/dotnet/asp-net-core-updates-in-dotnet-7-preview-4/#rate-limiting-middleware ?
/// </summary>
public class ConcurrencyLimiter
{
    private readonly SemaphoreSlim semaphore;
    private readonly TimeSpan queueTimeout;

    public ConcurrencyLimiter(int maxConcurrentTasks, TimeSpan queueTimeout)
    {
        semaphore = new SemaphoreSlim(maxConcurrentTasks, maxConcurrentTasks);
        this.queueTimeout = queueTimeout;
    }

    public async Task<TResult> Run<TResult>(Func<TResult> work, CancellationToken cancellationToken)
    {
        // Setting a timeout here ensures that requests don't back up
        var enteredSemaphor = await semaphore.WaitAsync(queueTimeout, cancellationToken);
        if(!enteredSemaphor)
        {
            throw new ConcurrencyLimitReachedException();
        }
        try
        {
            return work();
        }
        finally
        {
            semaphore.Release();
        }
    }
}

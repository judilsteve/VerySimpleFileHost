namespace VerySimpleFileHost.Utils;

public class ConcurrencyLimitReachedException : Exception
{
}

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

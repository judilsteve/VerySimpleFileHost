namespace VerySimpleFileHost.Utils;

public static class TaskUtils
{
    private static readonly SemaphoreSlim randomLock = new(1, 1);
    private static readonly Random random = new();

    /// <summary>
    /// Prevents timing attacks
    /// TODO_JU Turn this into a full blown per-IP backoff system
    /// </summary>
    public static async Task RandomWait()
    {
        await randomLock.WaitAsync();
        int randomMillis;
        try
        {
            randomMillis = random.Next(400, 800);
        }
        finally
        {
            randomLock.Release();
        }
        await Task.Delay(randomMillis);
    }
}
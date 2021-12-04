using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Middleware;
using VerySimpleFileHost.Entities;
using VerySimpleFileHost.Utils;

var builder = WebApplication.CreateBuilder(args);

var config = builder.Configuration;
void RegisterConfigObject<T>(string key) where T: class, IValidatableConfiguration, new()
{
    var configObject = new T();
    config.Bind(key, configObject);

    var validationErrors = configObject.Validate()
        .ToArray();

    if(validationErrors.Any())
        throw new Exception($"{typeof(T).Name} was invalid:\r\n{string.Join("\r\n", validationErrors)}");

    builder.Services.AddSingleton(configObject);
}

RegisterConfigObject<FilesConfiguration>("FilesConfiguration");
RegisterConfigObject<AuthenticationConfiguration>("PasswordConfiguration");

builder.Services.AddControllers(o =>
    o.Filters.Add(new AuthenticationAuthorizationFilter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<VsfhContext>(options => options
    .UseSqlite("Filename=Database.sqlite")
    .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

// System.IO.Compression.ZipArchive requires synchronous IO
builder.Services.Configure<KestrelServerOptions>(o => o.AllowSynchronousIO = true);

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.Strict
});

app.UseAuthentication();

app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();
app.UseAuthorization();
app.UseEndpoints(e =>
    e.MapControllers().RequireAuthorization());

using(var scope = app.Services.CreateAsyncScope())
{
    var context = scope.ServiceProvider.GetRequiredService<VsfhContext>();
    await context.Database.MigrateAsync();

    if(!await context.Users.AnyAsync(u => u.IsAdministrator))
    {
        await Console.Out.WriteLineAsync("No administrators were found in the database. Creating one now. What should their name be?");
        string? name;
        do
        {
            name = await Console.In.ReadLineAsync();
        }
        while(string.IsNullOrWhiteSpace(name));

        var firstAdmin = new User
        {
            Id = Guid.NewGuid(),
            Name = name,
            IsAdministrator = true
        };
        var inviteKey = PasswordUtils.AssignInviteKey(firstAdmin);

        await context.Users.AddAsync(firstAdmin);
        await context.SaveChangesAsync();

        var authConfig = scope.ServiceProvider.GetRequiredService<AuthenticationConfiguration>();
        var expiryMessage = authConfig.InviteLinkExpiryHours.HasValue
                ? $" This code will expire in {authConfig.InviteLinkExpiryHours} hours, and a password *must* be set on first login"
                : "";
        await Console.Out.WriteLineAsync($"Administrator \"{name}\" created. Use one-time invite code \"{inviteKey}\" to log in.{expiryMessage}");
    }
}

app.Run();
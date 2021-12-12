using LettuceEncrypt;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Text.Json.Serialization;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Middleware;
using VerySimpleFileHost.Entities;
using VerySimpleFileHost.Utils;

var builder = WebApplication.CreateBuilder(args);

var config = builder.Configuration;
void RegisterConfigObject<T>() where T: class, IValidatableConfiguration, new()
{
    var configObject = new T();
    config.Bind(typeof(T).Name, configObject);

    var validationErrors = configObject.Validate()
        .ToArray();

    if(validationErrors.Any())
        throw new Exception($"{typeof(T).Name} was invalid:\r\n{string.Join("\r\n", validationErrors)}");

    builder.Services.AddSingleton(configObject);
}

RegisterConfigObject<FilesConfiguration>();
RegisterConfigObject<AuthenticationConfiguration>();

builder.Services
    .AddControllers(o =>
    {
        o.Filters.Add(new AuthenticationFilter());
        o.Filters.Add(new AdminOnlyFilter());
    })
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<VsfhContext>(options => options
    .UseSqlite("Filename=Database.sqlite")
    .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

// System.IO.Compression.ZipArchive requires synchronous IO
builder.Services.Configure<KestrelServerOptions>(o => o.AllowSynchronousIO = true);

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    // By default, the cookie auth scheme assumes you are running an MVC application
    // with a few special routes. Thus it uses redirect responses to these routes
    // when a user is unauthenticated/unauthorised. Override this behaviour to just
    // return plain 401/403 responses, respectively.
    .AddCookie(o => 
    {
        o.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        o.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
    });

var lettuceEncryptConfig = new LettuceEncryptConfiguration();
config.Bind(nameof(LettuceEncrypt), lettuceEncryptConfig);
if(!string.IsNullOrWhiteSpace(lettuceEncryptConfig.EmailAddress) && (lettuceEncryptConfig.DomainNames?.Any() ?? false))
{
    builder.Services.AddLettuceEncrypt()
        // TODO_JU Configurable directory and PFX password
        .PersistDataToDirectory(new DirectoryInfo("LettuceEncrypt"), null);
}

var app = builder.Build();

if(!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}

app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.Strict
});

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();

app.UseRouting();
app.UseAuthorization();
app.UseEndpoints(e =>
    e.MapControllers().RequireAuthorization());

await app.StartAsync();

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
            FullName = name,
            IsAdministrator = true
        };
        var inviteKey = PasswordUtils.AssignInviteKey(firstAdmin);

        await context.Users.AddAsync(firstAdmin);
        await context.SaveChangesAsync();

        var authConfig = scope.ServiceProvider.GetRequiredService<AuthenticationConfiguration>();
        var expiryMessage = authConfig.InviteLinkExpiryHours.HasValue
                ? $" This code will expire in {authConfig.InviteLinkExpiryHours} hours, and a password *must* be set on first login"
                : "";
        var server = scope.ServiceProvider.GetRequiredService<IServer>();
        var host = new Uri(server.Features.Get<IServerAddressesFeature>()!.Addresses.First());
        await Console.Out.WriteLineAsync($"Administrator \"{name}\" created. Use one-time invite link {new Uri(host, $"AcceptInvite/{inviteKey}")} to log in.{expiryMessage}");
    }
}

await app.WaitForShutdownAsync();

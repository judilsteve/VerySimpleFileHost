using LettuceEncrypt;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.Reflection;
using VerySimpleFileHost.Controllers;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Middleware;
using VerySimpleFileHost.Entities;
using VerySimpleFileHost.Utils;

var connectionString = "Filename=Database.sqlite";

if(args.Contains("--create-admin-account"))
{
    var context = new VsfhContext(new DbContextOptionsBuilder<VsfhContext>().UseSqlite(connectionString).Options);
    await context.Database.MigrateAsync();

    if(!await context.Users.AnyAsync(u => u.IsAdministrator && u.PasswordHash != null))
    {
        await Console.Out.WriteLineAsync("What should the new administrator's name be?");
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

        await Console.Out.WriteLineAsync($"Account for \"{name}\" created. Use one-time invite link below to log in:\nhttps://localhost:<YOUR_HTTPS_PORT_HERE>/AcceptInvite/{inviteKey}");
    }
    return;
}

var builder = WebApplication.CreateBuilder(args);

var configManager = new ConfigurationManager();
configManager.AddJsonFile("appsettings.Default.json");
configManager.AddJsonFile("appsettings.json");
configManager.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true);
configManager.AddCommandLine(args);

void RegisterConfigObject<T>() where T: class, new()
{
    var configObject = new T();
    configManager.Bind(typeof(T).Name, configObject);

    var validationErrors = new List<ValidationResult>();
    Validator.TryValidateObject(configObject, new ValidationContext(configObject), validationErrors);

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
builder.Services.AddSwaggerGen(o =>
{
    o.OperationFilter<ErrorResponseTypeFilter<AuthenticationFailureDto>>(StatusCodes.Status401Unauthorized);
    o.IncludeXmlComments(Path.Combine(
        AppContext.BaseDirectory,
        $"{typeof(ControllerBase).GetTypeInfo().Assembly.GetName().Name}.xml"
    ));
});

builder.Services.AddDbContext<VsfhContext>(o => o
    .UseSqlite(connectionString)
    .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

// System.IO.Compression.ZipArchive requires synchronous IO
builder.Services.Configure<KestrelServerOptions>(o => o.AllowSynchronousIO = true);

var authenticationConfiguration = new AuthenticationConfiguration();
configManager.Bind(nameof(AuthenticationConfiguration), authenticationConfiguration);
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    // By default, the cookie auth scheme assumes you are running an MVC application
    // with a few special routes. Thus it uses redirect responses to these routes
    // when a user is unauthenticated/unauthorised. Override this behaviour to just
    // return plain 401/403 responses, respectively.
    .AddCookie(o => 
    {
        o.SlidingExpiration = true;
        if(authenticationConfiguration.CookieExpiryMinutes.HasValue)
            o.ExpireTimeSpan = TimeSpan.FromMinutes(authenticationConfiguration.CookieExpiryMinutes.Value);
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
configManager.Bind(nameof(LettuceEncrypt), lettuceEncryptConfig);
if(!string.IsNullOrWhiteSpace(lettuceEncryptConfig.EmailAddress) && (lettuceEncryptConfig.DomainNames?.Any() ?? false))
{
    builder.Services.AddLettuceEncrypt()
        .PersistDataToDirectory(new DirectoryInfo(lettuceEncryptConfig.LettuceEncryptDirectory ?? "LettuceEncrypt"), lettuceEncryptConfig.PfxPassword);
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

if(!app.Environment.IsDevelopment())
    app.UseSpaStaticFiles();

using (var scope = app.Services.CreateAsyncScope())
{
    var context = scope.ServiceProvider.GetRequiredService<VsfhContext>();
    await context.Database.MigrateAsync();
}

await app.RunAsync();

using LettuceEncrypt;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using VerySimpleFileHost.Controllers;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Middleware;
using VerySimpleFileHost.Entities;
using VerySimpleFileHost.Utils;

namespace VerySimpleFileHost.Run;

public static class VerySimpleFileHost
{
    private static ConfigurationManager BuildConfigManager(string[] args, WebApplicationBuilder builder)
    {
        var configManager = new ConfigurationManager();
        configManager.AddCommandLine(args);
        configManager.AddJsonFile("appsettings.Default.json");
        configManager.AddJsonFile("appsettings.json");
        configManager.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true);
        return configManager;
    }

    private const string connectionString = "Filename=Database.sqlite";

    /// <summary>
    /// Very Simple File Host
    /// </summary>
    /// <param name="createAdminAccount">
    /// If provided, will not run VSFH, but instead add a new admin account and then exit.
    /// </param>
    /// <param name="hostnameOverride">
    /// Hostname to display in the new admin account invite link (not used at runtime).
    /// Useful when VSFH is running inside a container and the configured Kestrel host
    /// would be unreachable from the host machine.
    /// </param>
    /// <param name="args">Extra args for Kestrel/ASP.NET</param>
    public static async Task Main(bool createAdminAccount, string? hostnameOverride, string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var configManager = BuildConfigManager(args, builder);

        if(createAdminAccount) await CreateAdminAccount(configManager, hostnameOverride);
        else await RunHost(builder, configManager);
    }

    // TODO_JU Use this
    private static async Task CreateCertificate(ConfigurationManager configManager, string host)
    {
        // TODO_JU Probably need to rethink the config situation and/or add something for choosing cert in the podman install script
        var ecdsa = ECDsa.Create();
        var req = new CertificateRequest($"cn={host}", ecdsa, HashAlgorithmName.SHA256);
        var expiry = DateTimeOffset.Now.AddYears(1);
        var cert = req.CreateSelfSigned(DateTimeOffset.Now, expiry);
        var exportPath = "TODO_JU plumbing this in podman will be fun";
        await File.WriteAllBytesAsync(exportPath, cert.Export(X509ContentType.Pkcs12));
        await Console.Out.WriteLineAsync($"A self signed certificate for \"{host}\" has been written to \"{exportPath}\". It will expire on {expiry.Date} at {expiry.TimeOfDay}");
    }

    private static async Task CreateAdminAccount(ConfigurationManager configManager, string? hostnameOverride)
    {
        var context = new VsfhContext(new DbContextOptionsBuilder<VsfhContext>().UseSqlite(connectionString).Options);
        await context.Database.MigrateAsync();

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

        var host = hostnameOverride ?? configManager
            .GetSection("Kestrel")
            .GetSection("EndPoints")
            .GetSection("Https")
            .GetValue<string?>("Url")
            ?? "https://localhost";
        var inviteLink = new Uri(new Uri(host), $"AcceptInvite/{inviteKey}");
        await Console.Out.WriteLineAsync(
            $"Account for \"{name}\" created. Use one-time invite link below to log in:\n{inviteLink}");
    }

    private static async Task RunHost(WebApplicationBuilder builder, ConfigurationManager configManager)
    {
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

        var authenticationConfiguration = new AuthenticationConfiguration();
        configManager.Bind(nameof(AuthenticationConfiguration), authenticationConfiguration);
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

        if(!builder.Environment.IsDevelopment())
            builder.Services.AddSpaStaticFiles(o => { o.RootPath = "wwwroot"; });

        var lettuceEncryptConfig = new LettuceEncryptConfiguration();
        configManager.Bind(nameof(LettuceEncrypt), lettuceEncryptConfig);
        var noCertificates = false; // TODO_JU
        if(!string.IsNullOrWhiteSpace(lettuceEncryptConfig.EmailAddress) && (lettuceEncryptConfig.DomainNames?.Any() ?? false))
        {
            builder.Services.AddLettuceEncrypt()
                .PersistDataToDirectory(new DirectoryInfo(lettuceEncryptConfig.LettuceEncryptDirectory ?? "LettuceEncrypt"), lettuceEncryptConfig.PfxPassword);
        } else if(noCertificates)
        {
            // TODO_JU Log a warning here
            var httpsPort = 42424; // TODO_JU
            builder.WebHost.ConfigureKestrel(ko => {
                ko.ListenAnyIP(httpsPort, lo => lo.UseHttps(x => {
                    // TODO_JU Fetch/generate self-signed cert(s) from cache (per-hostname)
                    // https://docs.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel/endpoints?view=aspnetcore-6.0#sni-with-servercertificateselector
                }));
            });
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
    }
}


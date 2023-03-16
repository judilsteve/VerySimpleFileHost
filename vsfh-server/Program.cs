using CompressedStaticFiles;
using LettuceEncrypt;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Net.Http.Headers;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Reflection;
using VerySimpleFileHost.Controllers;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Middleware;
using VerySimpleFileHost.Entities;
using VerySimpleFileHost.Utils;

namespace VerySimpleFileHost.Run;

public static class VerySimpleFileHost
{
    private enum SystemDFileDescriptorProtocol
    {
        HTTPS3,
        HTTPS,
        HTTP
    }

    private static ConfigurationManager BuildConfigManager(string[] args, WebApplicationBuilder builder)
    {
        var configManager = new ConfigurationManager();
        configManager.AddCommandLine(args);
        configManager.AddJsonFile("appsettings.json");
        configManager.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true);
        return configManager;
    }

    private static readonly string connectionString = $"Filename=data{Path.DirectorySeparatorChar}Database.sqlite";

    private static readonly Regex htmlRegex = new Regex(@"\.html(\.br|\.gz)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

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
        builder.WebHost.UseConfiguration(configManager);

        if(createAdminAccount) await CreateAdminAccount(configManager, hostnameOverride);
        else await RunHost(builder, configManager);
    }

    private static string GetHost(IConfiguration config) => config
        .GetSection("Kestrel")
        ?.GetSection("Endpoints")
        ?.GetSection("Https")
        ?.GetValue<string?>("Url")
        ?? "https://localhost";

    private static async Task CreateAdminAccount(ConfigurationManager configManager, string? hostnameOverride)
    {
        var context = new VsfhContext(new DbContextOptionsBuilder<VsfhContext>().UseSqlite(connectionString).Options);
        Directory.CreateDirectory("data");
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

        var host = hostnameOverride ?? GetHost(configManager);
        var inviteLink = new Uri(new Uri(host), $"/AcceptInvite/?key={inviteKey}");
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

        // This no-ops if we are not running as a systemd service
        builder.Host.UseSystemd();

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
            // TODO_JU Migrate to source generation once it supports deserialisation of init-only properties
            // https://docs.microsoft.com/en-us/dotnet/standard/serialization/system-text-json-source-generation?pivots=dotnet-6-0
            // https://github.com/dotnet/runtime/issues/58770#issuecomment-923118142 <-- Planned for 7.0
            .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        if(builder.Environment.IsDevelopment())
        {
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(o =>
            {
                o.OperationFilter<ErrorResponseTypeFilter<AuthenticationFailureDto>>(StatusCodes.Status401Unauthorized);
                o.IncludeXmlComments(Path.Combine(
                    AppContext.BaseDirectory,
                    $"{typeof(ControllerBase).GetTypeInfo().Assembly.GetName().Name}.xml"
                ));
            });
        }

        builder.Services.AddDbContext<VsfhContext>(o => o
            .UseSqlite(connectionString)
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

        var lettuceEncryptConfig = new LettuceEncryptConfiguration();
        configManager.Bind(nameof(LettuceEncrypt), lettuceEncryptConfig);
        var useLettuceEncrypt = !string.IsNullOrWhiteSpace(lettuceEncryptConfig.EmailAddress) && (lettuceEncryptConfig.DomainNames?.Any() ?? false);
        var useHttp3 = configManager.GetRequiredSection("Kestrel").GetValue<bool>("UseHttp3");
        var httpsPortOverride = Environment.GetEnvironmentVariable("HTTPS_PORT");
        builder.Services.Configure<KestrelServerOptions>(o => 
        {
            o.AllowSynchronousIO = true; // System.IO.Compression.ZipArchive requires synchronous IO

            if(useHttp3)
                o.ConfigureEndpointDefaults(o => {
                    o.Protocols = HttpProtocols.Http1AndHttp2AndHttp3;
                    // Default alt-svc header logic doesn't respect this envvar, we need our own logic
                    o.DisableAltSvcHeader = httpsPortOverride is not null;
                });

            // See https://www.freedesktop.org/software/systemd/man/sd_listen_fds.html
            // This envvar can be set by the `FileDescriptorName` field in the .socket file
            var fileDescriptorProtocols = (Environment.GetEnvironmentVariable("LISTEN_FDNAMES")
                ?? throw new Exception("You must set names for socket activation to indicate protocols"))
                .Split(":")!
                .Select(Enum.Parse<SystemDFileDescriptorProtocol>);
            var fileDescriptorProtocolEnumerator = fileDescriptorProtocols.GetEnumerator();
            o.UseSystemd(fd =>
            {
                if(!fileDescriptorProtocolEnumerator.MoveNext())
                    throw new Exception("There were less FD names than sockets passed");
                var protocol = fileDescriptorProtocolEnumerator.Current;
                if(protocol != SystemDFileDescriptorProtocol.HTTP)
                {
                    fd.UseHttps(h => 
                    {
                        if(useLettuceEncrypt) h.UseLettuceEncrypt(o.ApplicationServices);
                    });

                    if(protocol == SystemDFileDescriptorProtocol.HTTPS3)
                    {
                        fd.Protocols = HttpProtocols.Http3;
                    }
                }
            });
        });

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

        var serveFrontendBundle = !builder.Environment.IsDevelopment();
        if(serveFrontendBundle)
            builder.Services.AddCompressedStaticFiles(o =>
            {
                o.EnableImageSubstitution = false;
                o.EnablePrecompressedFiles = true;
            });

        if(useLettuceEncrypt)
        {
            builder.Services.AddLettuceEncrypt()
                .PersistDataToDirectory(new DirectoryInfo(lettuceEncryptConfig.LettuceEncryptDirectory ?? $"data{Path.DirectorySeparatorChar}LettuceEncrypt"), lettuceEncryptConfig.PfxPassword);
        }

        if (!builder.Environment.IsDevelopment())
        {
            builder.Services.AddHttpsRedirection(options =>
                options.RedirectStatusCode = (int)HttpStatusCode.PermanentRedirect);
        }

        builder.Services.AddLogging();

        var app = builder.Build();

        if(!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
            app.UseHsts();
        }

        if(useHttp3 && httpsPortOverride is not null)
        {
            app.Use((ctx, next) => {
                if (ctx.Request.Protocol != HttpProtocol.Http3)
                    ctx.Response.Headers["Alt-Svc"] = $"h3=\":{httpsPortOverride}\"; ma=86400";

                return next();
            });
        }

        app.UseCookiePolicy(new CookiePolicyOptions
        {
            MinimumSameSitePolicy = Microsoft.AspNetCore.Http.SameSiteMode.Strict
        });

        if(app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseAuthentication();

        app.UseRouting();
        app.UseAuthorization();
        app.MapControllers()
            .RequireAuthorization();

        if(serveFrontendBundle)
        {
            var staticFileOptions = new StaticFileOptions
            {
                OnPrepareResponse = ctx =>
                {
                    var isHtml = htmlRegex.IsMatch(ctx.File.Name);
                    ctx.Context.Response.GetTypedHeaders().CacheControl = new CacheControlHeaderValue
                    {
                        Private = true,
                        MaxAge = TimeSpan.FromDays(30),
                        // Cache entries must be validated before use for HTML, to allow, for example,
                        // `/Browse` to be redirected to `/Login` when the user's credentials are expired
                        NoCache = isHtml
                    };
                    if(isHtml)
                    {
                        // Generated with https://addons.mozilla.org/en-US/firefox/addon/laboratory-by-mozilla/
                        ctx.Context.Response.Headers.Add("Content-Security-Policy",
                            "default-src 'none'; " +
                            "connect-src 'self'; " +
                            "font-src 'self' data:; " +
                            "form-action 'self'; " +
                            "img-src 'self'; " +
                            "script-src 'self' 'unsafe-inline'; " + // 'unsafe-inline' is gross but required by various semantic-ui elements
                            "style-src 'self' 'unsafe-inline'; " +
                            "manifest-src 'self'; " +
                            "media-src 'self' "
                        );
                    }
                }
            };

            app.UseMiddleware<FrontendRoutingMiddleware>();
            app.UseDefaultFiles(); // Maps (e.g.) "/Login" to "/Login/index.html"
            app.UseCompressedStaticFiles(staticFileOptions);
            app.Use(async (ctx, next) =>
            {
                ctx.Request.Path = "/Error/NotFound/";
                await next();
            });
            app.UseDefaultFiles();
            app.UseCompressedStaticFiles(staticFileOptions);
        }

        using (var scope = app.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<VsfhContext>();
            Directory.CreateDirectory("data");
            await context.Database.MigrateAsync();
        }

        await app.RunAsync();
    }
}


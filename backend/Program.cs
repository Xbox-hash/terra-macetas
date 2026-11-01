using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.Options;
using TerraMacetas.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add services to the container.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TERRA Macetas API (SQL Server + WhatsApp Gateway)", Version = "v1", Description = "API REST para catálogo, gestión de macetas y pedidos automáticos por WhatsApp" });

    // Botón "Authorize" de Swagger para probar los endpoints de /admin con el token
    var bearer = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", bearer);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { bearer, Array.Empty<string>() } });
});

// 2. Configure SQL Server DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost\\MSSQLSERVER01;Database=TerraMacetasDb;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// 3. Configuración tipada (patrón Options): secretos desde variables de entorno, no en el código
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.Section));
builder.Services.Configure<WhatsAppOptions>(builder.Configuration.GetSection(WhatsAppOptions.Section));

// 4. WhatsApp Gateway (Evolution API) + cola de notificaciones en segundo plano
builder.Services.AddSingleton<IWhatsAppNotificationService, EvolutionWhatsAppService>();
builder.Services.AddSingleton<INotificationQueue, NotificationQueue>();
builder.Services.AddHostedService<NotificationWorker>();

// 5. Autenticación JWT para el panel /admin
var jwtOptions = builder.Configuration.GetSection(JwtOptions.Section).Get<JwtOptions>() ?? new JwtOptions();
using var startupLoggerFactory = LoggerFactory.Create(b => b.AddConsole());
var signingKey = TokenService.BuildSigningKey(jwtOptions, startupLoggerFactory.CreateLogger("Startup"));

builder.Services.AddSingleton(signingKey);
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddSingleton<IPasswordService, PasswordService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Seguro por defecto: todo endpoint exige login, salvo los marcados con [AllowAnonymous]
    // (catálogo, crear pedido, registrar visita, login y webhook de WhatsApp).
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    // Gestionar usuarios del panel exige el permiso "users" (o "all")
    options.AddPolicy("ManageUsers", policy =>
        policy.RequireClaim(TokenService.PermissionClaim, "users", "all"));
});

// 6. CORS: el frontend llama a /api por el mismo dominio (proxy), así que no hace falta abrir a todos.
// Si algún día se sirve desde otro dominio, se agrega en Cors__AllowedOrigins__0, __1, ...
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// IP real del visitante. El tráfico llega por Cloudflare -> túnel (cloudflared) -> Caddy -> API,
// y en esa cadena X-Forwarded-For no identifica al visitante. Cloudflare siempre manda su IP
// en CF-Connecting-IP. Si el encabezado no viene (llamadas directas, tests), se usa la IP de la conexión.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.ForwardedForHeaderName = "CF-Connecting-IP";
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

// Límites anti-spam por IP real del cliente (gracias a UseForwardedHeaders).
// La memoria la maneja .NET y se libera sola; antes eran diccionarios que crecían sin límite.
builder.Services.AddMemoryCache();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, ct) =>
    {
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = "Demasiadas solicitudes en poco tiempo. Por favor espere un momento antes de volver a intentar."
        }, ct);
    };

    static string ClientIp(HttpContext http) => http.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    // Crear pedido: máximo 5 por minuto por IP
    options.AddPolicy("orders", http => RateLimitPartition.GetSlidingWindowLimiter(ClientIp(http), _ =>
        new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6,
            QueueLimit = 0
        }));

    // Login: máximo 20 intentos por minuto por IP (frena que se prueben muchos usuarios distintos).
    // El bloqueo de 15 min por usuario está en AuthController.
    options.AddPolicy("login", http => RateLimitPartition.GetSlidingWindowLimiter(ClientIp(http), _ =>
        new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 20,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6,
            QueueLimit = 0
        }));
});

var app = builder.Build();

// 7. Seed database on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        await DbInitializer.SeedAsync(context, app.Environment);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error al inicializar la base de datos SQL Server.");
    }
}
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseForwardedHeaders();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TERRA API v1");
    });
}

app.UseResponseCompression();

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000");
    }
});

app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }

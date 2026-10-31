using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.Models;
using TerraMacetas.Api.Services;

namespace TerraMacetas.Api.Tests;

/// <summary>Levanta la API real en memoria, con SQLite en lugar de SQL Server.</summary>
public class TerraApiFactory : WebApplicationFactory<Program>
{
    public const string AdminPassword = "Clave-De-Prueba-2026";

    // Base en memoria compartida: todas las conexiones ven las mismas tablas.
    // _keepAlive queda abierta para que SQLite no la borre mientras duran los tests.
    private readonly string _connectionString = $"DataSource=terra-tests-{Guid.NewGuid():N};Mode=Memory;Cache=Shared";
    private SqliteConnection? _keepAlive;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Key", "clave-de-firma-solo-para-tests-con-mas-de-32-caracteres");

        builder.ConfigureServices(services =>
        {
            var sqlServer = services.Single(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            services.Remove(sqlServer);

            _keepAlive ??= new SqliteConnection(_connectionString);
            if (_keepAlive.State != System.Data.ConnectionState.Open) _keepAlive.Open();
            services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connectionString));
        });
    }

    /// <summary>Crea las tablas y carga un admin, una línea y un producto de prueba.</summary>
    public async Task SeedAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwords = scope.ServiceProvider.GetRequiredService<IPasswordService>();
        await db.Database.EnsureCreatedAsync();

        if (!await db.AdminUsers.AnyAsync(u => u.Id == "USR-TEST"))
        {
            var admin = new AdminUser { Id = "USR-TEST", Name = "tester", Email = "tester@terra.com", Permissions = "all" };
            admin.PasswordHash = passwords.Hash(admin, AdminPassword);
            db.AdminUsers.Add(admin);
        }

        if (!await db.ProductLines.AnyAsync(l => l.Id == "line-test"))
        {
            db.ProductLines.Add(new ProductLine { Id = "line-test", Name = "Línea test", Slug = "linea-test" });
            db.Products.Add(new Product { Id = "prod-test", LineId = "line-test", Name = "Maceta Test", Price = 40_000m, Active = true });
        }

        await db.SaveChangesAsync();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _keepAlive?.Dispose();
    }
}

public class ApiSecurityTests : IClassFixture<TerraApiFactory>, IAsyncLifetime
{
    private readonly TerraApiFactory _factory;
    private readonly HttpClient _client;

    public ApiSecurityTests(TerraApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.SeedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Theory]
    [InlineData("DELETE", "/api/products/prod-test")]
    [InlineData("GET", "/api/orders")]
    [InlineData("GET", "/api/dashboard/stats")]
    [InlineData("GET", "/api/auth/users")]
    [InlineData("POST", "/api/auth/users")]
    [InlineData("PUT", "/api/company")]
    [InlineData("GET", "/api/whatsapp/qr")]
    public async Task Endpoints_de_admin_rechazan_a_quien_no_inicio_sesion(string method, string url)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), url)
        {
            Content = method is "POST" or "PUT" ? JsonContent.Create(new { }) : null
        };

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task El_catalogo_sigue_siendo_publico()
    {
        var response = await _client.GetAsync("/api/products");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task La_configuracion_publica_no_expone_la_api_key_de_whatsapp()
    {
        var json = await _client.GetFromJsonAsync<JsonElement>("/api/company");

        Assert.Equal(JsonValueKind.Null, json.GetProperty("whatsappApiKey").ValueKind);
        Assert.Equal(JsonValueKind.Null, json.GetProperty("whatsappApiUrl").ValueKind);
    }

    [Fact]
    public async Task Con_el_token_del_login_se_accede_al_panel()
    {
        var login = await _client.PostAsJsonAsync("/api/auth/login",
            new { email = "tester@terra.com", password = TerraApiFactory.AdminPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        var token = (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/users");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Un_token_falso_es_rechazado()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/orders");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "session_token_USR-ADMIN-1");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_con_contrasena_incorrecta_devuelve_401()
    {
        var login = await _client.PostAsJsonAsync("/api/auth/login",
            new { email = "tester@terra.com", password = "incorrecta" });

        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    [Fact]
    public async Task Un_pedido_con_precio_manipulado_se_guarda_con_el_precio_real()
    {
        var response = await _client.PostAsJsonAsync("/api/orders", new
        {
            customerName = "Cliente Test",
            customerPhone = "0981000000",
            total = 1,
            items = new[] { new { productId = "prod-test", productName = "Maceta Test", price = 1, quantity = 3, subtotal = 1 } }
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(120_000m, order.GetProperty("total").GetDecimal()); // 3 x 40.000
    }
}

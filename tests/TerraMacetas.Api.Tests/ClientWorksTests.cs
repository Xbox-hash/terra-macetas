using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TerraMacetas.Api.Data;

namespace TerraMacetas.Api.Tests;

/// <summary>Trabajos realizados: carga desde el panel y lo que ve la tienda.</summary>
public class ClientWorksTests : IClassFixture<TerraApiFactory>, IAsyncLifetime
{
    private readonly TerraApiFactory _factory;
    private readonly HttpClient _admin;
    private readonly HttpClient _visitor;

    public ClientWorksTests(TerraApiFactory factory)
    {
        _factory = factory;
        _admin = factory.CreateClient();
        _visitor = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        await _factory.SeedAsync();
        var login = await _admin.PostAsJsonAsync("/api/auth/login",
            new { email = "tester@terra.com", password = TerraApiFactory.AdminPassword });
        var token = (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString();
        _admin.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<JsonElement> CreateAsync(object body)
    {
        var res = await _admin.PostAsJsonAsync("/api/works", body);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return await res.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Theory]
    [InlineData("POST", "/api/works")]
    [InlineData("PUT", "/api/works/work-x")]
    [InlineData("DELETE", "/api/works/work-x")]
    [InlineData("PATCH", "/api/works/work-x/toggle-active")]
    public async Task Solo_el_panel_puede_cargar_o_borrar_trabajos(string method, string url)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), url)
        {
            Content = method is "POST" or "PUT" ? JsonContent.Create(new { }) : null
        };
        var response = await _visitor.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Un_trabajo_sin_fotos_se_rechaza()
    {
        var res = await _admin.PostAsJsonAsync("/api/works", new { clientName = "Sin fotos", images = Array.Empty<string>() });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task La_tienda_no_recibe_el_nombre_si_el_cliente_no_dio_permiso()
    {
        var created = await CreateAsync(new
        {
            images = new[] { "/uploads/works/a.jpg", "/uploads/works/a.jpg", " " },
            clientName = "Familia Privada",
            showClientName = false,
            city = "Luque",
            productId = "prod-test",
            active = true,
        });
        var id = created.GetProperty("id").GetString();

        // El panel ve el nombre y las fotos sin repetidos ni vacíos
        Assert.Equal("Familia Privada", created.GetProperty("clientName").GetString());
        Assert.Equal(1, created.GetProperty("images").GetArrayLength());

        var publicWork = await _visitor.GetFromJsonAsync<JsonElement>($"/api/works/{id}");
        Assert.Equal(JsonValueKind.Null, publicWork.GetProperty("clientName").ValueKind);
        Assert.Equal("Luque", publicWork.GetProperty("city").GetString());
        Assert.Equal("Maceta Test", publicWork.GetProperty("productName").GetString());
    }

    [Fact]
    public async Task Los_trabajos_ocultos_no_aparecen_en_la_tienda()
    {
        var created = await CreateAsync(new { images = new[] { "/uploads/works/oculto.jpg" }, clientName = "Oculto", active = false });
        var id = created.GetProperty("id").GetString();

        var list = await _visitor.GetFromJsonAsync<JsonElement>("/api/works");
        Assert.DoesNotContain(list.EnumerateArray(), w => w.GetProperty("id").GetString() == id);
        Assert.Equal(HttpStatusCode.NotFound, (await _visitor.GetAsync($"/api/works/{id}")).StatusCode);

        var adminList = await _admin.GetFromJsonAsync<JsonElement>("/api/works");
        Assert.Contains(adminList.EnumerateArray(), w => w.GetProperty("id").GetString() == id);
    }

    [Fact]
    public async Task Se_crea_la_tabla_en_una_base_que_ya_existia_sin_ella()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Simula la base de producción, creada antes de que existieran los trabajos
        await db.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS ClientWorks;");
        await DbInitializer.SeedAsync(db);

        Assert.Equal(0, await db.ClientWorks.CountAsync());
        Assert.True(await db.Products.AnyAsync(p => p.Id == "prod-test"));
    }
}

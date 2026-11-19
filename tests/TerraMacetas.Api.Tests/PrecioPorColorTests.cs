using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;
using TerraMacetas.Api.Services;

namespace TerraMacetas.Api.Tests;

/// <summary>Precio distinto por color dentro del mismo producto.</summary>
public class PrecioPorColorTests : IClassFixture<TerraApiFactory>, IAsyncLifetime
{
    private static Product ConColores() => new()
    {
        Id = "botija", Name = "Vaso Botija", Price = 350_000m, Active = true,
        ColorsJson = JsonSerializer.Serialize(new List<ProductColorDto>
        {
            new() { Id = "blanco", Name = "Blanco Calizo", Hex = "#fff", Price = 380_000m },
            new() { Id = "oro", Name = "Oro del Egipto", Hex = "#876b40", Price = 420_000m },
            new() { Id = "negro", Name = "Ónix", Hex = "#000" } // sin precio propio
        })
    };

    private static Dictionary<string, Product> Catalogo() => new() { ["botija"] = ConColores() };

    private static List<OrderItemDto> Item(string nombre, int cantidad = 1, decimal precioNavegador = 1m) =>
        new() { new() { ProductId = "botija", ProductName = nombre, Price = precioNavegador, Quantity = cantidad } };

    [Fact]
    public void Cada_color_cobra_su_propio_precio()
    {
        var oro = OrderPricing.Calculate(Item("Vaso Botija (Color: Oro del Egipto)", 2), Catalogo());
        Assert.Equal(420_000m, oro.Value!.Items[0].Price);
        Assert.Equal(840_000m, oro.Value.Total);

        var blanco = OrderPricing.Calculate(Item("Vaso Botija (Color: Blanco Calizo)"), Catalogo());
        Assert.Equal(380_000m, blanco.Value!.Items[0].Price);
    }

    [Fact]
    public void Un_color_sin_precio_propio_usa_el_precio_general()
    {
        var onix = OrderPricing.Calculate(Item("Vaso Botija (Color: Ónix)"), Catalogo());
        Assert.Equal(350_000m, onix.Value!.Items[0].Price);
    }

    [Fact]
    public void Un_color_que_no_existe_no_cambia_el_precio_y_el_del_navegador_se_ignora()
    {
        var inventado = OrderPricing.Calculate(Item("Vaso Botija (Color: Gratis)", precioNavegador: 1m), Catalogo());
        Assert.Equal(350_000m, inventado.Value!.Items[0].Price);

        var sinColor = OrderPricing.Calculate(Item("Vaso Botija"), Catalogo());
        Assert.Equal(350_000m, sinColor.Value!.Items[0].Price);
    }

    [Fact]
    public void El_color_se_reconoce_sin_importar_mayusculas_ni_espacios()
    {
        var r = OrderPricing.Calculate(Item("Vaso Botija (Color:  oro del egipto )"), Catalogo());
        Assert.Equal(420_000m, r.Value!.Items[0].Price);
    }

    // ── API: guardar y validar precios por color ──────────────────────────

    private readonly TerraApiFactory _factory;
    private readonly HttpClient _client;

    public PrecioPorColorTests(TerraApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        await _factory.SeedAsync();
        var login = await _client.PostAsJsonAsync("/api/auth/login",
            new { email = "tester@terra.com", password = TerraApiFactory.AdminPassword });
        var token = (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private static object Producto(params object[] colores) => new
    {
        lineId = "line-test", name = "Vaso Botija", description = "x", price = 350_000,
        images = new[] { "/uploads/products/b.jpg" }, colors = colores, active = true
    };

    [Fact]
    public async Task Los_precios_por_color_se_guardan_y_se_devuelven()
    {
        var res = await _client.PostAsJsonAsync("/api/products", Producto(
            new { id = "oro", name = "Oro del Egipto", hex = "#876b40", price = 420_000 },
            new { id = "negro", name = "Ónix", hex = "#000" }));
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var id = (await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        var producto = await _client.GetFromJsonAsync<JsonElement>($"/api/products/{id}");
        var colores = producto.GetProperty("colors").EnumerateArray().ToList();
        Assert.Equal(420_000m, colores.Single(c => c.GetProperty("id").GetString() == "oro").GetProperty("price").GetDecimal());
        Assert.Equal(JsonValueKind.Null, colores.Single(c => c.GetProperty("id").GetString() == "negro").GetProperty("price").ValueKind);
    }

    [Fact]
    public async Task Un_precio_de_color_en_cero_o_negativo_se_rechaza()
    {
        var res = await _client.PostAsJsonAsync("/api/products", Producto(new { id = "oro", name = "Oro", hex = "#876b40", price = 0 }));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var message = (await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("message").GetString();
        Assert.Contains("Oro", message);
    }
}

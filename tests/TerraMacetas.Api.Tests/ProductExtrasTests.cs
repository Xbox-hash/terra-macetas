using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace TerraMacetas.Api.Tests;

/// <summary>Link de Instagram, fotos de detalle y carrusel de portada, de punta a punta por la API.</summary>
public class ProductExtrasTests : IClassFixture<TerraApiFactory>, IAsyncLifetime
{
    private readonly TerraApiFactory _factory;
    private readonly HttpClient _client;

    public ProductExtrasTests(TerraApiFactory factory)
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

    private static object ProductBody(string? instagramUrl, object[] detailPhotos) => new
    {
        lineId = "line-test",
        name = "Vaso Lito",
        description = "Pieza orgánica",
        price = 950_000,
        images = new[] { "/uploads/products/lito.jpg" },
        dimensions = "Ø 30 x Alto 60 cm",
        instagramUrl,
        detailPhotos,
        active = true,
    };

    [Fact]
    public async Task Se_guardan_y_se_devuelven_el_link_y_las_fotos_de_detalle()
    {
        var photos = new object[]
        {
            new { image = "/uploads/products/a.jpg", caption = "Impermeabilización interna" },
            new { image = "/uploads/products/b.jpg", caption = "Patitas en el fondo" },
            new { image = "/uploads/products/c.jpg", caption = "" },
            new { image = "/uploads/products/d.jpg", caption = "Acabado" },
            new { image = "/uploads/products/e.jpg", caption = "Sobra: máximo 4" },
            new { image = "  ", caption = "Sin foto: se descarta" },
        };

        var created = await _client.PostAsJsonAsync("/api/products",
            ProductBody("instagram.com/p/LITO123/", photos));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        // Lo que ve la tienda (sin sesión)
        var publicClient = _factory.CreateClient();
        var product = await publicClient.GetFromJsonAsync<JsonElement>($"/api/products/{id}");

        Assert.Equal("https://instagram.com/p/LITO123/", product.GetProperty("instagramUrl").GetString());
        var saved = product.GetProperty("detailPhotos").EnumerateArray().ToList();
        Assert.Equal(4, saved.Count);
        Assert.Equal("Impermeabilización interna", saved[0].GetProperty("caption").GetString());
        Assert.Equal("/uploads/products/d.jpg", saved[3].GetProperty("image").GetString());

        // Editar: borrar el link y dejar una sola foto
        var updated = await _client.PutAsJsonAsync($"/api/products/{id}",
            ProductBody(null, new object[] { new { image = "/uploads/products/b.jpg", caption = "Patitas" } }));
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var after = await updated.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Null, after.GetProperty("instagramUrl").ValueKind);
        Assert.Single(after.GetProperty("detailPhotos").EnumerateArray());
    }

    [Fact]
    public async Task Un_link_que_no_es_de_instagram_se_rechaza()
    {
        var response = await _client.PostAsJsonAsync("/api/products",
            ProductBody("javascript:alert(document.cookie)", Array.Empty<object>()));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task El_carrusel_de_portada_se_guarda_sin_vacios_ni_repetidos()
    {
        var config = await _client.GetFromJsonAsync<Dictionary<string, object?>>("/api/company");
        config!["storeName"] = "TERRA";
        config["heroImages"] = new[] { "/uploads/company/1.jpg", "", "/uploads/company/2.jpg", "/uploads/company/1.jpg" };

        var response = await _client.PutAsJsonAsync("/api/company", config);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var publicClient = _factory.CreateClient();
        var saved = await publicClient.GetFromJsonAsync<JsonElement>("/api/company");
        var hero = saved.GetProperty("heroImages").EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Equal(new[] { "/uploads/company/1.jpg", "/uploads/company/2.jpg" }, hero);
    }
}

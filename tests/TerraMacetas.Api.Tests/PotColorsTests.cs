using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace TerraMacetas.Api.Tests;

/// <summary>Colores y acabados: que la descripción se guarde y no se pierda.</summary>
public class PotColorsTests : IClassFixture<TerraApiFactory>, IAsyncLifetime
{
    private readonly TerraApiFactory _factory;
    private readonly HttpClient _client;

    public PotColorsTests(TerraApiFactory factory)
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

    private async Task<string> CreateColorAsync(string id)
    {
        var res = await _client.PostAsJsonAsync("/api/colors", new { id, name = "Arena " + id, hex = "#D8C4A7", active = true });
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return id;
    }

    private async Task<JsonElement> GetColorAsync(string id) =>
        await _client.GetFromJsonAsync<JsonElement>($"/api/colors/{id}");

    [Fact]
    public async Task La_descripcion_se_guarda_al_editar()
    {
        var id = await CreateColorAsync("arena-1");

        var res = await _client.PutAsJsonAsync($"/api/colors/{id}",
            new { name = "Arena", hex = "#D8C4A7", description = "  Textura arenisca, terminación mate.  ", active = true });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.Equal("Textura arenisca, terminación mate.", (await GetColorAsync(id)).GetProperty("description").GetString());
    }

    [Fact]
    public async Task Activar_o_desactivar_no_borra_la_descripcion()
    {
        var id = await CreateColorAsync("arena-2");
        await _client.PutAsJsonAsync($"/api/colors/{id}", new { name = "Arena", hex = "#D8C4A7", description = "Mate y suave", active = true });

        // El botón de activar/desactivar manda solo "active"
        var res = await _client.PutAsJsonAsync($"/api/colors/{id}", new { active = false });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var color = await GetColorAsync(id);
        Assert.False(color.GetProperty("active").GetBoolean());
        Assert.Equal("Mate y suave", color.GetProperty("description").GetString());
        Assert.Equal("Arena", color.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Una_descripcion_demasiado_larga_se_rechaza_con_un_mensaje_claro()
    {
        var id = await CreateColorAsync("arena-3");

        var res = await _client.PutAsJsonAsync($"/api/colors/{id}", new { description = new string('a', 501) });

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var message = (await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("message").GetString();
        Assert.Contains("500 caracteres", message);
    }

    [Fact]
    public async Task Borrar_el_texto_deja_el_color_sin_descripcion()
    {
        var id = await CreateColorAsync("arena-4");
        await _client.PutAsJsonAsync($"/api/colors/{id}", new { description = "Algo" });

        await _client.PutAsJsonAsync($"/api/colors/{id}", new { description = "" });

        Assert.Equal(JsonValueKind.Null, (await GetColorAsync(id)).GetProperty("description").ValueKind);
    }
}

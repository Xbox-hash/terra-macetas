using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using TerraMacetas.Api.Controllers;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Tests;

/// <summary>El contador del panel cuenta personas por día, no pantallas vistas.</summary>
public class VisitCounterTests : IClassFixture<TerraApiFactory>, IAsyncLifetime
{
    private const string BrowserAgent = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";

    private readonly TerraApiFactory _factory;
    private readonly HttpClient _client;

    public VisitCounterTests(TerraApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.SeedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task RecordAsync(string? visitorId, string path = "/", string userAgent = BrowserAgent)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/dashboard/record-visit")
        {
            Content = JsonContent.Create(new { pagePath = path, visitorId })
        };
        request.Headers.TryAddWithoutValidation("User-Agent", userAgent);
        var response = await _client.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    // El endpoint /stats también suma ventas, y esa suma no corre sobre SQLite (en producción es SQL Server),
    // así que se prueba directo la cuenta que usa el panel.
    private async Task<(int Total, int Today)> GetStatsAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await DashboardController.CountVisitorsAsync(db);
    }

    [Fact]
    public async Task Cuenta_personas_y_no_pantallas_y_deja_afuera_bots_y_registros_viejos()
    {
        var (totalBefore, todayBefore) = await GetStatsAsync();

        // Una persona recorre 4 pantallas, otra entra solo a la portada
        var ana = $"ana-{Guid.NewGuid():N}";
        var beto = $"beto-{Guid.NewGuid():N}";
        await RecordAsync(ana, "/");
        await RecordAsync(ana, "/linea/linea-test");
        await RecordAsync(ana, "/producto/prod-test");
        await RecordAsync(ana, "/");
        await RecordAsync(beto, "/");

        // No cuentan: un bot, un pedido sin identificador (tienda vieja) y un identificador inválido
        await RecordAsync($"bot-{Guid.NewGuid():N}", "/", "Googlebot/2.1 (+http://www.google.com/bot.html)");
        await RecordAsync(null);
        await RecordAsync("x' OR 1=1");

        // Una persona que vino ayer cuenta en el total pero no en el día
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.SiteVisits.Add(new SiteVisit { VisitorId = $"ayer-{Guid.NewGuid():N}", VisitedAt = DateTime.UtcNow.AddDays(-2) });
            db.SiteVisits.Add(new SiteVisit { VisitorId = null, VisitedAt = DateTime.UtcNow }); // pantalla del sistema viejo
            await db.SaveChangesAsync();
        }

        var (total, today) = await GetStatsAsync();
        Assert.Equal(totalBefore + 3, total);
        Assert.Equal(todayBefore + 2, today);
    }
}

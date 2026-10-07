using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.Services;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WhatsAppController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IWhatsAppNotificationService _whatsappService;
    private readonly ILogger<WhatsAppController> _logger;

    // Control para evitar reenvíos simultáneos en ráfaga
    private static bool _isResending = false;

    public WhatsAppController(
        AppDbContext context,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IWhatsAppNotificationService whatsappService,
        ILogger<WhatsAppController> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _whatsappService = whatsappService;
        _logger = logger;
    }

    private async Task<(string baseUrl, string apiKey, string instanceName)> GetConfigAsync()
    {
        var config = await _context.CompanyConfigs.FirstOrDefaultAsync();
        var baseUrl = config?.WhatsappApiUrl ?? _configuration.GetValue<string>("WhatsAppGateway:BaseUrl") ?? "http://localhost:8080";
        var apiKey = config?.WhatsappApiKey ?? _configuration.GetValue<string>("WhatsAppGateway:ApiKey") ?? "TerraSecretApiKey2026_WhatsAppGateway!";
        var instanceName = config?.WhatsappInstanceName ?? _configuration.GetValue<string>("WhatsAppGateway:InstanceName") ?? "terra_bot";

        return (baseUrl.TrimEnd('/'), apiKey, instanceName);
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        try
        {
            var (baseUrl, apiKey, instanceName) = await GetConfigAsync();
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);
            client.DefaultRequestHeaders.Add("apikey", apiKey);

            var url = $"{baseUrl}/instance/connectionState/{instanceName}";
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                return Ok(new
                {
                    isOnline = false,
                    state = "disconnected",
                    instanceName,
                    message = "Instancia no encontrada o desconectada."
                });
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var state = doc.RootElement.TryGetProperty("instance", out var inst) &&
                        inst.TryGetProperty("state", out var st)
                ? st.GetString()
                : "unknown";

            bool isOnline = state == "open";

            // 🚀 Si detectamos que WhatsApp está conectado ('open') y no estamos reenviando:
            // Verificamos si hay pedidos acumulados sin notificar y los despachamos en segundo plano
            if (isOnline && !_isResending)
            {
                _ = Task.Run(async () =>
                {
                    if (_isResending) return;
                    _isResending = true;
                    try
                    {
                        await _whatsappService.ResendPendingOrdersAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error en reenvío automático en segundo plano.");
                    }
                    finally
                    {
                        _isResending = false;
                    }
                });
            }

            return Ok(new
            {
                isOnline,
                state,
                instanceName
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                isOnline = false,
                state = "offline",
                error = "Servidor Docker no responde",
                details = ex.Message
            });
        }
    }

    [HttpGet("qr")]
    public async Task<IActionResult> GetQr()
    {
        try
        {
            var (baseUrl, apiKey, instanceName) = await GetConfigAsync();
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);
            client.DefaultRequestHeaders.Add("apikey", apiKey);

            var url = $"{baseUrl}/instance/connect/{instanceName}";
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(new { message = "No se pudo obtener el QR de conexión." });
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);

            string? base64 = null;
            string? pairingCode = null;

            if (doc.RootElement.TryGetProperty("base64", out var b64Prop))
            {
                base64 = b64Prop.GetString();
            }

            if (doc.RootElement.TryGetProperty("pairingCode", out var pairProp))
            {
                pairingCode = pairProp.GetString();
            }

            return Ok(new
            {
                base64,
                pairingCode,
                instanceName
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error conectando con Evolution API", error = ex.Message });
        }
    }

    [HttpPost("resend-pending")]
    public async Task<IActionResult> ResendPending()
    {
        try
        {
            var count = await _whatsappService.ResendPendingOrdersAsync();
            return Ok(new
            {
                success = true,
                resentCount = count,
                message = count > 0
                    ? $"Se reenviaron con éxito {count} pedidos pendientes por WhatsApp."
                    : "No hay pedidos pendientes de notificación."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al ejecutar reenvío manual de pedidos pendientes.");
            return StatusCode(500, new { success = false, message = "Error al reenviar pedidos", error = ex.Message });
        }
    }
}

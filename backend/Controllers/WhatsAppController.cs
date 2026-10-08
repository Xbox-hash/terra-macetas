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
        var envBaseUrl = _configuration.GetValue<string>("WhatsAppGateway:BaseUrl");
        var envApiKey = _configuration.GetValue<string>("WhatsAppGateway:ApiKey");
        var envInstanceName = _configuration.GetValue<string>("WhatsAppGateway:InstanceName");

        // Priorizar variable de entorno si estamos en Docker y la DB tiene 'localhost'
        var baseUrl = !string.IsNullOrWhiteSpace(envBaseUrl) && (string.IsNullOrWhiteSpace(config?.WhatsappApiUrl) || config.WhatsappApiUrl.Contains("localhost"))
            ? envBaseUrl
            : (config?.WhatsappApiUrl ?? envBaseUrl ?? "http://localhost:8080");

        var apiKey = !string.IsNullOrWhiteSpace(config?.WhatsappApiKey)
            ? config.WhatsappApiKey
            : (envApiKey ?? "TerraSecretApiKey2026_WhatsAppGateway!");

        var instanceName = !string.IsNullOrWhiteSpace(envInstanceName) && (string.IsNullOrWhiteSpace(config?.WhatsappInstanceName) || config.WhatsappInstanceName == "terra_bot")
            ? envInstanceName
            : (config?.WhatsappInstanceName ?? envInstanceName ?? "terra_bot");

        return (baseUrl.TrimEnd('/'), apiKey, instanceName);
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        try
        {
            var (baseUrl, apiKey, instanceName) = await GetConfigAsync();
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(4);
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
                    message = "Instancia lista para vincular."
                });
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var state = doc.RootElement.TryGetProperty("instance", out var inst) &&
                        inst.TryGetProperty("state", out var st)
                ? st.GetString()
                : "disconnected";

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
                state = isOnline ? "open" : "disconnected",
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
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("apikey", apiKey);

            var url = $"{baseUrl}/instance/connect/{instanceName}";
            var response = await client.GetAsync(url);

            // Si la instancia no existe aún en Evolution API, la creamos automáticamente
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogInformation("Instancia {inst} no existe en Evolution API. Creando automáticamente...", instanceName);
                var createPayload = new
                {
                    instanceName = instanceName,
                    token = apiKey,
                    qrcode = true,
                    integration = "WHATSAPP-BAILEYS"
                };

                var createRes = await client.PostAsJsonAsync($"{baseUrl}/instance/create", createPayload);
                if (createRes.IsSuccessStatusCode)
                {
                    var createContent = await createRes.Content.ReadAsStringAsync();
                    using var createDoc = JsonDocument.Parse(createContent);

                    string? b64 = null;
                    if (createDoc.RootElement.TryGetProperty("qrcode", out var qrObj) && qrObj.TryGetProperty("base64", out var b64Prop))
                        b64 = b64Prop.GetString();
                    else if (createDoc.RootElement.TryGetProperty("base64", out var directB64))
                        b64 = directB64.GetString();

                    if (!string.IsNullOrWhiteSpace(b64))
                    {
                        return Ok(new { base64 = b64, pairingCode = (string?)null, instanceName });
                    }
                }

                // Reintentar connect si create no devolvió el QR directo en el cuerpo
                response = await client.GetAsync(url);
            }

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(new { message = "No se pudo obtener el QR de conexión." });
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);

            string? base64 = null;
            string? pairingCode = null;

            if (doc.RootElement.TryGetProperty("base64", out var b64PropFinal))
            {
                base64 = b64PropFinal.GetString();
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

    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook([FromBody] JsonElement payload)
    {
        try
        {
            if (payload.TryGetProperty("data", out var dataProp))
            {
                var updates = new List<JsonElement>();
                if (dataProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in dataProp.EnumerateArray()) updates.Add(item);
                }
                else if (dataProp.ValueKind == JsonValueKind.Object)
                {
                    updates.Add(dataProp);
                }

                foreach (var item in updates)
                {
                    string? msgId = null;
                    if (item.TryGetProperty("key", out var keyProp) && keyProp.TryGetProperty("id", out var idProp))
                    {
                        msgId = idProp.GetString();
                    }

                    if (string.IsNullOrWhiteSpace(msgId)) continue;

                    string? statusStr = null;
                    if (item.TryGetProperty("update", out var updProp) && updProp.TryGetProperty("status", out var stProp))
                    {
                        statusStr = stProp.ToString();
                    }
                    else if (item.TryGetProperty("status", out var sProp))
                    {
                        statusStr = sProp.ToString();
                    }

                    if (string.IsNullOrWhiteSpace(statusStr)) continue;

                    var order = await _context.Orders.FirstOrDefaultAsync(o => o.WhatsAppMessageId == msgId);
                    if (order == null) continue;

                    var upperStatus = statusStr.ToUpperInvariant();

                    if (upperStatus.Contains("READ") || upperStatus == "4" || upperStatus.Contains("VIEWED"))
                    {
                        order.WhatsAppStatus = "Leído";
                        order.WhatsAppReadAt = DateTime.UtcNow;
                        if (order.WhatsAppDeliveredAt == null) order.WhatsAppDeliveredAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Pedido #{OrderId} marcado como LEÍDO en WhatsApp.", order.Id);
                    }
                    else if (upperStatus.Contains("DELIVERY") || upperStatus.Contains("DELIVERED") || upperStatus == "3" || upperStatus.Contains("RECEIVED"))
                    {
                        if (order.WhatsAppStatus != "Leído")
                        {
                            order.WhatsAppStatus = "Entregado";
                            order.WhatsAppDeliveredAt = DateTime.UtcNow;
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("Pedido #{OrderId} marcado como ENTREGADO en WhatsApp.", order.Id);
                        }
                    }
                }
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook de Evolution API.");
            return Ok(new { success = false, error = ex.Message });
        }
    }
}

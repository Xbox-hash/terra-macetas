using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Services;

public interface IWhatsAppNotificationService
{
    Task<bool> SendOrderNotificationAsync(Order order, string itemsSummary);
    Task<int> ResendPendingOrdersAsync();
}

public class EvolutionWhatsAppService : IWhatsAppNotificationService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EvolutionWhatsAppService> _logger;
    private readonly IServiceProvider _serviceProvider;

    public EvolutionWhatsAppService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<EvolutionWhatsAppService> logger,
        IServiceProvider serviceProvider)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public async Task<bool> SendOrderNotificationAsync(Order order, string itemsSummary)
    {
        var isEnabled = _configuration.GetValue<bool>("WhatsAppGateway:Enabled", true);
        var baseUrl = _configuration.GetValue<string>("WhatsAppGateway:BaseUrl") ?? "http://localhost:8080";
        var apiKey = _configuration.GetValue<string>("WhatsAppGateway:ApiKey") ?? "TerraSecretApiKey2026_WhatsAppGateway!";
        var instanceName = _configuration.GetValue<string>("WhatsAppGateway:InstanceName") ?? "terra_bot";

        // Obtener datos de la empresa y configuración dinámica de la base de datos
        string companyName = "TERRA";
        string companyPhone = "595981234567";

        using (var scope = _serviceProvider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var config = await db.CompanyConfigs.FirstOrDefaultAsync();
            if (config != null)
            {
                companyName = config.StoreName;
                companyPhone = config.WhatsappNumber;
                isEnabled = config.WhatsappGatewayEnabled;
                if (!string.IsNullOrWhiteSpace(config.WhatsappApiUrl)) baseUrl = config.WhatsappApiUrl;
                if (!string.IsNullOrWhiteSpace(config.WhatsappApiKey)) apiKey = config.WhatsappApiKey;
                if (!string.IsNullOrWhiteSpace(config.WhatsappInstanceName)) instanceName = config.WhatsappInstanceName;
            }
        }

        if (!isEnabled)
        {
            _logger.LogInformation("WhatsApp Gateway deshabilitado por configuración del sistema.");
            return false;
        }

        // 1. Mensaje para el WhatsApp del Negocio / Dueño
        var businessMessage = new StringBuilder();
        businessMessage.AppendLine($"🪴 *¡NUEVO PEDIDO RECIBIDO EN LA WEB!*");
        businessMessage.AppendLine($"━━━━━━━━━━━━━━━━━━━━");
        businessMessage.AppendLine($"🔖 *Pedido:* #{order.Id}");
        businessMessage.AppendLine($"👤 *Cliente:* {order.CustomerName}");
        if (!string.IsNullOrWhiteSpace(order.CustomerPhone))
            businessMessage.AppendLine($"📱 *Teléfono:* {order.CustomerPhone}");
        if (!string.IsNullOrWhiteSpace(order.Notes))
            businessMessage.AppendLine($"📍 *Detalles:* {order.Notes}");
        businessMessage.AppendLine();
        businessMessage.AppendLine($"📦 *PRODUCTOS:*");
        businessMessage.AppendLine(itemsSummary);
        businessMessage.AppendLine($"━━━━━━━━━━━━━━━━━━━━");
        businessMessage.AppendLine($"💰 *TOTAL:* ₲ {order.Total:N0}");

        // 2. Mensaje de confirmación para el WhatsApp del Cliente (si dejó su número)
        var clientMessage = new StringBuilder();
        clientMessage.AppendLine($"🌿 *¡Hola {order.CustomerName}! Gracias por tu compra en {companyName}.*");
        clientMessage.AppendLine($"Hemos registrado tu pedido *#{order.Id}* por un total de *₲ {order.Total:N0}*.");
        clientMessage.AppendLine($"En breve nos pondremos en contacto con vos para coordinar los detalles de pago y entrega.");
        clientMessage.AppendLine($"¡Muchas gracias por elegirnos!");

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(8);
            client.DefaultRequestHeaders.Add("apikey", apiKey);

            // Verificación previa de conexión
            if (!await IsInstanceConnectedAsync(client, baseUrl, instanceName))
            {
                _logger.LogWarning("WhatsApp Gateway no está conectado ('open'). Se omite envío inmediato de #{OrderId}; quedará pendiente de reenvío.", order.Id);
                return false;
            }

            bool sentToCompany = false;
            // Enviar notificación a la Empresa
            if (!string.IsNullOrWhiteSpace(companyPhone))
            {
                sentToCompany = await SendTextMessage(client, baseUrl, instanceName, CleanPhone(companyPhone), businessMessage.ToString());
            }

            bool sentToClient = false;
            // Enviar confirmación automática al Cliente
            if (!string.IsNullOrWhiteSpace(order.CustomerPhone))
            {
                sentToClient = await SendTextMessage(client, baseUrl, instanceName, CleanPhone(order.CustomerPhone), clientMessage.ToString());
            }

            if (sentToCompany || sentToClient)
            {
                using var updateScope = _serviceProvider.CreateScope();
                var db = updateScope.ServiceProvider.GetRequiredService<AppDbContext>();
                var dbOrder = await db.Orders.FindAsync(order.Id);
                if (dbOrder != null)
                {
                    dbOrder.WhatsAppNotified = true;
                    dbOrder.WhatsAppNotifiedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                }
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar mensaje automático por Evolution API.");
            return false;
        }
    }

    public async Task<int> ResendPendingOrdersAsync()
    {
        var baseUrl = _configuration.GetValue<string>("WhatsAppGateway:BaseUrl") ?? "http://localhost:8080";
        var apiKey = _configuration.GetValue<string>("WhatsAppGateway:ApiKey") ?? "TerraSecretApiKey2026_WhatsAppGateway!";
        var instanceName = _configuration.GetValue<string>("WhatsAppGateway:InstanceName") ?? "terra_bot";
        var isEnabled = true;

        using (var scope = _serviceProvider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var config = await db.CompanyConfigs.FirstOrDefaultAsync();
            if (config != null)
            {
                isEnabled = config.WhatsappGatewayEnabled;
                if (!string.IsNullOrWhiteSpace(config.WhatsappApiUrl)) baseUrl = config.WhatsappApiUrl;
                if (!string.IsNullOrWhiteSpace(config.WhatsappApiKey)) apiKey = config.WhatsappApiKey;
                if (!string.IsNullOrWhiteSpace(config.WhatsappInstanceName)) instanceName = config.WhatsappInstanceName;
            }
        }

        if (!isEnabled) return 0;

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(5);
        client.DefaultRequestHeaders.Add("apikey", apiKey);

        // Si la sesión no está abierta ('open'), no intentamos reenviar ahora
        if (!await IsInstanceConnectedAsync(client, baseUrl, instanceName))
        {
            _logger.LogInformation("WhatsApp no está en estado 'open'. Se pospone el reenvío de pendientes.");
            return 0;
        }

        using var dbScope = _serviceProvider.CreateScope();
        var dbContext = dbScope.ServiceProvider.GetRequiredService<AppDbContext>();

        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        var pendingOrders = await dbContext.Orders
            .Where(o => !o.WhatsAppNotified && o.Status != "Cancelado" && o.CreatedAt >= sevenDaysAgo)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync();

        if (!pendingOrders.Any()) return 0;

        _logger.LogInformation("Iniciando reenvío automático de {Count} pedidos pendientes por WhatsApp...", pendingOrders.Count);

        int sentCount = 0;
        foreach (var ord in pendingOrders)
        {
            try
            {
                var items = new List<OrderItemDto>();
                try
                {
                    items = JsonSerializer.Deserialize<List<OrderItemDto>>(ord.ItemsJson) ?? new List<OrderItemDto>();
                }
                catch {}

                var summary = string.Join("\n", items.Select(i => $"   • {i.Quantity}x {i.ProductName} (₲ {i.Subtotal:N0})"));
                var ok = await SendOrderNotificationAsync(ord, summary);
                if (ok)
                {
                    sentCount++;
                    await Task.Delay(1500);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallo al reenviar notificación del pedido #{OrderId}", ord.Id);
            }
        }

        _logger.LogInformation("Reenvío completado. {Sent}/{Total} pedidos notificados con éxito.", sentCount, pendingOrders.Count);
        return sentCount;
    }

    private async Task<bool> SendTextMessage(HttpClient client, string baseUrl, string instance, string phone, string message)
    {
        if (string.IsNullOrWhiteSpace(phone)) return false;

        var url = $"{baseUrl.TrimEnd('/')}/message/sendText/{instance}";
        var body = new
        {
            number = phone,
            text = message,
            delay = 1200
        };

        var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(url, content);

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("Mensaje automático enviado con éxito a {Phone}", phone);
            return true;
        }
        else
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("No se pudo enviar a {Phone}: {Error}", phone, error);
            return false;
        }
    }

    private async Task<bool> IsInstanceConnectedAsync(HttpClient client, string baseUrl, string instance)
    {
        try
        {
            var url = $"{baseUrl.TrimEnd('/')}/instance/connectionState/{instance}";
            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode) return false;
            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            return doc.RootElement.TryGetProperty("instance", out var inst) &&
                   inst.TryGetProperty("state", out var st) &&
                   st.GetString() == "open";
        }
        catch
        {
            return false;
        }
    }

    private static string CleanPhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
        var digits = new string(phone.Where(char.IsDigit).ToArray());

        // Si tiene menos de 8 dígitos no es un teléfono
        if (digits.Length < 8) return string.Empty;

        // 1. Si ya tiene el código de país de Brasil (55...) o Paraguay (595...) u otro (11 a 13 dígitos)
        if (digits.StartsWith("55") && (digits.Length == 12 || digits.Length == 13))
        {
            return digits; // Número de Brasil completo (ej: 5545999887766)
        }
        
        if (digits.StartsWith("595") && (digits.Length == 11 || digits.Length == 12))
        {
            return digits; // Número de Paraguay con código (ej: 595981123456)
        }

        // 2. Si es número paraguayo estándar que empieza con 098... o 097... o 98...
        if (digits.StartsWith("09") && digits.Length == 10)
        {
            return "595" + digits.Substring(1); // 0981123456 -> 595981123456
        }
        else if (digits.StartsWith("9") && digits.Length == 9)
        {
            return "595" + digits; // 981123456 -> 595981123456
        }

        // 3. Si es número brasileño sin código de país (ej: DDD 45 + 9 dígitos = 11 dígitos, ej: 45991234567)
        if (digits.Length == 10 || digits.Length == 11)
        {
            // Si no empieza con 09 ni 9 (no es paraguayo local), puede ser brasileño con DDD local
            if (!digits.StartsWith("09") && !digits.StartsWith("9"))
            {
                return "55" + digits;
            }
        }

        return digits;
    }
}

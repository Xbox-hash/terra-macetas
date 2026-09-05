using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Services;

public interface IWhatsAppNotificationService
{
    Task<bool> SendOrderNotificationAsync(Order order, string itemsSummary);
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
        if (!isEnabled)
        {
            _logger.LogInformation("WhatsApp Gateway deshabilitado en configuración.");
            return false;
        }

        var baseUrl = _configuration.GetValue<string>("WhatsAppGateway:BaseUrl") ?? "http://localhost:8080";
        var apiKey = _configuration.GetValue<string>("WhatsAppGateway:ApiKey") ?? "TerraSecretApiKey2026_WhatsAppGateway!";
        var instanceName = _configuration.GetValue<string>("WhatsAppGateway:InstanceName") ?? "terra_instance";

        // Obtener datos de la empresa (número de WhatsApp del negocio)
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
            }
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
            client.DefaultRequestHeaders.Add("apikey", apiKey);

            // Enviar notificación a la Empresa
            if (!string.IsNullOrWhiteSpace(companyPhone))
            {
                await SendTextMessage(client, baseUrl, instanceName, CleanPhone(companyPhone), businessMessage.ToString());
            }

            // Enviar confirmación automática al Cliente
            if (!string.IsNullOrWhiteSpace(order.CustomerPhone))
            {
                await SendTextMessage(client, baseUrl, instanceName, CleanPhone(order.CustomerPhone), clientMessage.ToString());
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar mensaje automático por Evolution API.");
            return false;
        }
    }

    private async Task SendTextMessage(HttpClient client, string baseUrl, string instance, string phone, string message)
    {
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
        }
        else
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("No se pudo enviar a {Phone}: {Error}", phone, error);
        }
    }

    private static string CleanPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        // Si el número en Paraguay empieza con 098... convertir a 59598...
        if (digits.StartsWith("09") && digits.Length == 10)
        {
            digits = "595" + digits.Substring(1);
        }
        else if (digits.StartsWith("9") && digits.Length == 9)
        {
            digits = "595" + digits;
        }
        return digits;
    }
}

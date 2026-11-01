namespace TerraMacetas.Api.DTOs;

public class CompanyConfigDto
{
    public string StoreName { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string Currency { get; set; } = "PYG";
    public string CurrencySymbol { get; set; } = "₲";
    public string WhatsappNumber { get; set; } = string.Empty;
    public string WhatsappDisplay { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Instagram { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string BusinessHours { get; set; } = string.Empty;
    public bool WhatsappGatewayEnabled { get; set; } = true;
    public string? WhatsappApiUrl { get; set; } = "http://localhost:8080";
    /// <summary>Solo de escritura: el servidor nunca la devuelve. Vacía al guardar = se mantiene la actual.</summary>
    public string? WhatsappApiKey { get; set; }
    /// <summary>Indica al panel si ya hay una API key guardada (sin mostrarla).</summary>
    public bool WhatsappApiKeyConfigured { get; set; }
    public string? WhatsappInstanceName { get; set; } = "terra_bot";
    public string? HeroImageUrl { get; set; }
    public string? HeroFloatingImageUrl { get; set; }
    public string? PhilosophyImageUrl { get; set; }
}

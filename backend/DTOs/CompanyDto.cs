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
    public string? WhatsappApiKey { get; set; } = "TerraSecretApiKey2026_WhatsAppGateway!";
    public string? WhatsappInstanceName { get; set; } = "terra_bot";
}

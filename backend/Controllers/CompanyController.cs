using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompanyController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public CompanyController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [AllowAnonymous] // público: lo usa la tienda
    [HttpGet]
    public async Task<ActionResult<CompanyConfigDto>> GetConfig()
    {
        var config = await _context.CompanyConfigs.FirstOrDefaultAsync();
        if (config == null)
        {
            config = new CompanyConfig();
            _context.CompanyConfigs.Add(config);
            await _context.SaveChangesAsync();
        }

        return Ok(MapToDto(config));
    }

    [HttpPut]
    public async Task<ActionResult<CompanyConfigDto>> UpdateConfig([FromBody] CompanyConfigDto dto)
    {
        var config = await _context.CompanyConfigs.FirstOrDefaultAsync();
        if (config == null)
        {
            config = new CompanyConfig();
            _context.CompanyConfigs.Add(config);
        }

        config.StoreName = dto.StoreName?.Trim() ?? "TERRA";
        config.Tagline = dto.Tagline?.Trim() ?? string.Empty;
        config.LogoUrl = dto.LogoUrl?.Trim() ?? string.Empty;
        config.Currency = dto.Currency?.Trim() ?? "PYG";
        config.CurrencySymbol = dto.CurrencySymbol?.Trim() ?? "₲";
        config.WhatsappNumber = dto.WhatsappNumber?.Trim() ?? string.Empty;
        config.WhatsappDisplay = dto.WhatsappDisplay?.Trim() ?? string.Empty;
        config.Email = dto.Email?.Trim() ?? string.Empty;
        config.Instagram = dto.Instagram?.Trim() ?? string.Empty;
        config.Address = dto.Address?.Trim() ?? string.Empty;
        config.City = dto.City?.Trim() ?? string.Empty;
        config.Country = dto.Country?.Trim() ?? string.Empty;
        config.BusinessHours = dto.BusinessHours?.Trim() ?? string.Empty;
        config.WhatsappGatewayEnabled = dto.WhatsappGatewayEnabled;
        config.WhatsappApiUrl = string.IsNullOrWhiteSpace(dto.WhatsappApiUrl) ? "http://localhost:8080" : dto.WhatsappApiUrl.Trim();
        // La API key es de solo escritura: si viene vacía se conserva la que ya estaba guardada
        if (!string.IsNullOrWhiteSpace(dto.WhatsappApiKey))
        {
            config.WhatsappApiKey = dto.WhatsappApiKey.Trim();
        }
        config.WhatsappInstanceName = string.IsNullOrWhiteSpace(dto.WhatsappInstanceName) ? "terra_bot" : dto.WhatsappInstanceName.Trim();
        config.HeroImageUrl = dto.HeroImageUrl;
        config.HeroFloatingImageUrl = dto.HeroFloatingImageUrl;
        config.PhilosophyImageUrl = dto.PhilosophyImageUrl;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(config));
    }

    private CompanyConfigDto MapToDto(CompanyConfig c)
    {
        var envBaseUrl = _configuration.GetValue<string>("WhatsAppGateway:BaseUrl");
        var envInstanceName = _configuration.GetValue<string>("WhatsAppGateway:InstanceName");

        var whatsappUrl = !string.IsNullOrWhiteSpace(c.WhatsappApiUrl) && !c.WhatsappApiUrl.Contains("localhost")
            ? c.WhatsappApiUrl
            : (envBaseUrl ?? c.WhatsappApiUrl ?? "http://localhost:8080");

        var instanceName = !string.IsNullOrWhiteSpace(c.WhatsappInstanceName) && c.WhatsappInstanceName != "terra_bot"
            ? c.WhatsappInstanceName
            : (envInstanceName ?? c.WhatsappInstanceName ?? "terra_bot");

        // Datos internos del gateway (URL, instancia): solo para usuarios logueados en /admin
        var isAdmin = User.Identity?.IsAuthenticated == true;

        return new CompanyConfigDto
        {
            StoreName = c.StoreName,
            Tagline = c.Tagline,
            LogoUrl = c.LogoUrl,
            Currency = c.Currency,
            CurrencySymbol = c.CurrencySymbol,
            WhatsappNumber = c.WhatsappNumber,
            WhatsappDisplay = c.WhatsappDisplay,
            Email = c.Email,
            Instagram = c.Instagram,
            Address = c.Address,
            City = c.City,
            Country = c.Country,
            BusinessHours = c.BusinessHours,
            WhatsappGatewayEnabled = c.WhatsappGatewayEnabled,
            WhatsappApiUrl = isAdmin ? whatsappUrl : null,
            WhatsappApiKey = null, // nunca se devuelve
            WhatsappApiKeyConfigured = isAdmin && !string.IsNullOrWhiteSpace(c.WhatsappApiKey),
            WhatsappInstanceName = isAdmin ? instanceName : null,
            HeroImageUrl = c.HeroImageUrl,
            HeroFloatingImageUrl = c.HeroFloatingImageUrl,
            PhilosophyImageUrl = c.PhilosophyImageUrl
        };
    }
}

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

    public CompanyController(AppDbContext context)
    {
        _context = context;
    }

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
        config.WhatsappApiKey = string.IsNullOrWhiteSpace(dto.WhatsappApiKey) ? "TerraSecretApiKey2026_WhatsAppGateway!" : dto.WhatsappApiKey.Trim();
        config.WhatsappInstanceName = string.IsNullOrWhiteSpace(dto.WhatsappInstanceName) ? "terra_bot" : dto.WhatsappInstanceName.Trim();
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(config));
    }

    private static CompanyConfigDto MapToDto(CompanyConfig c)
    {
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
            WhatsappApiUrl = c.WhatsappApiUrl,
            WhatsappApiKey = c.WhatsappApiKey,
            WhatsappInstanceName = c.WhatsappInstanceName
        };
    }
}

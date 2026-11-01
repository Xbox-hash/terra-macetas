using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraMacetas.Api.Models;

public class CompanyConfig
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string StoreName { get; set; } = string.Empty;

    [MaxLength(250)]
    public string Tagline { get; set; } = string.Empty;

    public string LogoUrl { get; set; } = string.Empty;

    [MaxLength(10)]
    public string Currency { get; set; } = string.Empty;

    [MaxLength(10)]
    public string CurrencySymbol { get; set; } = string.Empty;

    [MaxLength(50)]
    public string WhatsappNumber { get; set; } = string.Empty;

    [MaxLength(50)]
    public string WhatsappDisplay { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Instagram { get; set; } = string.Empty;

    [MaxLength(300)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    [MaxLength(200)]
    public string BusinessHours { get; set; } = string.Empty;

    public bool WhatsappGatewayEnabled { get; set; } = true;

    [MaxLength(250)]
    public string? WhatsappApiUrl { get; set; }

    [MaxLength(250)]
    public string? WhatsappApiKey { get; set; }

    [MaxLength(100)]
    public string? WhatsappInstanceName { get; set; }

    public string? HeroImageUrl { get; set; }

    public string? HeroFloatingImageUrl { get; set; }

    public string? PhilosophyImageUrl { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

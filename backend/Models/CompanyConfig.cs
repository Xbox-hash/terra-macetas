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
    public string StoreName { get; set; } = "TERRA";

    [MaxLength(250)]
    public string Tagline { get; set; } = "Macetas de autor & diseño botánico";

    public string LogoUrl { get; set; } = string.Empty;

    [MaxLength(10)]
    public string Currency { get; set; } = "PYG";

    [MaxLength(10)]
    public string CurrencySymbol { get; set; } = "₲";

    [MaxLength(50)]
    public string WhatsappNumber { get; set; } = "595981234567";

    [MaxLength(50)]
    public string WhatsappDisplay { get; set; } = "+595 981 234 567";

    [MaxLength(150)]
    public string Email { get; set; } = "contacto@terramacetas.com";

    [MaxLength(100)]
    public string Instagram { get; set; } = "@terra.macetas";

    [MaxLength(300)]
    public string Address { get; set; } = "Av. Santa Teresa 1420 c/ Aviadores";

    [MaxLength(100)]
    public string City { get; set; } = "Asunción";

    [MaxLength(100)]
    public string Country { get; set; } = "Paraguay";

    [MaxLength(200)]
    public string BusinessHours { get; set; } = "Lunes a Sábados: 09:00 - 18:30 hs";

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

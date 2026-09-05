using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraMacetas.Api.Models;

public class Product
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string LineId { get; set; } = string.Empty;

    [ForeignKey(nameof(LineId))]
    public ProductLine? Line { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    // Stored as JSON string or delimited list in SQLite
    public string ImagesJson { get; set; } = "[]";

    [MaxLength(100)]
    public string? Dimensions { get; set; }

    [MaxLength(200)]
    public string? Material { get; set; }

    [MaxLength(200)]
    public string? Finish { get; set; }

    public bool Active { get; set; } = true;

    public bool Featured { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

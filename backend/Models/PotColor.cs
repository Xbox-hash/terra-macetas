using System.ComponentModel.DataAnnotations;

namespace TerraMacetas.Api.Models;

public class PotColor
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Hex { get; set; } = "#FFFFFF";

    [MaxLength(500)]
    public string? Description { get; set; }

    public string? Image { get; set; }

    public bool Active { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

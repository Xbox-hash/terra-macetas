using System.ComponentModel.DataAnnotations;

namespace TerraMacetas.Api.Models;

public class ProductLine
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public string Image { get; set; } = string.Empty;

    public bool Active { get; set; } = true;

    public bool Featured { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

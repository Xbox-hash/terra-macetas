using System.ComponentModel.DataAnnotations;

namespace TerraMacetas.Api.Models;

public class AdminUser
{
    [Key]
    public string Id { get; set; } = $"USR-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Role { get; set; } = "Admin"; // "Admin", "Staff"

    public string? AvatarUrl { get; set; }

    public bool Active { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

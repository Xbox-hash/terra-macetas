using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraMacetas.Api.Models;

public class Order
{
    [Key]
    public string Id { get; set; } = $"ORD-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

    public string CustomerName { get; set; } = "Cliente WhatsApp";

    public string? CustomerPhone { get; set; }

    public string? CustomerEmail { get; set; }

    public string? Notes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    // Stored as JSON of items: product name, quantity, price, subtotal
    public string ItemsJson { get; set; } = "[]";

    [MaxLength(50)]
    public string Status { get; set; } = "Pendiente"; // "Pendiente", "Cerrado", "Cancelado"

    [MaxLength(50)]
    public string PaymentStatus { get; set; } = "Pendiente"; // "Pendiente", "Pagado"

    [MaxLength(50)]
    public string Channel { get; set; } = "WhatsApp";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ClosedAt { get; set; }

    [MaxLength(150)]
    public string? ClosedBy { get; set; }

    public DateTime? CancelledAt { get; set; }

    [MaxLength(150)]
    public string? CancelledBy { get; set; }

    [MaxLength(150)]
    public string? ReopenedBy { get; set; }
}

public class SiteVisit
{
    [Key]
    public int Id { get; set; }

    public string PagePath { get; set; } = "/";

    public string? UserAgent { get; set; }

    public DateTime VisitedAt { get; set; } = DateTime.UtcNow;
}

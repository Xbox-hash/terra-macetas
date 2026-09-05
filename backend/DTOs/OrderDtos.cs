namespace TerraMacetas.Api.DTOs;

public class OrderItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}

public class OrderDto
{
    public string Id { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string? Notes { get; set; }
    public decimal Total { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public string Status { get; set; } = "Pendiente";
    public string PaymentStatus { get; set; } = "Pendiente";
    public string Channel { get; set; } = "WhatsApp";
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public class CreateOrderDto
{
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string? Notes { get; set; }
    public decimal Total { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public string Channel { get; set; } = "WhatsApp";
}

public class DashboardStatsDto
{
    public int TotalVisits { get; set; }
    public int VisitsToday { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ClosedOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalProducts { get; set; }
    public int TotalLines { get; set; }
    public List<OrderDto> RecentOrders { get; set; } = new();
}

public class RecordVisitDto
{
    public string PagePath { get; set; } = "/";
}

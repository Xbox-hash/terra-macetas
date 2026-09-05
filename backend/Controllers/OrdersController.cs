using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;
using TerraMacetas.Api.Services;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWhatsAppNotificationService _whatsappService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        AppDbContext context,
        IWhatsAppNotificationService whatsappService,
        ILogger<OrdersController> logger)
    {
        _context = context;
        _whatsappService = whatsappService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll([FromQuery] string? status = null)
    {
        var query = _context.Orders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "all" && status != "todos")
        {
            query = query.Where(o => o.Status.ToLower() == status.ToLower());
        }

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(string id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound(new { message = "Pedido no encontrado" });
        return Ok(MapToDto(order));
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderDto dto)
    {
        var order = new Order
        {
            Id = $"ORD-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
            CustomerName = string.IsNullOrWhiteSpace(dto.CustomerName) ? "Cliente Web" : dto.CustomerName.Trim(),
            CustomerPhone = dto.CustomerPhone?.Trim(),
            CustomerEmail = dto.CustomerEmail?.Trim(),
            Notes = dto.Notes?.Trim(),
            Total = dto.Total,
            ItemsJson = JsonSerializer.Serialize(dto.Items ?? new List<OrderItemDto>()),
            Status = "Pendiente",
            PaymentStatus = "Pendiente",
            Channel = string.IsNullOrWhiteSpace(dto.Channel) ? "WhatsApp" : dto.Channel,
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        // 🚀 Disparar el envío automático por WhatsApp en segundo plano (Evolution API)
        _ = Task.Run(async () =>
        {
            try
            {
                var summary = string.Join("\n", (dto.Items ?? new List<OrderItemDto>())
                    .Select(i => $"   • {i.Quantity}x {i.ProductName} (₲ {i.Subtotal:N0})"));

                await _whatsappService.SendOrderNotificationAsync(order, summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallo al enviar notificación automática de WhatsApp.");
            }
        });

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, MapToDto(order));
    }

    [HttpPatch("{id}/close")]
    public async Task<ActionResult<OrderDto>> CloseOrder(string id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound(new { message = "Pedido no encontrado" });

        order.Status = "Cerrado";
        order.ClosedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToDto(order));
    }

    [HttpPatch("{id}/reopen")]
    public async Task<ActionResult<OrderDto>> ReopenOrder(string id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound(new { message = "Pedido no encontrado" });

        order.Status = "Pendiente";
        order.ClosedAt = null;
        await _context.SaveChangesAsync();

        return Ok(MapToDto(order));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound(new { message = "Pedido no encontrado" });

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static OrderDto MapToDto(Order o)
    {
        List<OrderItemDto> items;
        try
        {
            items = JsonSerializer.Deserialize<List<OrderItemDto>>(o.ItemsJson) ?? new List<OrderItemDto>();
        }
        catch
        {
            items = new List<OrderItemDto>();
        }

        return new OrderDto
        {
            Id = o.Id,
            CustomerName = o.CustomerName,
            CustomerPhone = o.CustomerPhone,
            CustomerEmail = o.CustomerEmail,
            Notes = o.Notes,
            Total = o.Total,
            Items = items,
            Status = o.Status,
            PaymentStatus = o.PaymentStatus,
            Channel = o.Channel,
            CreatedAt = o.CreatedAt,
            ClosedAt = o.ClosedAt
        };
    }
}

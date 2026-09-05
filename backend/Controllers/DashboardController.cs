using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var today = DateTime.UtcNow.Date;

        var totalVisits = await _context.SiteVisits.CountAsync();
        var visitsToday = await _context.SiteVisits.CountAsync(v => v.VisitedAt >= today);

        var totalOrders = await _context.Orders.CountAsync();
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == "Pendiente");
        var closedOrders = await _context.Orders.CountAsync(o => o.Status == "Cerrado");
        var totalRevenue = await _context.Orders.Where(o => o.Status == "Cerrado").SumAsync(o => (decimal?)o.Total) ?? 0;

        var totalProducts = await _context.Products.CountAsync(p => p.Active);
        var totalLines = await _context.ProductLines.CountAsync(l => l.Active);

        var recentOrdersRaw = await _context.Orders
            .OrderByDescending(o => o.CreatedAt)
            .Take(8)
            .ToListAsync();

        var recentOrdersDto = recentOrdersRaw.Select(o =>
        {
            List<OrderItemDto> items;
            try { items = JsonSerializer.Deserialize<List<OrderItemDto>>(o.ItemsJson) ?? new(); }
            catch { items = new(); }

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
        }).ToList();

        return Ok(new DashboardStatsDto
        {
            TotalVisits = totalVisits,
            VisitsToday = visitsToday,
            TotalOrders = totalOrders,
            PendingOrders = pendingOrders,
            ClosedOrders = closedOrders,
            TotalRevenue = totalRevenue,
            TotalProducts = totalProducts,
            TotalLines = totalLines,
            RecentOrders = recentOrdersDto
        });
    }

    [HttpPost("record-visit")]
    public async Task<IActionResult> RecordVisit([FromBody] RecordVisitDto dto)
    {
        var visit = new SiteVisit
        {
            PagePath = string.IsNullOrWhiteSpace(dto.PagePath) ? "/" : dto.PagePath,
            UserAgent = Request.Headers.UserAgent.ToString(),
            VisitedAt = DateTime.UtcNow
        };

        _context.SiteVisits.Add(visit);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

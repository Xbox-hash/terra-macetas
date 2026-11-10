using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
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
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        // Limpiar cancelados de más de 7 días
        var oldCancelled = await _context.Orders
            .Where(o => o.Status == "Cancelado" && o.CancelledAt != null && o.CancelledAt < sevenDaysAgo)
            .ToListAsync();

        if (oldCancelled.Any())
        {
            _context.Orders.RemoveRange(oldCancelled);
            await _context.SaveChangesAsync();
        }

        var (totalVisits, visitsToday) = await CountVisitorsAsync(_context);

        var totalOrders = await _context.Orders.CountAsync();
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == "Pendiente");
        var closedOrders = await _context.Orders.CountAsync(o => o.Status == "Cerrado");
        var cancelledOrders = await _context.Orders.CountAsync(o => o.Status == "Cancelado");
        var totalRevenue = await _context.Orders.Where(o => o.Status == "Cerrado").SumAsync(o => (decimal?)o.Total) ?? 0;

        var totalProducts = await _context.Products.CountAsync(p => p.Active);
        var totalLines = await _context.ProductLines.CountAsync(l => l.Active);

        var recentOrdersRaw = await _context.Orders
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var recentOrdersDto = recentOrdersRaw.Select(o =>
        {
            List<OrderItemDto> items;
            try { items = JsonSerializer.Deserialize<List<OrderItemDto>>(o.ItemsJson) ?? new(); }
            catch { items = new(); }

            var city = !string.IsNullOrWhiteSpace(o.CustomerCity) ? o.CustomerCity : ExtractCityFromNotes(o.Notes);

            return new OrderDto
            {
                Id = o.Id,
                CustomerName = o.CustomerName,
                CustomerPhone = o.CustomerPhone,
                CustomerEmail = o.CustomerEmail,
                CustomerCity = city,
                Notes = o.Notes,
                Total = o.Total,
                Items = items,
                Status = o.Status,
                PaymentStatus = o.PaymentStatus,
                Channel = o.Channel,
                CreatedAt = o.CreatedAt,
                ClosedAt = o.ClosedAt,
                ClosedBy = o.ClosedBy,
                CancelledAt = o.CancelledAt,
                CancelledBy = o.CancelledBy,
                ReopenedBy = o.ReopenedBy,
                WhatsAppNotified = o.WhatsAppNotified,
                WhatsAppNotifiedAt = o.WhatsAppNotifiedAt,
                WhatsAppMessageId = o.WhatsAppMessageId,
                WhatsAppStatus = o.WhatsAppStatus,
                WhatsAppDeliveredAt = o.WhatsAppDeliveredAt,
                WhatsAppReadAt = o.WhatsAppReadAt
            };
        }).ToList();

        return Ok(new DashboardStatsDto
        {
            TotalVisits = totalVisits,
            VisitsToday = visitsToday,
            TotalOrders = totalOrders,
            PendingOrders = pendingOrders,
            ClosedOrders = closedOrders,
            CancelledOrders = cancelledOrders,
            TotalRevenue = totalRevenue,
            TotalProducts = totalProducts,
            TotalLines = totalLines,
            RecentOrders = recentOrdersDto
        });
    }

    [AllowAnonymous] // público: lo usa la tienda
    [HttpPost("record-visit")]
    public async Task<IActionResult> RecordVisit([FromBody] RecordVisitDto dto)
    {
        var visitorId = dto.VisitorId?.Trim();
        var userAgent = Request.Headers.UserAgent.ToString();

        // Sin identificador válido (versión vieja de la tienda) o con pinta de bot: no se cuenta.
        if (visitorId is null || !VisitorIdPattern.IsMatch(visitorId) || IsBot(userAgent))
            return Ok(new { success = true, counted = false });

        // Una sola visita por persona por día, aunque recorra muchas pantallas.
        var todayStart = StartOfTodayUtc();
        if (await _context.SiteVisits.AnyAsync(v => v.VisitorId == visitorId && v.VisitedAt >= todayStart))
            return Ok(new { success = true, counted = false });

        _context.SiteVisits.Add(new SiteVisit
        {
            VisitorId = visitorId,
            PagePath = string.IsNullOrWhiteSpace(dto.PagePath) ? "/" : dto.PagePath[..Math.Min(dto.PagePath.Length, 300)],
            UserAgent = userAgent.Length > 500 ? userAgent[..500] : userAgent,
            VisitedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, counted = true });
    }

    /// <summary>
    /// Personas distintas (un identificador anónimo por navegador) en total y hoy, no pantallas vistas.
    /// Los registros viejos sin identificador eran pantallas vistas y no se cuentan.
    /// </summary>
    public static async Task<(int Total, int Today)> CountVisitorsAsync(AppDbContext db)
    {
        var todayStart = StartOfTodayUtc();
        var visitors = db.SiteVisits.Where(v => v.VisitorId != null);
        var total = await visitors.Select(v => v.VisitorId).Distinct().CountAsync();
        var today = await visitors.Where(v => v.VisitedAt >= todayStart).Select(v => v.VisitorId).Distinct().CountAsync();
        return (total, today);
    }

    // Paraguay usa UTC-3 todo el año desde octubre de 2024.
    private static readonly TimeSpan ParaguayOffset = TimeSpan.FromHours(-3);

    /// <summary>Medianoche de hoy en Paraguay, expresada en UTC.</summary>
    private static DateTime StartOfTodayUtc() => (DateTime.UtcNow + ParaguayOffset).Date - ParaguayOffset;

    private static readonly System.Text.RegularExpressions.Regex VisitorIdPattern =
        new(@"^[A-Za-z0-9-]{8,64}$", System.Text.RegularExpressions.RegexOptions.Compiled);

    private static readonly System.Text.RegularExpressions.Regex BotPattern =
        new(@"bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit|preview|monitor|curl|wget|python|java/",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Compiled);

    private static bool IsBot(string userAgent) =>
        string.IsNullOrWhiteSpace(userAgent) || BotPattern.IsMatch(userAgent);

    private static string? ExtractCityFromNotes(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes)) return null;
        var match = System.Text.RegularExpressions.Regex.Match(notes, @"(?i)Ciudad:\s*([^\r\n]+)");
        return match.Success ? match.Groups[1].Value.Trim() : null;
    }
}

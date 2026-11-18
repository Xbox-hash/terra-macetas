using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Controllers;

/// <summary>Trabajos realizados: fotos de macetas instaladas en lugares de clientes.</summary>
[ApiController]
[Route("api/[controller]")]
public class WorksController : ControllerBase
{
    public const int MaxImages = 8;

    private readonly AppDbContext _context;

    public WorksController(AppDbContext context)
    {
        _context = context;
    }

    private bool IsAdmin => User.Identity?.IsAuthenticated == true;

    [AllowAnonymous] // público: lo usa la tienda
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClientWorkDto>>> GetAll(
        [FromQuery] bool? onlyFeatured = null,
        [FromQuery] string? productId = null)
    {
        var query = _context.ClientWorks.AsNoTracking().AsQueryable();

        // Los visitantes solo ven los trabajos visibles; el panel /admin ve todos
        if (!IsAdmin) query = query.Where(w => w.Active);
        if (onlyFeatured == true) query = query.Where(w => w.Featured);
        if (!string.IsNullOrWhiteSpace(productId)) query = query.Where(w => w.ProductId == productId);

        var works = await query
            .OrderBy(w => w.SortOrder)
            .ThenByDescending(w => w.CreatedAt)
            .ToListAsync();

        var names = await ProductNamesAsync(works.Select(w => w.ProductId));
        return Ok(works.Select(w => MapToDto(w, names)));
    }

    [AllowAnonymous] // público: lo usa la tienda
    [HttpGet("{id}")]
    public async Task<ActionResult<ClientWorkDto>> GetById(string id)
    {
        var work = await _context.ClientWorks.AsNoTracking().FirstOrDefaultAsync(w => w.Id == id);
        if (work == null || (!work.Active && !IsAdmin)) return NotFound(new { message = "Trabajo no encontrado" });

        var names = await ProductNamesAsync(new[] { work.ProductId });
        return Ok(MapToDto(work, names));
    }

    [HttpPost]
    public async Task<ActionResult<ClientWorkDto>> Create([FromBody] SaveClientWorkDto dto)
    {
        var error = await ValidateAsync(dto);
        if (error != null) return BadRequest(new { message = error });

        var work = new ClientWork
        {
            Id = $"work-{Guid.NewGuid().ToString("N")[..8]}",
            CreatedAt = DateTime.UtcNow
        };
        Apply(work, dto);

        _context.ClientWorks.Add(work);
        await _context.SaveChangesAsync();

        var names = await ProductNamesAsync(new[] { work.ProductId });
        return CreatedAtAction(nameof(GetById), new { id = work.Id }, MapToDto(work, names));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ClientWorkDto>> Update(string id, [FromBody] SaveClientWorkDto dto)
    {
        var work = await _context.ClientWorks.FindAsync(id);
        if (work == null) return NotFound(new { message = "Trabajo no encontrado" });

        var error = await ValidateAsync(dto);
        if (error != null) return BadRequest(new { message = error });

        Apply(work, dto);
        await _context.SaveChangesAsync();

        var names = await ProductNamesAsync(new[] { work.ProductId });
        return Ok(MapToDto(work, names));
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<ClientWorkDto>> ToggleActive(string id)
    {
        var work = await _context.ClientWorks.FindAsync(id);
        if (work == null) return NotFound(new { message = "Trabajo no encontrado" });

        work.Active = !work.Active;
        await _context.SaveChangesAsync();

        var names = await ProductNamesAsync(new[] { work.ProductId });
        return Ok(MapToDto(work, names));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var work = await _context.ClientWorks.FindAsync(id);
        if (work == null) return NotFound(new { message = "Trabajo no encontrado" });

        _context.ClientWorks.Remove(work);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string?> ValidateAsync(SaveClientWorkDto dto)
    {
        var images = CleanImages(dto.Images);
        if (images.Count == 0) return "Subí al menos una foto del trabajo.";
        if (images.Count > MaxImages) return $"Se pueden cargar hasta {MaxImages} fotos por trabajo.";

        if (!string.IsNullOrWhiteSpace(dto.ProductId) &&
            !await _context.Products.AnyAsync(p => p.Id == dto.ProductId))
        {
            return "La pieza elegida ya no existe.";
        }
        return null;
    }

    private static void Apply(ClientWork work, SaveClientWorkDto dto)
    {
        work.ImagesJson = JsonSerializer.Serialize(CleanImages(dto.Images));
        work.ClientName = Trim(dto.ClientName, 150);
        work.ShowClientName = dto.ShowClientName;
        work.City = Trim(dto.City, 120);
        work.Description = Trim(dto.Description, 1000);
        work.ProductId = string.IsNullOrWhiteSpace(dto.ProductId) ? null : dto.ProductId.Trim();
        work.Active = dto.Active;
        work.Featured = dto.Featured;
        work.SortOrder = dto.SortOrder;
    }

    private static List<string> CleanImages(List<string>? images) =>
        (images ?? new List<string>())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct()
            .ToList();

    private static string? Trim(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var t = value.Trim();
        return t.Length > max ? t[..max] : t;
    }

    private async Task<Dictionary<string, string>> ProductNamesAsync(IEnumerable<string?> ids)
    {
        var list = ids.Where(id => !string.IsNullOrEmpty(id)).Select(id => id!).Distinct().ToList();
        if (list.Count == 0) return new Dictionary<string, string>();
        // A los visitantes no se les enlaza una pieza pausada
        return await _context.Products.AsNoTracking()
            .Where(p => list.Contains(p.Id) && (IsAdmin || p.Active))
            .ToDictionaryAsync(p => p.Id, p => p.Name);
    }

    private ClientWorkDto MapToDto(ClientWork w, Dictionary<string, string> productNames)
    {
        List<string> images;
        try
        {
            images = JsonSerializer.Deserialize<List<string>>(w.ImagesJson) ?? new List<string>();
        }
        catch
        {
            images = new List<string>();
        }

        string? productName = null;
        if (w.ProductId != null) productNames.TryGetValue(w.ProductId, out productName);

        return new ClientWorkDto
        {
            Id = w.Id,
            Images = images,
            // Si el cliente no dio permiso, el nombre ni siquiera sale del servidor hacia la tienda
            ClientName = w.ShowClientName || IsAdmin ? w.ClientName : null,
            ShowClientName = w.ShowClientName,
            City = w.City,
            Description = w.Description,
            ProductId = productName != null ? w.ProductId : (IsAdmin ? w.ProductId : null),
            ProductName = productName,
            Active = w.Active,
            Featured = w.Featured,
            SortOrder = w.SortOrder,
            CreatedAt = w.CreatedAt
        };
    }
}

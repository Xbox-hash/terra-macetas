using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LinesController : ControllerBase
{
    private readonly AppDbContext _context;

    public LinesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductLineDto>>> GetAll([FromQuery] bool? onlyActive = null)
    {
        var query = _context.ProductLines.AsNoTracking().AsQueryable();

        if (onlyActive == true)
        {
            query = query.Where(l => l.Active);
        }

        var dtos = await query
            .OrderByDescending(l => l.Featured)
            .ThenBy(l => l.Name)
            .Select(l => new ProductLineDto
            {
                Id = l.Id,
                Name = l.Name,
                Slug = l.Slug,
                Description = l.Description,
                Image = l.Image,
                Active = l.Active,
                Featured = l.Featured,
                ProductsCount = l.Products.Count(p => p.Active)
            })
            .ToListAsync();

        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductLineDto>> GetById(string id)
    {
        var dto = await _context.ProductLines
            .AsNoTracking()
            .Where(l => l.Id == id)
            .Select(l => new ProductLineDto
            {
                Id = l.Id,
                Name = l.Name,
                Slug = l.Slug,
                Description = l.Description,
                Image = l.Image,
                Active = l.Active,
                Featured = l.Featured,
                ProductsCount = l.Products.Count(p => p.Active)
            })
            .FirstOrDefaultAsync();

        if (dto == null) return NotFound(new { message = "Línea no encontrada" });

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<ProductLineDto>> Create([FromBody] CreateProductLineDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "El nombre de la línea es obligatorio" });
        }

        var slug = dto.Name.Trim().ToLower().Replace(" ", "-");

        var line = new ProductLine
        {
            Id = $"line-{Guid.NewGuid().ToString("N")[..8]}",
            Name = dto.Name.Trim(),
            Slug = slug,
            Description = dto.Description?.Trim() ?? string.Empty,
            Image = dto.Image?.Trim() ?? string.Empty,
            Active = dto.Active,
            Featured = dto.Featured,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProductLines.Add(line);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = line.Id }, new ProductLineDto
        {
            Id = line.Id,
            Name = line.Name,
            Slug = line.Slug,
            Description = line.Description,
            Image = line.Image,
            Active = line.Active,
            Featured = line.Featured,
            ProductsCount = 0
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductLineDto>> Update(string id, [FromBody] UpdateProductLineDto dto)
    {
        var line = await _context.ProductLines.FindAsync(id);
        if (line == null) return NotFound(new { message = "Línea no encontrada" });

        line.Name = dto.Name.Trim();
        line.Slug = dto.Name.Trim().ToLower().Replace(" ", "-");
        line.Description = dto.Description?.Trim() ?? string.Empty;
        line.Image = dto.Image?.Trim() ?? string.Empty;
        line.Active = dto.Active;
        line.Featured = dto.Featured;

        await _context.SaveChangesAsync();

        return Ok(new ProductLineDto
        {
            Id = line.Id,
            Name = line.Name,
            Slug = line.Slug,
            Description = line.Description,
            Image = line.Image,
            Active = line.Active,
            Featured = line.Featured,
            ProductsCount = await _context.Products.CountAsync(p => p.LineId == line.Id && p.Active)
        });
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<ProductLineDto>> ToggleActive(string id)
    {
        var line = await _context.ProductLines.FindAsync(id);
        if (line == null) return NotFound(new { message = "Línea no encontrada" });

        line.Active = !line.Active;
        await _context.SaveChangesAsync();

        return Ok(new ProductLineDto
        {
            Id = line.Id,
            Name = line.Name,
            Slug = line.Slug,
            Description = line.Description,
            Image = line.Image,
            Active = line.Active,
            Featured = line.Featured
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var hasProducts = await _context.Products.AnyAsync(p => p.LineId == id);
        if (hasProducts)
        {
            return BadRequest(new { message = "No se puede eliminar una línea que contiene productos asociados. Mueva o elimine los productos primero." });
        }

        var line = await _context.ProductLines.FindAsync(id);
        if (line == null) return NotFound(new { message = "Línea no encontrada" });

        _context.ProductLines.Remove(line);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

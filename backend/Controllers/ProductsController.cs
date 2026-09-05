using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll(
        [FromQuery] string? lineId = null,
        [FromQuery] bool? onlyActive = null,
        [FromQuery] bool? onlyFeatured = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Products.Include(p => p.Line).AsQueryable();

        if (!string.IsNullOrWhiteSpace(lineId) && lineId != "all" && lineId != "todas")
        {
            query = query.Where(p => p.LineId == lineId);
        }

        if (onlyActive == true)
        {
            query = query.Where(p => p.Active);
        }

        if (onlyFeatured == true)
        {
            query = query.Where(p => p.Featured);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Description.ToLower().Contains(s));
        }

        var products = await query.OrderByDescending(p => p.Featured).ThenByDescending(p => p.CreatedAt).ToListAsync();

        var dtos = products.Select(p => MapToDto(p));
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(string id)
    {
        var product = await _context.Products.Include(p => p.Line).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound(new { message = "Producto no encontrado" });

        return Ok(MapToDto(product));
    }

    [HttpGet("related/{lineId}")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetRelated(string lineId, [FromQuery] string? excludeId = null, [FromQuery] int limit = 4)
    {
        var query = _context.Products.Include(p => p.Line)
            .Where(p => p.LineId == lineId && p.Active);

        if (!string.IsNullOrWhiteSpace(excludeId))
        {
            query = query.Where(p => p.Id != excludeId);
        }

        var related = await query.Take(limit).ToListAsync();
        return Ok(related.Select(p => MapToDto(p)));
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || dto.Price <= 0)
        {
            return BadRequest(new { message = "El nombre y un precio válido son obligatorios" });
        }

        var line = await _context.ProductLines.FindAsync(dto.LineId);
        if (line == null)
        {
            return BadRequest(new { message = "La línea seleccionada no existe" });
        }

        var product = new Product
        {
            Id = $"prod-{Guid.NewGuid().ToString("N")[..8]}",
            LineId = dto.LineId,
            Name = dto.Name.Trim(),
            Slug = dto.Name.Trim().ToLower().Replace(" ", "-"),
            Description = dto.Description?.Trim() ?? string.Empty,
            Price = dto.Price,
            ImagesJson = JsonSerializer.Serialize(dto.Images ?? new List<string>()),
            Dimensions = dto.Dimensions?.Trim(),
            Material = dto.Material?.Trim(),
            Finish = dto.Finish?.Trim(),
            Active = dto.Active,
            Featured = dto.Featured,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        product.Line = line;

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, MapToDto(product));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> Update(string id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products.Include(p => p.Line).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound(new { message = "Producto no encontrado" });

        if (product.LineId != dto.LineId)
        {
            var lineExists = await _context.ProductLines.AnyAsync(l => l.Id == dto.LineId);
            if (!lineExists) return BadRequest(new { message = "La línea especificada no existe" });
            product.LineId = dto.LineId;
        }

        product.Name = dto.Name.Trim();
        product.Slug = dto.Name.Trim().ToLower().Replace(" ", "-");
        product.Description = dto.Description?.Trim() ?? string.Empty;
        product.Price = dto.Price;
        product.ImagesJson = JsonSerializer.Serialize(dto.Images ?? new List<string>());
        product.Dimensions = dto.Dimensions?.Trim();
        product.Material = dto.Material?.Trim();
        product.Finish = dto.Finish?.Trim();
        product.Active = dto.Active;
        product.Featured = dto.Featured;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(product));
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<ProductDto>> ToggleActive(string id)
    {
        var product = await _context.Products.Include(p => p.Line).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound(new { message = "Producto no encontrado" });

        product.Active = !product.Active;
        await _context.SaveChangesAsync();

        return Ok(MapToDto(product));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "Producto no encontrado" });

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static ProductDto MapToDto(Product product)
    {
        List<string> imagesList;
        try
        {
            imagesList = JsonSerializer.Deserialize<List<string>>(product.ImagesJson) ?? new List<string>();
        }
        catch
        {
            imagesList = new List<string>();
        }

        return new ProductDto
        {
            Id = product.Id,
            LineId = product.LineId,
            LineName = product.Line?.Name,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            Price = product.Price,
            Images = imagesList,
            Dimensions = product.Dimensions,
            Material = product.Material,
            Finish = product.Finish,
            Active = product.Active,
            Featured = product.Featured,
            CreatedAt = product.CreatedAt
        };
    }
}

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
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [AllowAnonymous] // público: lo usa la tienda
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll(
        [FromQuery] string? lineId = null,
        [FromQuery] bool? onlyActive = null,
        [FromQuery] bool? onlyFeatured = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Products.AsNoTracking().Include(p => p.Line).AsQueryable();

        if (!string.IsNullOrWhiteSpace(lineId) && lineId != "all" && lineId != "todas")
        {
            query = query.Where(p => p.LineId == lineId);
        }

        // Los visitantes de la tienda solo ven productos activos; el panel /admin ve todos
        if (onlyActive == true || User.Identity?.IsAuthenticated != true)
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

        var products = await query
            .OrderByDescending(p => p.Featured)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        var dtos = products.Select(p => MapToDto(p, isList: true));
        return Ok(dtos);
    }

    [AllowAnonymous] // público: lo usa la tienda
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(string id)
    {
        var product = await _context.Products.AsNoTracking().Include(p => p.Line).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound(new { message = "Producto no encontrado" });

        return Ok(MapToDto(product));
    }

    [AllowAnonymous] // público: lo usa la tienda
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

        if (!TryNormalizeInstagramUrl(dto.InstagramUrl, out var instagramUrl))
        {
            return BadRequest(new { message = InstagramUrlError });
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
            ManufacturingTime = dto.ManufacturingTime?.Trim(),
            ColorsJson = JsonSerializer.Serialize(dto.Colors ?? new List<ProductColorDto>()),
            InstagramUrl = instagramUrl,
            DetailPhotosJson = JsonSerializer.Serialize(CleanDetailPhotos(dto.DetailPhotos)),
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

        if (!TryNormalizeInstagramUrl(dto.InstagramUrl, out var instagramUrl))
        {
            return BadRequest(new { message = InstagramUrlError });
        }

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
        product.ManufacturingTime = dto.ManufacturingTime?.Trim();
        if (dto.Colors != null) product.ColorsJson = JsonSerializer.Serialize(dto.Colors);
        product.InstagramUrl = instagramUrl;
        if (dto.DetailPhotos != null) product.DetailPhotosJson = JsonSerializer.Serialize(CleanDetailPhotos(dto.DetailPhotos));
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

    private const int MaxDetailPhotos = 4;
    private const int MaxCaptionLength = 120;
    private const string InstagramUrlError = "El link de Instagram tiene que ser una dirección de instagram.com (por ejemplo https://www.instagram.com/p/...)";

    /// <summary>
    /// Acepta vacío (sin link) o un enlace de instagram.com, que se guarda siempre como https.
    /// Cualquier otro sitio o esquema (por ejemplo "javascript:") se rechaza.
    /// </summary>
    public static bool TryNormalizeInstagramUrl(string? raw, out string? normalized)
    {
        normalized = null;
        if (string.IsNullOrWhiteSpace(raw)) return true;

        var value = raw.Trim();
        if (!value.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !value.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            value = "https://" + value;
        }

        if (value.Length > 500 || !Uri.TryCreate(value, UriKind.Absolute, out var uri)) return false;

        var host = uri.Host.ToLowerInvariant();
        var isInstagram = host == "instagram.com" || host.EndsWith(".instagram.com") || host == "instagr.am";
        if (!isInstagram) return false;

        normalized = new UriBuilder(uri) { Scheme = Uri.UriSchemeHttps, Port = -1 }.Uri.ToString();
        return true;
    }

    private static List<ProductDetailPhotoDto> CleanDetailPhotos(List<ProductDetailPhotoDto>? photos)
    {
        return (photos ?? new List<ProductDetailPhotoDto>())
            .Where(p => !string.IsNullOrWhiteSpace(p.Image))
            .Take(MaxDetailPhotos)
            .Select(p =>
            {
                var caption = (p.Caption ?? string.Empty).Trim();
                return new ProductDetailPhotoDto
                {
                    Image = p.Image.Trim(),
                    Caption = caption.Length > MaxCaptionLength ? caption[..MaxCaptionLength] : caption
                };
            })
            .ToList();
    }

    private static ProductDto MapToDto(Product product, bool isList = false)
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

        List<ProductColorDto> colorsList;
        try
        {
            colorsList = !string.IsNullOrWhiteSpace(product.ColorsJson) 
                ? JsonSerializer.Deserialize<List<ProductColorDto>>(product.ColorsJson) ?? new List<ProductColorDto>() 
                : new List<ProductColorDto>();
        }
        catch
        {
            colorsList = new List<ProductColorDto>();
        }

        List<ProductDetailPhotoDto> detailPhotos;
        try
        {
            detailPhotos = !string.IsNullOrWhiteSpace(product.DetailPhotosJson)
                ? JsonSerializer.Deserialize<List<ProductDetailPhotoDto>>(product.DetailPhotosJson) ?? new List<ProductDetailPhotoDto>()
                : new List<ProductDetailPhotoDto>();
        }
        catch
        {
            detailPhotos = new List<ProductDetailPhotoDto>();
        }

        if (isList)
        {
            // En listados y catálogo prevenimos el reenvío de cadenas base64 masivas en colores
            // Se mantiene el Id, Nombre, Hexadecimal y la indicación de foto
            foreach (var c in colorsList)
            {
                if (c.Image != null && c.Image.StartsWith("data:"))
                {
                    c.Image = "has-photo";
                }
            }
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
            ManufacturingTime = product.ManufacturingTime,
            Colors = colorsList,
            InstagramUrl = product.InstagramUrl,
            DetailPhotos = detailPhotos,
            Active = product.Active,
            Featured = product.Featured,
            CreatedAt = product.CreatedAt
        };
    }
}

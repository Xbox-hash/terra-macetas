using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ColorsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ColorsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PotColor>>> GetAll([FromQuery] bool? onlyActive = null)
    {
        var query = _context.PotColors.AsNoTracking().AsQueryable();

        if (onlyActive == true)
        {
            query = query.Where(c => c.Active);
        }

        var colors = await query.OrderBy(c => c.Name).ToListAsync();
        return Ok(colors);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PotColor>> GetById(string id)
    {
        var color = await _context.PotColors.FindAsync(id);
        if (color == null) return NotFound(new { message = "Color no encontrado" });
        return Ok(color);
    }

    [HttpPost]
    public async Task<ActionResult<PotColor>> Create([FromBody] PotColor color)
    {
        if (string.IsNullOrWhiteSpace(color.Name))
        {
            return BadRequest(new { message = "El nombre del color es obligatorio" });
        }

        if (string.IsNullOrWhiteSpace(color.Id))
        {
            color.Id = Guid.NewGuid().ToString();
        }

        color.CreatedAt = DateTime.UtcNow;

        _context.PotColors.Add(color);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = color.Id }, color);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PotColor>> Update(string id, [FromBody] PotColor updateData)
    {
        var color = await _context.PotColors.FindAsync(id);
        if (color == null) return NotFound(new { message = "Color no encontrado" });

        if (!string.IsNullOrWhiteSpace(updateData.Name))
            color.Name = updateData.Name;

        if (!string.IsNullOrWhiteSpace(updateData.Hex))
            color.Hex = updateData.Hex;

        color.Description = updateData.Description;

        if (updateData.Image != null)
            color.Image = updateData.Image;

        color.Active = updateData.Active;

        await _context.SaveChangesAsync();
        return Ok(color);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var color = await _context.PotColors.FindAsync(id);
        if (color == null) return NotFound(new { message = "Color no encontrado" });

        _context.PotColors.Remove(color);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

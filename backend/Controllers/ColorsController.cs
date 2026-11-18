using Microsoft.AspNetCore.Authorization;
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

    [AllowAnonymous] // público: lo usa la tienda
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PotColor>>> GetAll([FromQuery] bool? onlyActive = null)
    {
        var query = _context.PotColors.AsNoTracking().AsQueryable();

        if (onlyActive == true || User.Identity?.IsAuthenticated != true) //
        {
            query = query.Where(c => c.Active);
        }

        var colors = await query.OrderBy(c => c.Name).ToListAsync();
        return Ok(colors);
    }

    [AllowAnonymous] // público: lo usa la tienda
    [HttpGet("{id}")]
    public async Task<ActionResult<PotColor>> GetById(string id)
    {
        var color = await _context.PotColors.FindAsync(id);
        if (color == null) return NotFound(new { message = "Color no encontrado" });
        return Ok(color);
    }

    public const int MaxDescriptionLength = 500;

    [HttpPost]
    public async Task<ActionResult<PotColor>> Create([FromBody] PotColor color)
    {
        if (string.IsNullOrWhiteSpace(color.Name))
        {
            return BadRequest(new { message = "El nombre del color es obligatorio" });
        }

        var descriptionError = ValidateDescription(color.Description);
        if (descriptionError != null) return BadRequest(new { message = descriptionError });

        if (string.IsNullOrWhiteSpace(color.Id))
        {
            color.Id = Guid.NewGuid().ToString();
        }

        color.Name = color.Name.Trim();
        color.Description = CleanDescription(color.Description);
        color.CreatedAt = DateTime.UtcNow;

        _context.PotColors.Add(color);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = color.Id }, color);
    }

    /// <summary>
    /// Actualiza solo los campos que llegan. Así, activar o desactivar un color
    /// (que manda solo "active") no borra la descripción ni el nombre.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<PotColor>> Update(string id, [FromBody] UpdatePotColorDto updateData)
    {
        var color = await _context.PotColors.FindAsync(id);
        if (color == null) return NotFound(new { message = "Color no encontrado" });

        var descriptionError = ValidateDescription(updateData.Description);
        if (descriptionError != null) return BadRequest(new { message = descriptionError });

        if (!string.IsNullOrWhiteSpace(updateData.Name))
            color.Name = updateData.Name.Trim();

        if (!string.IsNullOrWhiteSpace(updateData.Hex))
            color.Hex = updateData.Hex;

        if (updateData.Description != null)
            color.Description = CleanDescription(updateData.Description);

        if (updateData.Image != null)
            color.Image = updateData.Image;

        if (updateData.Active.HasValue)
            color.Active = updateData.Active.Value;

        await _context.SaveChangesAsync();
        return Ok(color);
    }

    private static string? ValidateDescription(string? description) =>
        description != null && description.Trim().Length > MaxDescriptionLength
            ? $"La descripción puede tener hasta {MaxDescriptionLength} caracteres (tiene {description.Trim().Length})."
            : null;

    private static string? CleanDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? null : description.Trim();

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

/// <summary>Datos para editar un color. Los que no llegan (null) no se tocan.</summary>
public class UpdatePotColorDto
{
    public string? Name { get; set; }
    public string? Hex { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public bool? Active { get; set; }
}

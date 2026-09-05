using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AdminUserDto>> Login([FromBody] LoginRequestDto request)
    {
        var email = request.Email?.Trim().ToLower() ?? string.Empty;
        var user = await _context.AdminUsers.FirstOrDefaultAsync(u => u.Email.ToLower() == email && u.Active);

        // Si no hay usuarios en la base de datos, crear el administrador principal inicial
        if (user == null && !await _context.AdminUsers.AnyAsync())
        {
            user = new AdminUser
            {
                Id = "USR-ADMIN-1",
                Name = "Administrador Principal",
                Email = "admin@terra.com",
                PasswordHash = HashPassword("admin123"),
                Role = "Admin",
                Active = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.AdminUsers.Add(user);
            await _context.SaveChangesAsync();
        }

        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Correo electrónico o contraseña incorrectos." });
        }

        return Ok(MapToDto(user));
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
    {
        var users = await _context.AdminUsers.OrderBy(u => u.Name).ToListAsync();
        return Ok(users.Select(MapToDto));
    }

    [HttpPost("users")]
    public async Task<ActionResult<AdminUserDto>> CreateUser([FromBody] CreateAdminUserDto dto)
    {
        var email = dto.Email.Trim().ToLower();
        if (await _context.AdminUsers.AnyAsync(u => u.Email.ToLower() == email))
        {
            return BadRequest(new { message = "Ya existe un usuario con este correo electrónico." });
        }

        var user = new AdminUser
        {
            Id = $"USR-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
            Name = dto.Name.Trim(),
            Email = email,
            PasswordHash = HashPassword(dto.Password),
            Role = dto.Role ?? "Admin",
            AvatarUrl = dto.AvatarUrl,
            Active = dto.Active,
            CreatedAt = DateTime.UtcNow
        };

        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Login), new { id = user.Id }, MapToDto(user));
    }

    [HttpPut("users/{id}")]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(string id, [FromBody] UpdateAdminUserDto dto)
    {
        var user = await _context.AdminUsers.FindAsync(id);
        if (user == null) return NotFound(new { message = "Usuario no encontrado" });

        var email = dto.Email.Trim().ToLower();
        if (user.Email.ToLower() != email && await _context.AdminUsers.AnyAsync(u => u.Email.ToLower() == email))
        {
            return BadRequest(new { message = "El correo ya está en uso por otro usuario." });
        }

        user.Name = dto.Name.Trim();
        user.Email = email;
        user.Role = dto.Role ?? user.Role;
        user.AvatarUrl = dto.AvatarUrl;
        user.Active = dto.Active;

        if (!string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            user.PasswordHash = HashPassword(dto.NewPassword);
        }

        await _context.SaveChangesAsync();
        return Ok(MapToDto(user));
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _context.AdminUsers.FindAsync(id);
        if (user == null) return NotFound(new { message = "Usuario no encontrado" });

        var totalUsers = await _context.AdminUsers.CountAsync();
        if (totalUsers <= 1)
        {
            return BadRequest(new { message = "No se puede eliminar el único usuario administrador del sistema." });
        }

        _context.AdminUsers.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static AdminUserDto MapToDto(AdminUser u)
    {
        return new AdminUserDto
        {
            Id = u.Id,
            Name = u.Name,
            Email = u.Email,
            Role = u.Role,
            AvatarUrl = u.AvatarUrl,
            Active = u.Active,
            CreatedAt = u.CreatedAt
        };
    }

    private static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }
}

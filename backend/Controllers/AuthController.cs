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

    // 🛡️ Memoria para Bloqueo de Fuerza Bruta (Máximo 5 intentos fallidos, bloqueo de 15 min)
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (int FailedAttempts, DateTime LockoutUntil)> _loginAttempts = new();

    [HttpPost("login")]
    public async Task<ActionResult<AdminUserDto>> Login([FromBody] LoginRequestDto request)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var identifier = (request.Email ?? string.Empty).Trim().ToLower();
        var key = $"{clientIp}_{identifier}";
        var now = DateTime.UtcNow;

        // Verificar si está bloqueado temporalmente
        if (_loginAttempts.TryGetValue(key, out var attemptInfo))
        {
            if (attemptInfo.LockoutUntil > now)
            {
                var remainingMinutes = Math.Ceiling((attemptInfo.LockoutUntil - now).TotalMinutes);
                return StatusCode(429, new { message = $"Demasiados intentos fallidos. Acceso bloqueado temporalmente por {remainingMinutes} minuto(s) por seguridad." });
            }
        }

        var user = await _context.AdminUsers.FirstOrDefaultAsync(u => 
            (u.Email.ToLower() == identifier || u.Name.ToLower() == identifier) && u.Active);

        // Si no hay usuarios en la base de datos, crear el administrador principal inicial
        if (user == null && !await _context.AdminUsers.AnyAsync())
        {
            user = new AdminUser
            {
                Id = "USR-ADMIN-1",
                Name = "admin",
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
            // Registrar intento fallido
            _loginAttempts.AddOrUpdate(key, 
                _ => (1, DateTime.MinValue), 
                (_, old) =>
                {
                    var newCount = old.FailedAttempts + 1;
                    var lockUntil = newCount >= 5 ? now.AddMinutes(15) : DateTime.MinValue;
                    return (newCount, lockUntil);
                });

            return Unauthorized(new { message = "Usuario / correo o contraseña incorrectos." });
        }

        // Si el login fue exitoso, limpiar los intentos fallidos
        _loginAttempts.TryRemove(key, out _);

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
        var name = dto.Name.Trim();
        var email = (dto.Email ?? string.Empty).Trim().ToLower();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "El nombre de usuario es obligatorio." });
        }

        if (await _context.AdminUsers.AnyAsync(u => u.Name.ToLower() == name.ToLower()))
        {
            return BadRequest(new { message = "Ya existe un usuario con este nombre de acceso." });
        }

        if (!string.IsNullOrWhiteSpace(email) && await _context.AdminUsers.AnyAsync(u => u.Email.ToLower() == email))
        {
            return BadRequest(new { message = "Ya existe un usuario con este correo electrónico." });
        }

        var user = new AdminUser
        {
            Id = $"USR-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
            Name = name,
            Email = !string.IsNullOrWhiteSpace(email) ? email : $"{name.ToLower().Replace(" ", "")}@terra.com",
            PasswordHash = HashPassword(dto.Password),
            Role = dto.Role ?? "Admin",
            AvatarUrl = dto.AvatarUrl,
            Permissions = dto.Permissions != null && dto.Permissions.Length > 0 
                ? System.Text.Json.JsonSerializer.Serialize(dto.Permissions) 
                : "all",
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

        var name = dto.Name.Trim();
        var email = (dto.Email ?? string.Empty).Trim().ToLower();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "El nombre de usuario es obligatorio." });
        }

        if (user.Name.ToLower() != name.ToLower() && await _context.AdminUsers.AnyAsync(u => u.Name.ToLower() == name.ToLower()))
        {
            return BadRequest(new { message = "Ya existe otro usuario con este nombre de acceso." });
        }

        if (!string.IsNullOrWhiteSpace(email) && user.Email.ToLower() != email && await _context.AdminUsers.AnyAsync(u => u.Email.ToLower() == email))
        {
            return BadRequest(new { message = "El correo ya está en uso por otro usuario." });
        }

        user.Name = name;
        if (!string.IsNullOrWhiteSpace(email)) user.Email = email;
        user.Role = dto.Role ?? user.Role;
        user.AvatarUrl = dto.AvatarUrl;
        user.Active = dto.Active;

        if (dto.Permissions != null)
        {
            user.Permissions = dto.Permissions.Length > 0 
                ? System.Text.Json.JsonSerializer.Serialize(dto.Permissions) 
                : "all";
        }

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
        string[] permissions = Array.Empty<string>();
        if (!string.IsNullOrWhiteSpace(u.Permissions))
        {
            if (u.Permissions.Trim() == "all")
            {
                permissions = new[] { "all", "dashboard", "analytics", "lines", "products", "company", "users" };
            }
            else
            {
                try
                {
                    permissions = System.Text.Json.JsonSerializer.Deserialize<string[]>(u.Permissions) ?? Array.Empty<string>();
                }
                catch
                {
                    permissions = u.Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                }
            }
        }
        else
        {
            permissions = new[] { "all", "dashboard", "analytics", "lines", "products", "company", "users" };
        }

        return new AdminUserDto
        {
            Id = u.Id,
            Name = u.Name,
            Email = u.Email,
            Role = u.Role,
            AvatarUrl = u.AvatarUrl,
            Permissions = permissions,
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

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TerraMacetas.Api.Models;
using TerraMacetas.Api.Options;

namespace TerraMacetas.Api.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateToken(AdminUser user, IEnumerable<string> permissions);
}

/// <summary>Genera el JWT que el panel /admin envía en el header Authorization.</summary>
public class TokenService : ITokenService
{
    /// <summary>Nombre del claim que lleva cada permiso del usuario (dashboard, products, users...).</summary>
    public const string PermissionClaim = "perm";

    private readonly JwtOptions _options;
    private readonly SymmetricSecurityKey _signingKey;

    public TokenService(IOptions<JwtOptions> options, SymmetricSecurityKey signingKey)
    {
        _options = options.Value;
        _signingKey = signingKey;
    }

    public (string Token, DateTime ExpiresAtUtc) CreateToken(AdminUser user, IEnumerable<string> permissions)
    {
        var expires = DateTime.UtcNow.AddHours(_options.ExpiresHours);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role)
        };
        claims.AddRange(permissions.Distinct().Select(p => new Claim(PermissionClaim, p)));

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    /// <summary>
    /// Crea la clave de firma. Si Jwt:Key no está configurada genera una aleatoria:
    /// el login funciona, pero las sesiones se pierden al reiniciar la API.
    /// </summary>
    public static SymmetricSecurityKey BuildSigningKey(JwtOptions options, ILogger logger)
    {
        if (!string.IsNullOrWhiteSpace(options.Key))
        {
            var bytes = Encoding.UTF8.GetBytes(options.Key);
            if (bytes.Length < 32)
            {
                throw new InvalidOperationException("Jwt:Key debe tener al menos 32 caracteres.");
            }
            return new SymmetricSecurityKey(bytes);
        }

        logger.LogWarning("Jwt:Key no está configurada. Se usa una clave temporal: las sesiones de /admin se cerrarán al reiniciar la API. Configure la variable de entorno Jwt__Key.");
        return new SymmetricSecurityKey(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));
    }
}

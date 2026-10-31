using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Services;

public enum PasswordCheck
{
    Invalid,
    Valid,
    /// <summary>Correcta, pero guardada con el formato viejo: hay que volver a hashearla.</summary>
    ValidNeedsRehash
}

public interface IPasswordService
{
    string Hash(AdminUser user, string password);
    PasswordCheck Verify(AdminUser user, string password);
}

/// <summary>
/// Hashea contraseñas con PasswordHasher de ASP.NET Core Identity (PBKDF2 + salt aleatorio).
/// Acepta también el formato viejo (SHA256 sin salt) para no dejar afuera a los usuarios
/// existentes: al iniciar sesión se convierten al formato nuevo.
/// </summary>
public class PasswordService : IPasswordService
{
    private readonly PasswordHasher<AdminUser> _hasher = new();

    public string Hash(AdminUser user, string password) => _hasher.HashPassword(user, password);

    public PasswordCheck Verify(AdminUser user, string password)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(user.PasswordHash))
        {
            return PasswordCheck.Invalid;
        }

        if (IsLegacySha256(user.PasswordHash))
        {
            var legacy = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(password)));
            var ok = CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(legacy), Encoding.UTF8.GetBytes(user.PasswordHash));
            return ok ? PasswordCheck.ValidNeedsRehash : PasswordCheck.Invalid;
        }

        return _hasher.VerifyHashedPassword(user, user.PasswordHash, password) switch
        {
            PasswordVerificationResult.Success => PasswordCheck.Valid,
            PasswordVerificationResult.SuccessRehashNeeded => PasswordCheck.ValidNeedsRehash,
            _ => PasswordCheck.Invalid
        };
    }

    // Un SHA256 en Base64 siempre mide 44 caracteres; los hashes de Identity son mucho más largos.
    private static bool IsLegacySha256(string hash) => hash.Length == 44 && hash.EndsWith('=');
}

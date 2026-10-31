using System.Security.Cryptography;
using System.Text;
using TerraMacetas.Api.Models;
using TerraMacetas.Api.Services;

namespace TerraMacetas.Api.Tests;

public class PasswordServiceTests
{
    private readonly PasswordService _service = new();

    [Fact]
    public void Hash_nuevo_verifica_y_no_guarda_la_contrasena_en_claro()
    {
        var user = new AdminUser { Id = "u1" };
        user.PasswordHash = _service.Hash(user, "MiClave#2026");

        Assert.DoesNotContain("MiClave", user.PasswordHash);
        Assert.Equal(PasswordCheck.Valid, _service.Verify(user, "MiClave#2026"));
        Assert.Equal(PasswordCheck.Invalid, _service.Verify(user, "otra"));
    }

    [Fact]
    public void Dos_usuarios_con_la_misma_contrasena_tienen_hashes_distintos()
    {
        // Gracias al salt aleatorio, no se puede saber si dos usuarios comparten contraseña
        var a = new AdminUser { Id = "a" };
        var b = new AdminUser { Id = "b" };

        Assert.NotEqual(_service.Hash(a, "1234"), _service.Hash(b, "1234"));
    }

    [Fact]
    public void Acepta_el_formato_viejo_SHA256_y_pide_rehashear()
    {
        var legacy = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes("admin123")));
        var user = new AdminUser { Id = "viejo", PasswordHash = legacy };

        Assert.Equal(PasswordCheck.ValidNeedsRehash, _service.Verify(user, "admin123"));
        Assert.Equal(PasswordCheck.Invalid, _service.Verify(user, "incorrecta"));
    }
}

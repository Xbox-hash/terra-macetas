using TerraMacetas.Api.Controllers;

namespace TerraMacetas.Api.Tests;

public class InstagramUrlTests
{
    [Theory]
    [InlineData("https://www.instagram.com/p/ABC123/", "https://www.instagram.com/p/ABC123/")]
    [InlineData("http://instagram.com/p/ABC123", "https://instagram.com/p/ABC123")]
    [InlineData("  www.instagram.com/reel/XYZ/  ", "https://www.instagram.com/reel/XYZ/")]
    public void Links_de_instagram_se_aceptan_y_quedan_en_https(string raw, string expected)
    {
        Assert.True(ProductsController.TryNormalizeInstagramUrl(raw, out var normalized));
        Assert.Equal(expected, normalized);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Vacio_significa_sin_link(string? raw)
    {
        Assert.True(ProductsController.TryNormalizeInstagramUrl(raw, out var normalized));
        Assert.Null(normalized);
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("https://instagram.com.sitio-falso.com/p/1")]
    [InlineData("https://facebook.com/terra")]
    [InlineData("https://notinstagram.com/p/1")]
    public void Otros_sitios_o_esquemas_se_rechazan(string raw)
    {
        Assert.False(ProductsController.TryNormalizeInstagramUrl(raw, out _));
    }
}

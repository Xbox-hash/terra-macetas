using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;
using TerraMacetas.Api.Services;

namespace TerraMacetas.Api.Tests;

public class OrderPricingTests
{
    private static readonly Dictionary<string, Product> Catalog = new()
    {
        ["p1"] = new Product { Id = "p1", Name = "Maceta Luna", Price = 50_000m, Active = true, ImagesJson = "[\"/uploads/luna.jpg\"]" },
        ["p2"] = new Product { Id = "p2", Name = "Maceta Sol", Price = 35_000m, Active = true },
        ["off"] = new Product { Id = "off", Name = "Descontinuada", Price = 10_000m, Active = false }
    };

    [Fact]
    public void Usa_el_precio_de_la_base_y_no_el_del_navegador()
    {
        // El navegador manda precio 1 y subtotal 1: se tienen que ignorar
        var items = new List<OrderItemDto>
        {
            new() { ProductId = "p1", ProductName = "Maceta Luna", Price = 1m, Subtotal = 1m, Quantity = 2 },
            new() { ProductId = "p2", ProductName = "Maceta Sol", Price = 1m, Subtotal = 1m, Quantity = 1 }
        };

        var result = OrderPricing.Calculate(items, Catalog);

        Assert.True(result.IsSuccess);
        Assert.Equal(135_000m, result.Value!.Total); // 2 x 50.000 + 1 x 35.000
        Assert.Equal(50_000m, result.Value.Items[0].Price);
        Assert.Equal(100_000m, result.Value.Items[0].Subtotal);
        Assert.Equal("/uploads/luna.jpg", result.Value.Items[0].ProductImage);
    }

    [Fact]
    public void Conserva_el_color_elegido_pero_el_nombre_sale_de_la_base()
    {
        var items = new List<OrderItemDto>
        {
            new() { ProductId = "p1", ProductName = "Nombre inventado (Color: Terracota)", Quantity = 1 }
        };

        var result = OrderPricing.Calculate(items, Catalog);

        Assert.Equal("Maceta Luna (Color: Terracota)", result.Value!.Items[0].ProductName);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    [InlineData(OrderPricing.MaxQuantity + 1)]
    public void Rechaza_cantidades_invalidas(int quantity)
    {
        var items = new List<OrderItemDto> { new() { ProductId = "p1", Quantity = quantity } };

        var result = OrderPricing.Calculate(items, Catalog);

        Assert.False(result.IsSuccess);
    }

    [Theory]
    [InlineData("off")]       // producto desactivado
    [InlineData("no-existe")] // id inventado
    public void Rechaza_productos_no_disponibles(string productId)
    {
        var items = new List<OrderItemDto> { new() { ProductId = productId, Quantity = 1 } };

        var result = OrderPricing.Calculate(items, Catalog);

        Assert.False(result.IsSuccess);
        Assert.NotNull(result.Error);
    }

    [Fact]
    public void Rechaza_un_pedido_vacio()
    {
        var result = OrderPricing.Calculate(new List<OrderItemDto>(), Catalog);

        Assert.False(result.IsSuccess);
    }
}

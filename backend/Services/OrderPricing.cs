using System.Text.Json;
using System.Text.RegularExpressions;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Services;

/// <summary>
/// Resultado de una operación que puede fallar por una regla de negocio (patrón Result):
/// en vez de lanzar una excepción o devolver null, se devuelve el error como un valor.
/// </summary>
public record Result<T>(bool IsSuccess, T? Value, string? Error)
{
    public static Result<T> Ok(T value) => new(true, value, null);
    public static Result<T> Fail(string error) => new(false, default, error);
}

public record PricedOrder(List<OrderItemDto> Items, decimal Total);

/// <summary>
/// Calcula el total de un pedido con los precios de la base de datos.
/// Nunca se confía en el precio, subtotal ni total que manda el navegador.
/// </summary>
public static class OrderPricing
{
    public const int MaxItems = 50;
    public const int MaxQuantity = 999;

    private static readonly Regex ColorSuffix = new(@"\(Color:\s*([^)]{1,60})\)\s*$", RegexOptions.IgnoreCase);

    public static Result<PricedOrder> Calculate(
        IReadOnlyCollection<OrderItemDto>? requestedItems,
        IReadOnlyDictionary<string, Product> productsById)
    {
        if (requestedItems is null || requestedItems.Count == 0)
            return Result<PricedOrder>.Fail("El pedido no tiene productos.");

        if (requestedItems.Count > MaxItems)
            return Result<PricedOrder>.Fail($"El pedido no puede tener más de {MaxItems} productos distintos.");

        var priced = new List<OrderItemDto>(requestedItems.Count);
        decimal total = 0m;

        foreach (var item in requestedItems)
        {
            if (item.Quantity < 1 || item.Quantity > MaxQuantity)
                return Result<PricedOrder>.Fail($"La cantidad de cada producto debe estar entre 1 y {MaxQuantity}.");

            if (!productsById.TryGetValue(item.ProductId, out var product) || !product.Active)
                return Result<PricedOrder>.Fail("Uno de los productos ya no está disponible. Actualice el carrito e intente de nuevo.");

            var subtotal = product.Price * item.Quantity;
            total += subtotal;

            priced.Add(new OrderItemDto
            {
                ProductId = product.Id,
                ProductName = BuildName(product.Name, item.ProductName),
                ProductImage = FirstImage(product.ImagesJson),
                Price = product.Price,
                Quantity = item.Quantity,
                Subtotal = subtotal
            });
        }

        return Result<PricedOrder>.Ok(new PricedOrder(priced, total));
    }

    // El nombre sale de la base; del navegador solo se toma el color elegido, si vino.
    private static string BuildName(string dbName, string? clientName)
    {
        var match = ColorSuffix.Match(clientName ?? string.Empty);
        return match.Success ? $"{dbName} (Color: {match.Groups[1].Value.Trim()})" : dbName;
    }

    private static string? FirstImage(string? imagesJson)
    {
        if (string.IsNullOrWhiteSpace(imagesJson)) return null;
        try
        {
            return JsonSerializer.Deserialize<List<string>>(imagesJson)?.FirstOrDefault();
        }
        catch (JsonException)
        {
            return null;
        }
    }
}

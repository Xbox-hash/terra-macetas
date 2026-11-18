using System.ComponentModel.DataAnnotations;

namespace TerraMacetas.Api.Models;

/// <summary>
/// Trabajo realizado: fotos de macetas ya instaladas en casas, negocios u oficinas de clientes.
/// Todo es opcional salvo las fotos.
/// </summary>
public class ClientWork
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Fotos (rutas /uploads/works/...) como JSON. La primera es la portada.</summary>
    public string ImagesJson { get; set; } = "[]";

    /// <summary>Para quién fue el trabajo ("Familia B.", "Cafetería en Villa Morra").</summary>
    [MaxLength(150)]
    public string? ClientName { get; set; }

    /// <summary>Si es false, en la tienda no se muestra el nombre del cliente (solo la ciudad).</summary>
    public bool ShowClientName { get; set; } = true;

    [MaxLength(120)]
    public string? City { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>Pieza usada en el trabajo (opcional). No es FK: si se borra el producto, el trabajo queda.</summary>
    [MaxLength(100)]
    public string? ProductId { get; set; }

    public bool Active { get; set; } = true;

    /// <summary>Los destacados se muestran en el carrusel del inicio.</summary>
    public bool Featured { get; set; } = false;

    /// <summary>Orden manual (menor primero).</summary>
    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

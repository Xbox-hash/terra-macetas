namespace TerraMacetas.Api.DTOs;

public class ClientWorkDto
{
    public string Id { get; set; } = string.Empty;
    public List<string> Images { get; set; } = new();
    /// <summary>En la tienda llega vacío si el trabajo no permite mostrar el nombre.</summary>
    public string? ClientName { get; set; }
    public bool ShowClientName { get; set; }
    public string? City { get; set; }
    public string? Description { get; set; }
    public string? ProductId { get; set; }
    public string? ProductName { get; set; }
    public bool Active { get; set; }
    public bool Featured { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SaveClientWorkDto
{
    public List<string>? Images { get; set; }
    public string? ClientName { get; set; }
    public bool ShowClientName { get; set; } = true;
    public string? City { get; set; }
    public string? Description { get; set; }
    public string? ProductId { get; set; }
    public bool Active { get; set; } = true;
    public bool Featured { get; set; }
    public int SortOrder { get; set; }
}

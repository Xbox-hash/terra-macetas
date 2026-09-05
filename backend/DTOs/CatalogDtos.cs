namespace TerraMacetas.Api.DTOs;

public class ProductLineDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public bool Active { get; set; }
    public bool Featured { get; set; }
    public int ProductsCount { get; set; }
}

public class CreateProductLineDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
    public bool Featured { get; set; } = false;
}

public class UpdateProductLineDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public bool Active { get; set; }
    public bool Featured { get; set; }
}

public class ProductDto
{
    public string Id { get; set; } = string.Empty;
    public string LineId { get; set; } = string.Empty;
    public string? LineName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public List<string> Images { get; set; } = new();
    public string? Dimensions { get; set; }
    public string? Material { get; set; }
    public string? Finish { get; set; }
    public bool Active { get; set; }
    public bool Featured { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateProductDto
{
    public string LineId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public List<string> Images { get; set; } = new();
    public string? Dimensions { get; set; }
    public string? Material { get; set; }
    public string? Finish { get; set; }
    public bool Active { get; set; } = true;
    public bool Featured { get; set; } = false;
}

public class UpdateProductDto
{
    public string LineId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public List<string> Images { get; set; } = new();
    public string? Dimensions { get; set; }
    public string? Material { get; set; }
    public string? Finish { get; set; }
    public bool Active { get; set; }
    public bool Featured { get; set; }
}

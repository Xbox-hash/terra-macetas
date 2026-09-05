using System.Text.Json;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (context.ProductLines.Any()) return;

        var ceramica = new ProductLine
        {
            Id = "line-ceramica",
            Name = "Línea Cerámica Artesanal",
            Slug = "ceramica-artesanal",
            Description = "Piezas torneadas a mano con esmaltes mate, texturas orgánicas y acabados únicos cocidos en alta temperatura.",
            Image = "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80",
            Active = true,
            Featured = true,
            CreatedAt = DateTime.UtcNow
        };

        var minimalista = new ProductLine
        {
            Id = "line-minimalista",
            Name = "Línea Minimalista Nórdica",
            Slug = "minimalista-nordica",
            Description = "Líneas puras, geometrías esenciales y paletas neutras que realzan la forma natural y pureza de cada planta.",
            Image = "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=1000&q=80",
            Active = true,
            Featured = true,
            CreatedAt = DateTime.UtcNow
        };

        var exterior = new ProductLine
        {
            Id = "line-exterior",
            Name = "Línea Exterior & Terrazas",
            Slug = "exterior-terrazas",
            Description = "Estructuras resistentes a la intemperie fabricadas en hormigón liviano, fibrocemento y barro curado para patios y jardines.",
            Image = "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1000&q=80",
            Active = true,
            Featured = true,
            CreatedAt = DateTime.UtcNow
        };

        var decorativa = new ProductLine
        {
            Id = "line-decorativa",
            Name = "Línea Decorativa & Escultórica",
            Slug = "decorativa-escultorica",
            Description = "Objetos con carácter y siluetas esculturales diseñados para convertirse en el punto focal de livings y oficinas.",
            Image = "https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=1000&q=80",
            Active = true,
            Featured = true,
            CreatedAt = DateTime.UtcNow
        };

        await context.ProductLines.AddRangeAsync(ceramica, minimalista, exterior, decorativa);

        var products = new List<Product>
        {
            new Product
            {
                Id = "prod-1",
                LineId = "line-ceramica",
                Name = "Maceta Roma Terracota",
                Slug = "maceta-roma-terracota",
                Description = "Maceta cilíndrica de cerámica artesanal con textura terrosa al tacto y base acampanada. Ideal para monsteras, ficus o sansevierias en espacios cálidos e iluminados.",
                Price = 85000,
                ImagesJson = JsonSerializer.Serialize(new[] {
                    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80",
                    "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=1000&q=80",
                    "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1000&q=80"
                }),
                Dimensions = "Ø 24 cm x Alto 28 cm",
                Material = "Cerámica cocida a alta temperatura con orificio de drenaje",
                Finish = "Esmalte satinado terracota natural",
                Active = true,
                Featured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = "prod-2",
                LineId = "line-ceramica",
                Name = "Maceta Bali Arena",
                Slug = "maceta-bali-arena",
                Description = "Diseño orgánico modelado a torno con finas estrías horizontales y esmalte mate en tonalidad arena cálida. Realza la frescura de helechos y calatheas.",
                Price = 110000,
                ImagesJson = JsonSerializer.Serialize(new[] {
                    "https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=1000&q=80",
                    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80"
                }),
                Dimensions = "Ø 28 cm x Alto 32 cm",
                Material = "Arcilla refractaria esmaltada a mano",
                Finish = "Arena texturada mate",
                Active = true,
                Featured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = "prod-3",
                LineId = "line-minimalista",
                Name = "Cilindro Tokio Blanco Mate",
                Slug = "cilindro-tokio-blanco-mate",
                Description = "Silueta minimalista japonesa con plato oculto anti-derrame. Perfecta para escritorios, repisas y ambientes donde reina la sobriedad.",
                Price = 65000,
                ImagesJson = JsonSerializer.Serialize(new[] {
                    "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=1000&q=80"
                }),
                Dimensions = "Ø 18 cm x Alto 20 cm",
                Material = "Cerámica técnica de alta densidad",
                Finish = "Blanco tiza mate impermeable",
                Active = true,
                Featured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = "prod-4",
                LineId = "line-minimalista",
                Name = "Maceta Cube Grafito",
                Slug = "maceta-cube-grafito",
                Description = "Geometría cúbica depurada con bordes ligeramente biselados. Proporciona un contraste sofisticado con plantas de hojas verdes exuberantes.",
                Price = 95000,
                ImagesJson = JsonSerializer.Serialize(new[] {
                    "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80"
                }),
                Dimensions = "22 x 22 x Alto 24 cm",
                Material = "Gres cerámico reforzado",
                Finish = "Gris grafito antracita mate",
                Active = true,
                Featured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = "prod-5",
                LineId = "line-exterior",
                Name = "Maceta Tótem Cemento Natural",
                Slug = "maceta-totem-cemento-natural",
                Description = "Maceta de gran porte cónica elaborada en hormigón arquitectónico aligerado. Ideal para exteriores protegidos, galerías y entradas principales.",
                Price = 185000,
                ImagesJson = JsonSerializer.Serialize(new[] {
                    "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1000&q=80"
                }),
                Dimensions = "Ø 35 cm x Alto 55 cm",
                Material = "Hormigón aligerado con hidrófugo sellador",
                Finish = "Hormigón visto pulido natural",
                Active = true,
                Featured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = "prod-7",
                LineId = "line-decorativa",
                Name = "Jarrón Escultórico Ánfora",
                Slug = "jarron-escultorico-anfora",
                Description = "Pieza de diseño con asas redondeadas orgánicas inspirada en la alfarería clásica mediterránea pero reinterpretada en clave contemporánea.",
                Price = 135000,
                ImagesJson = JsonSerializer.Serialize(new[] {
                    "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80"
                }),
                Dimensions = "Ø 20 cm x Alto 35 cm",
                Material = "Loza esmaltada con acabado poroso",
                Finish = "Blanco yeso crudo",
                Active = true,
                Featured = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();
    }
}

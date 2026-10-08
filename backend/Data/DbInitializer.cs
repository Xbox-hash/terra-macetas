namespace TerraMacetas.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Solo asegurar que la estructura y tablas de la base de datos existan
        await context.Database.EnsureCreatedAsync();
        // Sin datos semilla por defecto: el catálogo y datos son administrados exclusivamente por el usuario
    }
}

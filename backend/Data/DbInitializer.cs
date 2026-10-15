using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace TerraMacetas.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context, IWebHostEnvironment? env = null)
    {
        // Solo asegurar que la estructura y tablas de la base de datos existan
        await context.Database.EnsureCreatedAsync();

        if (env != null)
        {
            await MigrateBase64ImagesToFilesAsync(context, env);
        }
    }

    /// <summary>
    /// Migra imágenes históricas guardadas como Base64 hacia archivos físicos en wwwroot/uploads
    /// y actualiza la base de datos para almacenar únicamente su ruta relativa.
    /// </summary>
    public static async Task MigrateBase64ImagesToFilesAsync(AppDbContext context, IWebHostEnvironment env)
    {
        try
        {
            var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var companyDir = Path.Combine(webRoot, "uploads", "company");
            Directory.CreateDirectory(companyDir);

            // 1. Migrar CompanyConfigs
            var configs = await context.CompanyConfigs.ToListAsync();
            bool changed = false;

            foreach (var cfg in configs)
            {
                if (!string.IsNullOrWhiteSpace(cfg.LogoUrl) && cfg.LogoUrl.StartsWith("data:image/"))
                {
                    var filePath = Path.Combine(companyDir, "store-logo.png");
                    if (TrySaveBase64(cfg.LogoUrl, filePath))
                    {
                        cfg.LogoUrl = "/uploads/company/store-logo.png";
                        changed = true;
                    }
                }

                if (!string.IsNullOrWhiteSpace(cfg.PhilosophyImageUrl) && cfg.PhilosophyImageUrl.StartsWith("data:image/"))
                {
                    var filePath = Path.Combine(companyDir, "store-philosophy.jpg");
                    if (TrySaveBase64(cfg.PhilosophyImageUrl, filePath))
                    {
                        cfg.PhilosophyImageUrl = "/uploads/company/store-philosophy.jpg";
                        changed = true;
                    }
                }

                if (!string.IsNullOrWhiteSpace(cfg.HeroImageUrl) && cfg.HeroImageUrl.StartsWith("data:image/"))
                {
                    var filePath = Path.Combine(companyDir, "store-hero.jpg");
                    if (TrySaveBase64(cfg.HeroImageUrl, filePath))
                    {
                        cfg.HeroImageUrl = "/uploads/company/store-hero.jpg";
                        changed = true;
                    }
                }
            }

            // 2. Migrar PotColors
            var colorsDir = Path.Combine(webRoot, "uploads", "colors");
            Directory.CreateDirectory(colorsDir);
            var potColors = await context.PotColors.ToListAsync();
            foreach (var color in potColors)
            {
                if (!string.IsNullOrWhiteSpace(color.Image) && color.Image.StartsWith("data:image/"))
                {
                    var ext = GetExtension(color.Image);
                    var fileName = $"{color.Id}{ext}";
                    var filePath = Path.Combine(colorsDir, fileName);
                    if (TrySaveBase64(color.Image, filePath))
                    {
                        color.Image = $"/uploads/colors/{fileName}";
                        changed = true;
                    }
                }
            }

            // 3. Migrar ProductLines
            var linesDir = Path.Combine(webRoot, "uploads", "lines");
            Directory.CreateDirectory(linesDir);
            var lines = await context.ProductLines.ToListAsync();
            foreach (var line in lines)
            {
                if (!string.IsNullOrWhiteSpace(line.Image) && line.Image.StartsWith("data:image/"))
                {
                    var ext = GetExtension(line.Image);
                    var fileName = $"{line.Id}{ext}";
                    var filePath = Path.Combine(linesDir, fileName);
                    if (TrySaveBase64(line.Image, filePath))
                    {
                        line.Image = $"/uploads/lines/{fileName}";
                        changed = true;
                    }
                }
            }

            // 4. Migrar Products (ImagesJson y ColorsJson)
            var prodsDir = Path.Combine(webRoot, "uploads", "products");
            Directory.CreateDirectory(prodsDir);
            var products = await context.Products.ToListAsync();
            foreach (var prod in products)
            {
                // ImagesJson
                if (!string.IsNullOrWhiteSpace(prod.ImagesJson) && prod.ImagesJson.Contains("data:image/"))
                {
                    try
                    {
                        var jsonNode = System.Text.Json.Nodes.JsonNode.Parse(prod.ImagesJson);
                        if (jsonNode is System.Text.Json.Nodes.JsonArray array)
                        {
                            bool modifiedArray = false;
                            for (int i = 0; i < array.Count; i++)
                            {
                                var imgVal = array[i]?.ToString();
                                if (!string.IsNullOrWhiteSpace(imgVal) && imgVal.StartsWith("data:image/"))
                                {
                                    var ext = GetExtension(imgVal);
                                    var fileName = $"{prod.Id}-img-{i}{ext}";
                                    var filePath = Path.Combine(prodsDir, fileName);
                                    if (TrySaveBase64(imgVal, filePath))
                                    {
                                        array[i] = $"/uploads/products/{fileName}";
                                        modifiedArray = true;
                                    }
                                }
                            }
                            if (modifiedArray)
                            {
                                prod.ImagesJson = array.ToJsonString();
                                changed = true;
                            }
                        }
                    }
                    catch (Exception jsonEx)
                    {
                        Console.WriteLine($"[MigrateBase64] Error parsing ImagesJson for product {prod.Id}: {jsonEx.Message}");
                    }
                }

                // ColorsJson
                if (!string.IsNullOrWhiteSpace(prod.ColorsJson) && prod.ColorsJson.Contains("data:image/"))
                {
                    try
                    {
                        var jsonNode = System.Text.Json.Nodes.JsonNode.Parse(prod.ColorsJson);
                        if (jsonNode is System.Text.Json.Nodes.JsonArray array)
                        {
                            bool modifiedArray = false;
                            for (int i = 0; i < array.Count; i++)
                            {
                                var item = array[i];
                                if (item is System.Text.Json.Nodes.JsonObject obj && obj["image"] != null)
                                {
                                    var imgVal = obj["image"]?.ToString();
                                    if (!string.IsNullOrWhiteSpace(imgVal) && imgVal.StartsWith("data:image/"))
                                    {
                                        var colorId = obj["colorId"]?.ToString() ?? $"col-{i}";
                                        var ext = GetExtension(imgVal);
                                        var fileName = $"{prod.Id}-{colorId}{ext}";
                                        var filePath = Path.Combine(colorsDir, fileName);
                                        if (TrySaveBase64(imgVal, filePath))
                                        {
                                            obj["image"] = $"/uploads/colors/{fileName}";
                                            modifiedArray = true;
                                        }
                                    }
                                }
                            }
                            if (modifiedArray)
                            {
                                prod.ColorsJson = array.ToJsonString();
                                changed = true;
                            }
                        }
                    }
                    catch (Exception jsonEx)
                    {
                        Console.WriteLine($"[MigrateBase64] Error parsing ColorsJson for product {prod.Id}: {jsonEx.Message}");
                    }
                }
            }

            if (changed)
            {
                await context.SaveChangesAsync();
                Console.WriteLine("[MigrateBase64] Migración completada exitosamente. Todas las imágenes Base64 fueron guardadas en disco.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MigrateBase64] Error migrando imágenes: {ex.Message}");
        }
    }

    private static string GetExtension(string dataUri)
    {
        if (dataUri.StartsWith("data:image/png")) return ".png";
        if (dataUri.StartsWith("data:image/webp")) return ".webp";
        if (dataUri.StartsWith("data:image/gif")) return ".gif";
        return ".jpg";
    }

    private static bool TrySaveBase64(string dataUri, string outputPath)
    {
        try
        {
            var commaIndex = dataUri.IndexOf(',');
            var base64 = commaIndex >= 0 ? dataUri[(commaIndex + 1)..] : dataUri;
            var bytes = Convert.FromBase64String(base64);
            File.WriteAllBytes(outputPath, bytes);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

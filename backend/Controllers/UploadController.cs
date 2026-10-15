using Microsoft.AspNetCore.Mvc;

namespace TerraMacetas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"
    };
    private static readonly HashSet<string> AllowedFolders = new(StringComparer.OrdinalIgnoreCase)
    {
        "products", "lines", "colors", "company"
    };

    public UploadController(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// Sube un archivo físico de imagen multipart/form-data a la carpeta de uploads del servidor.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> UploadFile([FromForm] IFormFile? file, [FromForm] string? folder = "products")
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No se proporcionó ningún archivo de imagen." });
        }

        // Límite de tamaño: 10MB
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { message = "El archivo excede el tamaño máximo permitido de 10MB." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
        {
            return BadRequest(new { message = "Tipo de archivo no permitido. Solo se admiten imágenes (.jpg, .jpeg, .png, .webp, .svg, .gif)." });
        }

        var safeFolder = SanitizeFolder(folder);
        var targetDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", safeFolder);
        Directory.CreateDirectory(targetDir);

        var fileName = $"{safeFolder.TrimEnd('s')}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6]}{ext}";
        var filePath = Path.Combine(targetDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/uploads/{safeFolder}/{fileName}";
        return Ok(new { url = relativeUrl });
    }

    /// <summary>
    /// Recibe una imagen procesada o comprimida en Base64, la guarda físicamente como archivo en el disco y devuelve la URL relativa.
    /// </summary>
    [HttpPost("base64")]
    public async Task<IActionResult> UploadBase64([FromBody] Base64UploadRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Base64))
        {
            return BadRequest(new { message = "El contenido Base64 de la imagen es obligatorio." });
        }

        var data = request.Base64.Trim();
        var ext = ".jpg";

        // Extraer formato si contiene el prefijo data:image/...;base64,
        if (data.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            var headerEnd = data.IndexOf(";base64,", StringComparison.OrdinalIgnoreCase);
            if (headerEnd > 0)
            {
                var mime = data.Substring(11, headerEnd - 11).ToLowerInvariant();
                ext = mime switch
                {
                    "png" => ".png",
                    "webp" => ".webp",
                    "svg+xml" => ".svg",
                    "gif" => ".gif",
                    _ => ".jpg"
                };
                data = data[(headerEnd + 8)..];
            }
        }

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(data);
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "La cadena proporcionada no es un Base64 válido." });
        }

        if (bytes.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { message = "La imagen supera el límite de 10MB." });
        }

        var safeFolder = SanitizeFolder(request.Folder);
        var targetDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", safeFolder);
        Directory.CreateDirectory(targetDir);

        var fileName = $"{safeFolder.TrimEnd('s')}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6]}{ext}";
        var filePath = Path.Combine(targetDir, fileName);

        await System.IO.File.WriteAllBytesAsync(filePath, bytes);

        var relativeUrl = $"/uploads/{safeFolder}/{fileName}";
        return Ok(new { url = relativeUrl });
    }

    private static string SanitizeFolder(string? folder)
    {
        if (string.IsNullOrWhiteSpace(folder)) return "products";
        var lower = folder.Trim().ToLowerInvariant();
        return AllowedFolders.Contains(lower) ? lower : "products";
    }
}

public class Base64UploadRequest
{
    public string Base64 { get; set; } = string.Empty;
    public string? Folder { get; set; } = "products";
}

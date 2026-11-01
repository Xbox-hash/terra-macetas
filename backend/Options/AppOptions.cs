namespace TerraMacetas.Api.Options;

/// <summary>
/// Configuración de los tokens JWT del panel de administración (sección "Jwt").
/// La clave se toma de la variable de entorno Jwt__Key; nunca se escribe en el código.
/// </summary>
public class JwtOptions
{
    public const string Section = "Jwt";

    public string? Key { get; set; }
    public string Issuer { get; set; } = "TerraMacetas.Api";
    public string Audience { get; set; } = "TerraMacetas.Admin";
    public int ExpiresHours { get; set; } = 8;
}

/// <summary>
/// Configuración del gateway de WhatsApp (Evolution API), sección "WhatsAppGateway".
/// Los valores guardados en CompanyConfig (panel admin) tienen prioridad sobre estos.
/// </summary>
public class WhatsAppOptions
{
    public const string Section = "WhatsAppGateway";

    public bool Enabled { get; set; } = true;
    public string BaseUrl { get; set; } = "http://localhost:8080";
    public string? ApiKey { get; set; }
    public string InstanceName { get; set; } = "terra_bot";

    // Token secreto que Evolution manda en la URL del webhook (?token=...).
    // Se toma de WhatsAppGateway__WebhookToken. Si está vacío, el webhook rechaza todo.
    public string? WebhookToken { get; set; }
    public int ResendIntervalMinutes { get; set; } = 2;
}

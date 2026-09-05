namespace TerraMacetas.Api.DTOs;

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public string? AvatarUrl { get; set; }
    public string[] Permissions { get; set; } = Array.Empty<string>();
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAdminUserDto
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public string? AvatarUrl { get; set; }
    public string[]? Permissions { get; set; }
    public bool Active { get; set; } = true;
}

public class UpdateAdminUserDto
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? NewPassword { get; set; }
    public string Role { get; set; } = "Admin";
    public string? AvatarUrl { get; set; }
    public string[]? Permissions { get; set; }
    public bool Active { get; set; }
}

using System.ComponentModel.DataAnnotations;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.DTOs;

public class LoginDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

// Only reachable by an already-authenticated staff member (see AuthController.Register).
public class RegisterStaffDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class StaffAccountDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public static StaffAccountDto FromEntity(ITStaff s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        Email = s.Email ?? string.Empty
    };
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TroubleshootRequestSystem.Api.Config;
using TroubleshootRequestSystem.Api.DTOs;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(UserManager<ITStaff> userManager, IOptions<JwtOptions> jwtOptions) : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("Login")]
    public async Task<ActionResult<object>> Login(LoginDto dto)
    {
        var staff = await userManager.FindByEmailAsync(dto.Email);
        if (staff is null || !await userManager.CheckPasswordAsync(staff, dto.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = BuildToken(staff);
        return Ok(new
        {
            token,
            staff = new { staff.Id, staff.Name, staff.Email }
        });
    }

    // Only an already-authenticated staff member can provision another staff
    // account. There is no public signup: the first account is created by
    // the startup seeder (see Program.cs) from configuration.
    [HttpPost("register")]
    [Authorize]
    public async Task<ActionResult<StaffAccountDto>> Register(RegisterStaffDto dto)
    {
        var staff = new ITStaff
        {
            UserName = dto.Email,
            Email = dto.Email,
            Name = dto.Name
        };

        var result = await userManager.CreateAsync(staff, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok(StaffAccountDto.FromEntity(staff));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<StaffAccountDto>> Me()
    {
        var id = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var staff = await userManager.FindByIdAsync(id ?? string.Empty);
        if (staff is null)
        {
            return Unauthorized();
        }

        return Ok(StaffAccountDto.FromEntity(staff));
    }

    [HttpGet("staff")]
    [Authorize]
    public ActionResult<List<StaffAccountDto>> ListStaff()
    {
        var staff = userManager.Users
            .OrderBy(s => s.Name)
            .ToList()
            .Select(StaffAccountDto.FromEntity)
            .ToList();

        return Ok(staff);
    }

    private string BuildToken(ITStaff staff)
    {
        var options = jwtOptions.Value;
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, staff.Id),
            new Claim(JwtRegisteredClaimNames.Email, staff.Email ?? string.Empty),
            new Claim("name", staff.Name)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: options.Issuer,
            audience: options.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(options.ExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

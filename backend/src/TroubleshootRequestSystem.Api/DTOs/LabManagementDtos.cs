using System.ComponentModel.DataAnnotations;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.DTOs;

public class CreateLabDto
{
    [Required, MaxLength(200)]
    public string LabName { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Location { get; set; } = string.Empty;
}

public class CreateSeatDto
{
    [Required]
    public int LabId { get; set; }

    [Required, MaxLength(50)]
    public string SeatNumber { get; set; } = string.Empty;
}

public class CreateComputerUnitDto
{
    [Required, MaxLength(100)]
    public string AssetTag { get; set; } = string.Empty;
}

public class UpdateComputerUnitStatusDto
{
    [Required]
    public ComputerUnitStatus Status { get; set; }
}

public class AssignUnitDto
{
    // Null unassigns the unit (returns it to inventory).
    public int? SeatId { get; set; }
}

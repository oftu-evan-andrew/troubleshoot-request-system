using System.ComponentModel.DataAnnotations;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.DTOs;

public class SubmitRequestDto
{
    [Required, MaxLength(200)]
    public string ReporterName { get; set; } = string.Empty;

    [Required]
    public ReporterRole ReporterRole { get; set; }

    [Required, MaxLength(50)]
    public string ReporterId { get; set; } = string.Empty;

    [Required]
    public int SeatId { get; set; }

    [Required, MaxLength(2000)]
    public string IssueDescription { get; set; } = string.Empty;

    public RequestPriority Priority { get; set; } = RequestPriority.Normal;
}

public class RequestDto
{
    public int Id { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public ReporterRole ReporterRole { get; set; }
    public string ReporterId { get; set; } = string.Empty;
    public int SeatId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public string LabName { get; set; } = string.Empty;
    public int? UnitId { get; set; }
    public string? UnitAssetTag { get; set; }
    public string IssueDescription { get; set; } = string.Empty;
    public RequestPriority Priority { get; set; }
    public RequestStatus Status { get; set; }
    public DateTimeOffset TimeSubmitted { get; set; }
    public DateTimeOffset? TimeResolved { get; set; }
    public string? ResolvedById { get; set; }
    public string? ResolvedByName { get; set; }

    public static RequestDto FromEntity(TroubleshootRequest r) => new()
    {
        Id = r.Id,
        ReporterName = r.ReporterName,
        ReporterRole = r.ReporterRole,
        ReporterId = r.ReporterId,
        SeatId = r.SeatId,
        SeatNumber = r.Seat?.SeatNumber ?? string.Empty,
        LabName = r.Seat?.Lab?.LabName ?? string.Empty,
        UnitId = r.UnitId,
        UnitAssetTag = r.Unit?.AssetTag,
        IssueDescription = r.IssueDescription,
        Priority = r.Priority,
        Status = r.Status,
        TimeSubmitted = r.TimeSubmitted,
        TimeResolved = r.TimeResolved,
        ResolvedById = r.ResolvedById,
        ResolvedByName = r.ResolvedBy?.Name
    };
}

public class ResolveRequestDto
{
    public bool IssueFixed { get; set; } = true;
}

public class LabDto
{
    public int Id { get; set; }
    public string LabName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public List<SeatDto> Seats { get; set; } = [];
}

public class SeatDto
{
    public int Id { get; set; }
    public int LabId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public ComputerUnitDto? CurrentUnit { get; set; }
}

public class ComputerUnitDto
{
    public int Id { get; set; }
    public string AssetTag { get; set; } = string.Empty;
    public ComputerUnitStatus Status { get; set; }
    public int? CurrentSeatId { get; set; }
    public string? CurrentSeatLabel { get; set; }
}

namespace TroubleshootRequestSystem.Api.Models;

public enum RequestStatus
{
    Pending,
    InProgress,
    Resolved,
    Cancelled
}

public enum RequestPriority
{
    Low,
    Normal,
    High,
    Exam
}

public enum ComputerUnitStatus
{
    Operational,
    UnderMaintenance,
    OutOfService
}

public enum ReporterRole
{
    Student,
    Faculty,
    Staff
}

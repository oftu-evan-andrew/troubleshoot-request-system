namespace TroubleshootRequestSystem.Api.Models;

// Core ticket entity. Reporters are anonymous, so their identity is captured
// as plain fields directly on the request rather than a foreign key to an account.
public class TroubleshootRequest
{
    public int Id { get; set; }

    public string ReporterName { get; set; } = string.Empty;
    public ReporterRole ReporterRole { get; set; }
    public string ReporterId { get; set; } = string.Empty;

    public int SeatId { get; set; }
    public Seat? Seat { get; set; }

    // The unit occupying the seat when the request was submitted; null if
    // none was assigned at the time. Kept even if the unit later moves.
    public int? UnitId { get; set; }
    public ComputerUnit? Unit { get; set; }

    public string IssueDescription { get; set; } = string.Empty;
    public RequestPriority Priority { get; set; } = RequestPriority.Normal;
    public RequestStatus Status { get; set; } = RequestStatus.Pending;

    public DateTimeOffset TimeSubmitted { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? TimeResolved { get; set; }

    // Logged automatically when a request is marked resolved, not assigned
    // upfront. Kept for documentation purposes only.
    public string? ResolvedById { get; set; }
    public ITStaff? ResolvedBy { get; set; }

    private static readonly Dictionary<RequestStatus, RequestStatus[]> AllowedTransitions = new()
    {
        [RequestStatus.Pending] = [RequestStatus.InProgress, RequestStatus.Cancelled],
        [RequestStatus.InProgress] = [RequestStatus.Resolved, RequestStatus.Pending, RequestStatus.Cancelled],
        [RequestStatus.Resolved] = [],
        [RequestStatus.Cancelled] = []
    };

    public bool CanTransitionTo(RequestStatus next) =>
        AllowedTransitions.TryGetValue(Status, out var allowed) && allowed.Contains(next);

    public void TransitionTo(RequestStatus next)
    {
        if (!CanTransitionTo(next))
        {
            throw new InvalidOperationException($"Cannot transition request {Id} from {Status} to {next}.");
        }

        Status = next;
    }
}

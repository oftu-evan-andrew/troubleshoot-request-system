namespace TroubleshootRequestSystem.Api.Models;

// A fixed physical position in a lab. This is what a reporter selects
// (they see the seat, not the hardware) and what request history is
// grouped by for location-based patterns. The actual machine sitting at a
// seat is a ComputerUnit, tracked separately since it can be swapped out
// (e.g. pulled for maintenance and replaced with a spare).
public class Seat
{
    public int Id { get; set; }
    public int LabId { get; set; }
    public Lab? Lab { get; set; }

    public string SeatNumber { get; set; } = string.Empty;

    public ComputerUnit? CurrentUnit { get; set; }
    public ICollection<TroubleshootRequest> Requests { get; set; } = new List<TroubleshootRequest>();
}

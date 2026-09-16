namespace TroubleshootRequestSystem.Api.Models;

// A specific physical machine, identified by a staff-entered asset tag
// (its serial/inventory sticker) rather than by location. Units are
// assigned to a Seat and can be reassigned independently of it — a unit
// pulled for maintenance frees its seat for a spare unit to take over.
public class ComputerUnit
{
    public int Id { get; set; }
    public string AssetTag { get; set; } = string.Empty;
    public ComputerUnitStatus Status { get; set; } = ComputerUnitStatus.Operational;

    // Null while the unit sits unassigned in inventory (e.g. a spare, or
    // just pulled from a seat for maintenance).
    public int? CurrentSeatId { get; set; }
    public Seat? CurrentSeat { get; set; }

    public ICollection<TroubleshootRequest> Requests { get; set; } = new List<TroubleshootRequest>();
}

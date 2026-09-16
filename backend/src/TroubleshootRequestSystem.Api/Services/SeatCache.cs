using System.Collections.Concurrent;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.Services;

// In-memory hash map giving O(1) lookup of a Seat by its ID, so validating
// a submission's seatId doesn't require a DB round trip.
public class SeatCache
{
    private readonly ConcurrentDictionary<int, Seat> _seats = new();

    public void Load(IEnumerable<Seat> seats)
    {
        _seats.Clear();
        foreach (var seat in seats)
        {
            _seats[seat.Id] = seat;
        }
    }

    public bool TryGet(int seatId, out Seat? seat) => _seats.TryGetValue(seatId, out seat);

    public void Upsert(Seat seat) => _seats[seat.Id] = seat;

    public void Remove(int seatId) => _seats.TryRemove(seatId, out _);
}

using System.Collections.Concurrent;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.Services;

// In-memory hash map giving O(1) lookup of a ComputerUnit by its unit ID,
// so validating a submission's unitId doesn't require a DB round trip.
// Populated at startup and kept in sync by whoever mutates a unit's status.
public class ComputerUnitCache
{
    private readonly ConcurrentDictionary<int, ComputerUnit> _units = new();

    public void Load(IEnumerable<ComputerUnit> units)
    {
        _units.Clear();
        foreach (var unit in units)
        {
            _units[unit.Id] = unit;
        }
    }

    public bool TryGet(int unitId, out ComputerUnit? unit) => _units.TryGetValue(unitId, out unit);

    public void Upsert(ComputerUnit unit) => _units[unit.Id] = unit;

    public void Remove(int unitId) => _units.TryRemove(unitId, out _);

    public IReadOnlyCollection<ComputerUnit> All => _units.Values.ToList();
}

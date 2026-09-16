using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.Services;

// Pending requests are held in one FIFO bucket per priority level, and the
// highest-urgency non-empty bucket is served first (Exam > High > Normal > Low).
// A hash map keyed by request ID gives O(1) lookup/removal for the dashboard
// instead of scanning the buckets.
public class PriorityRequestQueue : IRequestQueue
{
    private static readonly RequestPriority[] PriorityOrder =
    [
        RequestPriority.Exam,
        RequestPriority.High,
        RequestPriority.Normal,
        RequestPriority.Low
    ];

    private readonly Dictionary<RequestPriority, LinkedList<int>> _buckets =
        PriorityOrder.ToDictionary(p => p, _ => new LinkedList<int>());

    private readonly Dictionary<int, TroubleshootRequest> _byId = new();
    private readonly Dictionary<int, LinkedListNode<int>> _nodesById = new();
    private readonly object _lock = new();

    public int Count
    {
        get { lock (_lock) return _byId.Count; }
    }

    public void Enqueue(TroubleshootRequest request)
    {
        lock (_lock)
        {
            if (_byId.ContainsKey(request.Id))
            {
                return;
            }

            var node = _buckets[request.Priority].AddLast(request.Id);
            _byId[request.Id] = request;
            _nodesById[request.Id] = node;
        }
    }

    public TroubleshootRequest? DequeueNext()
    {
        lock (_lock)
        {
            foreach (var priority in PriorityOrder)
            {
                var bucket = _buckets[priority];
                if (bucket.Count == 0)
                {
                    continue;
                }

                var id = bucket.First!.Value;
                bucket.RemoveFirst();
                _nodesById.Remove(id);
                _byId.Remove(id, out var request);
                return request;
            }

            return null;
        }
    }

    public bool TryGetById(int requestId, out TroubleshootRequest? request)
    {
        lock (_lock)
        {
            return _byId.TryGetValue(requestId, out request);
        }
    }

    public bool Remove(int requestId)
    {
        lock (_lock)
        {
            if (!_byId.TryGetValue(requestId, out var request))
            {
                return false;
            }

            if (_nodesById.TryGetValue(requestId, out var node))
            {
                _buckets[request.Priority].Remove(node);
                _nodesById.Remove(requestId);
            }

            _byId.Remove(requestId);
            return true;
        }
    }

    public IReadOnlyCollection<TroubleshootRequest> PendingSnapshot()
    {
        lock (_lock)
        {
            var result = new List<TroubleshootRequest>(_byId.Count);
            foreach (var priority in PriorityOrder)
            {
                foreach (var id in _buckets[priority])
                {
                    result.Add(_byId[id]);
                }
            }

            return result;
        }
    }
}

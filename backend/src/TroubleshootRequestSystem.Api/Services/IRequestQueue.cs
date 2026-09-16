using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.Services;

// Abstraction over the pending-request queuing strategy so the underlying
// data structure (priority queue today) can be swapped without touching
// callers such as RequestQueueService.
public interface IRequestQueue
{
    int Count { get; }
    void Enqueue(TroubleshootRequest request);
    TroubleshootRequest? DequeueNext();
    bool TryGetById(int requestId, out TroubleshootRequest? request);
    bool Remove(int requestId);
    IReadOnlyCollection<TroubleshootRequest> PendingSnapshot();
}

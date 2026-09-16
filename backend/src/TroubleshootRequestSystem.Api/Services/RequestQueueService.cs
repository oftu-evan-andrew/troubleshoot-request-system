using Microsoft.EntityFrameworkCore;
using TroubleshootRequestSystem.Api.Data;
using TroubleshootRequestSystem.Api.DTOs;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.Services;

public class RequestNotFoundException(int requestId) : Exception($"Request {requestId} was not found.");

public class InvalidSeatException(int seatId) : Exception($"Seat {seatId} was not found.");

// Coordinates the in-memory priority queue with PostgreSQL persistence.
// Registered as a singleton (it owns queue state across requests) but takes
// scoped EF dependencies via IServiceScopeFactory, per the standard DI pattern
// for singletons that need scoped services.
public class RequestQueueService(
    IRequestQueue queue,
    SeatCache seatCache,
    ComputerUnitCache unitCache,
    IServiceScopeFactory scopeFactory)
{
    public async Task InitializeAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var seats = await db.Seats.AsNoTracking().ToListAsync();
        seatCache.Load(seats);

        var units = await db.ComputerUnits.AsNoTracking().ToListAsync();
        unitCache.Load(units);

        var pending = await db.Requests
            .Where(r => r.Status == RequestStatus.Pending)
            .OrderBy(r => r.TimeSubmitted)
            .ToListAsync();

        foreach (var request in pending)
        {
            queue.Enqueue(request);
        }
    }

    public async Task<TroubleshootRequest> SubmitAsync(SubmitRequestDto dto)
    {
        if (!seatCache.TryGet(dto.SeatId, out _))
        {
            throw new InvalidSeatException(dto.SeatId);
        }

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Resolve whichever unit currently occupies the seat, if any — the
        // reporter only ever picks a seat, never a unit directly.
        var currentUnit = await db.ComputerUnits.FirstOrDefaultAsync(u => u.CurrentSeatId == dto.SeatId);

        var request = new TroubleshootRequest
        {
            ReporterName = dto.ReporterName,
            ReporterRole = dto.ReporterRole,
            ReporterId = dto.ReporterId,
            SeatId = dto.SeatId,
            UnitId = currentUnit?.Id,
            IssueDescription = dto.IssueDescription,
            Priority = dto.Priority,
            Status = RequestStatus.Pending,
            TimeSubmitted = DateTimeOffset.UtcNow
        };

        db.Requests.Add(request);
        await db.SaveChangesAsync();

        queue.Enqueue(request);
        return request;
    }

    // Highest-urgency pending request, moved to InProgress.
    public async Task<TroubleshootRequest?> ProcessNextAsync()
    {
        var request = queue.DequeueNext();
        if (request is null)
        {
            return null;
        }

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tracked = await db.Requests.FindAsync(request.Id) ?? throw new RequestNotFoundException(request.Id);
        tracked.TransitionTo(RequestStatus.InProgress);
        await db.SaveChangesAsync();

        return tracked;
    }

    public async Task<TroubleshootRequest> ResolveAsync(int requestId, string staffId)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var request = await db.Requests.FindAsync(requestId) ?? throw new RequestNotFoundException(requestId);
        request.TransitionTo(RequestStatus.Resolved);
        request.TimeResolved = DateTimeOffset.UtcNow;
        request.ResolvedById = staffId; // logged for documentation only, not an assignment
        await db.SaveChangesAsync();

        queue.Remove(requestId);
        return request;
    }

    // Issue wasn't fixed: back to Pending, re-queued at the top of the priority order.
    public async Task<TroubleshootRequest> EscalateAsync(int requestId)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var request = await db.Requests.FindAsync(requestId) ?? throw new RequestNotFoundException(requestId);
        request.TransitionTo(RequestStatus.Pending);
        request.Priority = RequestPriority.Exam;
        await db.SaveChangesAsync();

        queue.Enqueue(request);
        return request;
    }

    public async Task<TroubleshootRequest> CancelAsync(int requestId)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var request = await db.Requests.FindAsync(requestId) ?? throw new RequestNotFoundException(requestId);
        request.TransitionTo(RequestStatus.Cancelled);
        await db.SaveChangesAsync();

        queue.Remove(requestId);
        return request;
    }

    public IReadOnlyCollection<TroubleshootRequest> PendingQueueSnapshot() => queue.PendingSnapshot();
}

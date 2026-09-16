using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TroubleshootRequestSystem.Api.Data;
using TroubleshootRequestSystem.Api.DTOs;
using TroubleshootRequestSystem.Api.Models;
using TroubleshootRequestSystem.Api.Services;

namespace TroubleshootRequestSystem.Api.Controllers;

[ApiController]
[Route("api/requests")]
public class RequestsController(AppDbContext db, RequestQueueService queueService) : ControllerBase
{
    // Anonymous: any lab user can submit a request with no account. Rate
    // limited per IP since there's no auth to throttle abuse with otherwise.
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("SubmitRequest")]
    public async Task<ActionResult<RequestDto>> Submit(SubmitRequestDto dto)
    {
        try
        {
            var request = await queueService.SubmitAsync(dto);
            var withNav = await db.Requests
                .Include(r => r.Seat).ThenInclude(s => s!.Lab)
                .Include(r => r.Unit)
                .FirstAsync(r => r.Id == request.Id);

            return CreatedAtAction(nameof(GetById), new { id = request.Id }, RequestDto.FromEntity(withNav));
        }
        catch (InvalidSeatException)
        {
            return BadRequest(new { message = "Invalid request details: unknown seat." });
        }
    }

    // Reference-number lookup for a reporter who has no account to check status with.
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<RequestDto>> GetById(int id)
    {
        var request = await db.Requests
            .Include(r => r.Seat).ThenInclude(s => s!.Lab)
            .Include(r => r.Unit)
            .Include(r => r.ResolvedBy)
            .FirstOrDefaultAsync(r => r.Id == id);

        return request is null ? NotFound() : Ok(RequestDto.FromEntity(request));
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<RequestDto>>> List([FromQuery] RequestStatus? status)
    {
        var query = db.Requests
            .Include(r => r.Seat).ThenInclude(s => s!.Lab)
            .Include(r => r.Unit)
            .Include(r => r.ResolvedBy)
            .AsQueryable();

        if (status is not null)
        {
            query = query.Where(r => r.Status == status);
        }

        var results = await query.OrderByDescending(r => r.TimeSubmitted).ToListAsync();
        return results.Select(RequestDto.FromEntity).ToList();
    }

    // Live, prioritized view of what's still waiting to be worked on.
    [HttpGet("queue")]
    [Authorize]
    public ActionResult<List<RequestDto>> Queue()
    {
        var snapshot = queueService.PendingQueueSnapshot();
        return snapshot.Select(RequestDto.FromEntity).ToList();
    }

    [HttpPost("process-next")]
    [Authorize]
    public async Task<ActionResult<RequestDto>> ProcessNext()
    {
        var request = await queueService.ProcessNextAsync();
        if (request is null)
        {
            return Ok(new { message = "No pending requests" });
        }

        var withNav = await db.Requests
            .Include(r => r.Seat).ThenInclude(s => s!.Lab)
            .Include(r => r.Unit)
            .FirstAsync(r => r.Id == request.Id);

        return Ok(RequestDto.FromEntity(withNav));
    }

    [HttpPost("{id:int}/resolve")]
    [Authorize]
    public async Task<ActionResult<RequestDto>> Resolve(int id)
    {
        var staffId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (staffId is null)
        {
            return Unauthorized();
        }

        try
        {
            var request = await queueService.ResolveAsync(id, staffId);
            var withNav = await db.Requests
                .Include(r => r.Seat).ThenInclude(s => s!.Lab)
                .Include(r => r.Unit)
                .Include(r => r.ResolvedBy)
                .FirstAsync(r => r.Id == request.Id);

            return Ok(RequestDto.FromEntity(withNav));
        }
        catch (RequestNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    // Issue wasn't fixed on this pass: reopen and escalate.
    [HttpPost("{id:int}/escalate")]
    [Authorize]
    public async Task<ActionResult<RequestDto>> Escalate(int id)
    {
        try
        {
            var request = await queueService.EscalateAsync(id);
            var withNav = await db.Requests
                .Include(r => r.Seat).ThenInclude(s => s!.Lab)
                .Include(r => r.Unit)
                .FirstAsync(r => r.Id == request.Id);

            return Ok(RequestDto.FromEntity(withNav));
        }
        catch (RequestNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/cancel")]
    [Authorize]
    public async Task<ActionResult<RequestDto>> Cancel(int id)
    {
        try
        {
            var request = await queueService.CancelAsync(id);
            var withNav = await db.Requests
                .Include(r => r.Seat).ThenInclude(s => s!.Lab)
                .Include(r => r.Unit)
                .FirstAsync(r => r.Id == request.Id);

            return Ok(RequestDto.FromEntity(withNav));
        }
        catch (RequestNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}

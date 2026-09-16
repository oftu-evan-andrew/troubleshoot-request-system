using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TroubleshootRequestSystem.Api.Data;
using TroubleshootRequestSystem.Api.DTOs;
using TroubleshootRequestSystem.Api.Models;
using TroubleshootRequestSystem.Api.Services;

namespace TroubleshootRequestSystem.Api.Controllers;

[ApiController]
[Route("api/labs")]
public class LabsController(AppDbContext db, SeatCache seatCache, ComputerUnitCache unitCache) : ControllerBase
{
    // Public: the reporter form needs this to populate lab/seat selection
    // without requiring an account.
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<LabDto>>> List()
    {
        var labs = await db.Labs
            .Include(l => l.Seats).ThenInclude(s => s.CurrentUnit)
            .OrderBy(l => l.LabName)
            .ToListAsync();

        return labs.Select(ToLabDto).ToList();
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<LabDto>> GetById(int id)
    {
        var lab = await db.Labs
            .Include(l => l.Seats).ThenInclude(s => s.CurrentUnit)
            .FirstOrDefaultAsync(l => l.Id == id);

        return lab is null ? NotFound() : Ok(ToLabDto(lab));
    }

    // Staff-only: every unit, with where (if anywhere) it's currently
    // seated. Backs both the units management list and the "assign to
    // seat" dropdown (unassigned units have CurrentSeatId == null).
    [HttpGet("units")]
    [Authorize]
    public async Task<ActionResult<List<ComputerUnitDto>>> ListUnits()
    {
        var units = await db.ComputerUnits
            .Include(u => u.CurrentSeat).ThenInclude(s => s!.Lab)
            .OrderBy(u => u.AssetTag)
            .ToListAsync();

        return units.Select(ToUnitDto).ToList();
    }

    // Staff-only: labs/seats/units are set up by IT, not reporters.
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<LabDto>> Create(CreateLabDto dto)
    {
        var lab = new Lab { LabName = dto.LabName, Location = dto.Location };
        db.Labs.Add(lab);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = lab.Id }, ToLabDto(lab));
    }

    [HttpPost("seats")]
    [Authorize]
    public async Task<ActionResult<SeatDto>> CreateSeat(CreateSeatDto dto)
    {
        var labExists = await db.Labs.AnyAsync(l => l.Id == dto.LabId);
        if (!labExists)
        {
            return BadRequest(new { message = "Invalid labId." });
        }

        var seat = new Seat { LabId = dto.LabId, SeatNumber = dto.SeatNumber };
        db.Seats.Add(seat);
        await db.SaveChangesAsync();

        seatCache.Upsert(seat);

        return Ok(ToSeatDto(seat));
    }

    // Registers a new physical machine into inventory, unassigned to any
    // seat until explicitly assigned.
    [HttpPost("units")]
    [Authorize]
    public async Task<ActionResult<ComputerUnitDto>> CreateUnit(CreateComputerUnitDto dto)
    {
        var unit = new ComputerUnit { AssetTag = dto.AssetTag };
        db.ComputerUnits.Add(unit);
        await db.SaveChangesAsync();

        unitCache.Upsert(unit);

        return Ok(ToUnitDto(unit));
    }

    [HttpPut("units/{id:int}/status")]
    [Authorize]
    public async Task<ActionResult<ComputerUnitDto>> UpdateUnitStatus(int id, UpdateComputerUnitStatusDto dto)
    {
        var unit = await db.ComputerUnits
            .Include(u => u.CurrentSeat).ThenInclude(s => s!.Lab)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (unit is null)
        {
            return NotFound();
        }

        unit.Status = dto.Status;
        await db.SaveChangesAsync();

        unitCache.Upsert(unit);

        return Ok(ToUnitDto(unit));
    }

    // Assigns (or, with a null seatId, unassigns) a unit. Assigning to an
    // occupied seat bumps whichever unit was there back to unassigned —
    // done as two separate saves so the seat's unique-per-unit constraint
    // is never briefly violated by both rows racing for the same seat.
    [HttpPut("units/{id:int}/assign")]
    [Authorize]
    public async Task<ActionResult<ComputerUnitDto>> AssignUnit(int id, AssignUnitDto dto)
    {
        var unit = await db.ComputerUnits.FindAsync(id);
        if (unit is null)
        {
            return NotFound();
        }

        if (dto.SeatId is int seatId)
        {
            var seatExists = await db.Seats.AnyAsync(s => s.Id == seatId);
            if (!seatExists)
            {
                return BadRequest(new { message = "Invalid seatId." });
            }

            var occupant = await db.ComputerUnits.FirstOrDefaultAsync(u => u.CurrentSeatId == seatId && u.Id != id);
            if (occupant is not null)
            {
                occupant.CurrentSeatId = null;
                await db.SaveChangesAsync();
                unitCache.Upsert(occupant);
            }
        }

        unit.CurrentSeatId = dto.SeatId;
        await db.SaveChangesAsync();

        await db.Entry(unit).Reference(u => u.CurrentSeat).LoadAsync();
        if (unit.CurrentSeat is not null)
        {
            await db.Entry(unit.CurrentSeat).Reference(s => s.Lab).LoadAsync();
        }

        unitCache.Upsert(unit);

        return Ok(ToUnitDto(unit));
    }

    // A unit with request history can't be deleted outright (requests hold a
    // Restrict FK to it, preserving history for maintenance-pattern
    // reporting). Retiring it via status is the supported path instead.
    [HttpDelete("units/{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteUnit(int id)
    {
        var unit = await db.ComputerUnits.FindAsync(id);
        if (unit is null)
        {
            return NotFound();
        }

        var hasRequests = await db.Requests.AnyAsync(r => r.UnitId == id);
        if (hasRequests)
        {
            return Conflict(new
            {
                message = "This unit has request history and can't be deleted. Mark it Out of Service instead."
            });
        }

        db.ComputerUnits.Remove(unit);
        await db.SaveChangesAsync();

        unitCache.Remove(id);

        return NoContent();
    }

    // Same history rule as units. Deleting a seat frees whichever unit was
    // currently assigned to it (the DB relationship does this automatically)
    // rather than deleting that unit.
    [HttpDelete("seats/{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteSeat(int id)
    {
        var seat = await db.Seats.FindAsync(id);
        if (seat is null)
        {
            return NotFound();
        }

        var hasRequests = await db.Requests.AnyAsync(r => r.SeatId == id);
        if (hasRequests)
        {
            return Conflict(new
            {
                message = "This seat has request history and can't be deleted."
            });
        }

        var occupant = await db.ComputerUnits.FirstOrDefaultAsync(u => u.CurrentSeatId == id);

        db.Seats.Remove(seat);
        await db.SaveChangesAsync();

        seatCache.Remove(id);
        if (occupant is not null)
        {
            occupant.CurrentSeatId = null;
            unitCache.Upsert(occupant);
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteLab(int id)
    {
        var lab = await db.Labs.Include(l => l.Seats).FirstOrDefaultAsync(l => l.Id == id);
        if (lab is null)
        {
            return NotFound();
        }

        var seatIds = lab.Seats.Select(s => s.Id).ToList();
        var hasRequests = await db.Requests.AnyAsync(r => seatIds.Contains(r.SeatId));
        if (hasRequests)
        {
            return Conflict(new
            {
                message = "This lab has seats with request history and can't be deleted."
            });
        }

        var occupants = await db.ComputerUnits.Where(u => u.CurrentSeatId != null && seatIds.Contains(u.CurrentSeatId!.Value)).ToListAsync();

        db.Labs.Remove(lab);
        await db.SaveChangesAsync();

        foreach (var seatId in seatIds)
        {
            seatCache.Remove(seatId);
        }

        foreach (var occupant in occupants)
        {
            occupant.CurrentSeatId = null;
            unitCache.Upsert(occupant);
        }

        return NoContent();
    }

    private static LabDto ToLabDto(Lab l) => new()
    {
        Id = l.Id,
        LabName = l.LabName,
        Location = l.Location,
        Seats = l.Seats
            .OrderBy(s => s.SeatNumber)
            .Select(ToSeatDto)
            .ToList()
    };

    private static SeatDto ToSeatDto(Seat s) => new()
    {
        Id = s.Id,
        LabId = s.LabId,
        SeatNumber = s.SeatNumber,
        CurrentUnit = s.CurrentUnit is null ? null : ToUnitDto(s.CurrentUnit)
    };

    private static ComputerUnitDto ToUnitDto(ComputerUnit u) => new()
    {
        Id = u.Id,
        AssetTag = u.AssetTag,
        Status = u.Status,
        CurrentSeatId = u.CurrentSeatId,
        CurrentSeatLabel = u.CurrentSeat is null ? null : $"{u.CurrentSeat.Lab?.LabName} · {u.CurrentSeat.SeatNumber}"
    };
}

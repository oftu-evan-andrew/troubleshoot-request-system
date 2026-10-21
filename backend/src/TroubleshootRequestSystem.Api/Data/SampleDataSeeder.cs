using Microsoft.EntityFrameworkCore;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.Data;

// Fills a database with realistic labs, seats, and computer units so the app
// can be tried out without setting a lab up by hand. Opt-in only (see
// Program.cs), so production data and labs staff have deleted are never
// recreated behind anyone's back.
//
// Each sample lab is skipped if a lab with its name, or any of its asset
// tags, already exists, so running it again is a no-op and it never touches
// labs staff created themselves.
public static class SampleDataSeeder
{
    private record SampleLab(string Name, string Location, string Code, int SeatCount);

    private static readonly SampleLab[] SampleLabs =
    [
        new("Computer Laboratory 2", "Main Building, 2nd Floor", "CL2", 30),
        new("Computer Laboratory 3", "Main Building, 3rd Floor", "CL3", 24),
        new("Multimedia Laboratory", "Library, Ground Floor", "MML", 12),
    ];

    private const int SparesPerLab = 2;

    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        var labNames = (await db.Labs.Select(l => l.LabName).ToListAsync()).ToHashSet();
        var assetTags = (await db.ComputerUnits.Select(u => u.AssetTag).ToListAsync()).ToHashSet();

        foreach (var sample in SampleLabs)
        {
            var lab = new Lab { LabName = sample.Name, Location = sample.Location };
            var units = BuildUnits(sample, lab);

            if (labNames.Contains(sample.Name) || units.Any(u => assetTags.Contains(u.AssetTag)))
            {
                logger.LogInformation("Sample lab {Lab} already exists; skipping.", sample.Name);
                continue;
            }

            db.Labs.Add(lab);
            db.ComputerUnits.AddRange(units);
            await db.SaveChangesAsync();

            logger.LogInformation(
                "Seeded sample lab {Lab} with {Seats} seats and {Units} units.",
                sample.Name, lab.Seats.Count, units.Count);
        }
    }

    // One unit per seat, with a few realistic exceptions: every 12th seat is
    // empty because its unit was pulled for maintenance, every 9th seat's unit
    // is out of service but still in place, and each lab keeps spares on hand.
    private static List<ComputerUnit> BuildUnits(SampleLab sample, Lab lab)
    {
        var units = new List<ComputerUnit>();

        for (var i = 1; i <= sample.SeatCount; i++)
        {
            var seat = new Seat { Lab = lab, SeatNumber = $"PC-{i:00}" };
            lab.Seats.Add(seat);

            var unit = new ComputerUnit { AssetTag = $"{sample.Code}-{i:000}" };
            if (i % 12 == 0)
            {
                unit.Status = ComputerUnitStatus.UnderMaintenance;
            }
            else
            {
                unit.CurrentSeat = seat;
                if (i % 9 == 0)
                {
                    unit.Status = ComputerUnitStatus.OutOfService;
                }
            }
            units.Add(unit);
        }

        for (var i = 1; i <= SparesPerLab; i++)
        {
            units.Add(new ComputerUnit { AssetTag = $"{sample.Code}-SP{i:00}" });
        }

        return units;
    }
}

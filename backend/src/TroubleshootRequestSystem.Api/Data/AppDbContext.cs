using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TroubleshootRequestSystem.Api.Models;

namespace TroubleshootRequestSystem.Api.Data;

public class AppDbContext : IdentityDbContext<ITStaff>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Lab> Labs => Set<Lab>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<ComputerUnit> ComputerUnits => Set<ComputerUnit>();
    public DbSet<TroubleshootRequest> Requests => Set<TroubleshootRequest>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ITStaff>(entity => entity.ToTable("it_staff"));

        builder.Entity<Lab>(entity =>
        {
            entity.ToTable("labs");
            entity.HasMany(l => l.Seats)
                .WithOne(s => s.Lab)
                .HasForeignKey(s => s.LabId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Seat>(entity =>
        {
            entity.ToTable("seats");
            entity.HasIndex(s => new { s.LabId, s.SeatNumber }).IsUnique();
        });

        builder.Entity<ComputerUnit>(entity =>
        {
            entity.ToTable("computer_units");
            entity.Property(u => u.Status).HasConversion<string>();
            entity.HasIndex(u => u.AssetTag).IsUnique();

            // A unit's current seat is freed (set null) if that seat is
            // deleted, rather than blocking the delete.
            entity.HasOne(u => u.CurrentSeat)
                .WithOne(s => s.CurrentUnit)
                .HasForeignKey<ComputerUnit>(u => u.CurrentSeatId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<TroubleshootRequest>(entity =>
        {
            entity.ToTable("requests");
            entity.Property(r => r.ReporterRole).HasConversion<string>();
            entity.Property(r => r.Priority).HasConversion<string>();
            entity.Property(r => r.Status).HasConversion<string>();

            entity.HasOne(r => r.Seat)
                .WithMany(s => s.Requests)
                .HasForeignKey(r => r.SeatId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Unit)
                .WithMany(u => u.Requests)
                .HasForeignKey(r => r.UnitId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.ResolvedBy)
                .WithMany()
                .HasForeignKey(r => r.ResolvedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(r => r.Status);
        });
    }
}

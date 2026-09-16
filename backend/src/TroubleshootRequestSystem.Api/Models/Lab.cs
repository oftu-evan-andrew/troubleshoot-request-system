namespace TroubleshootRequestSystem.Api.Models;

public class Lab
{
    public int Id { get; set; }
    public string LabName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;

    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
}

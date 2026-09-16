using Microsoft.AspNetCore.Identity;

namespace TroubleshootRequestSystem.Api.Models;

// The only authenticated entity in the system. A single undifferentiated
// role covers both day-to-day troubleshooting and reporting/oversight,
// since both draw on the same request data and require the same access.
public class ITStaff : IdentityUser
{
    public string Name { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;
}

using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TroubleshootRequestSystem.Api.Config;
using TroubleshootRequestSystem.Api.Data;
using TroubleshootRequestSystem.Api.Models;
using TroubleshootRequestSystem.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddIdentityCore<ITStaff>(options =>
    {
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration section is missing.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep claim types as issued ("sub", not the remapped long-form URI)
        // so JwtRegisteredClaimNames.Sub lookups against User work as written.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key))
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

// Anonymous request submission has no auth to throttle abuse with, so it's
// rate-limited per client IP instead, to keep the queue from being spammed.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("SubmitRequest", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(1),
                PermitLimit = 5,
                QueueLimit = 0
            }));

    // Guards against brute-forcing a staff password: same shape as the
    // submit limiter, just applied to the login endpoint instead.
    options.AddPolicy("Login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(1),
                PermitLimit = 5,
                QueueLimit = 0
            }));

    options.OnRejected = async (context, token) =>
    {
        var policyName = context.HttpContext.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName;
        var message = policyName == "Login"
            ? "Too many login attempts. Please wait a moment and try again."
            : "Too many requests submitted. Please wait a moment and try again.";

        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync($$"""{"message":"{{message}}"}""", token);
    };
});

// The priority queue and its unit cache are process-wide state, so they're
// singletons; RequestQueueService is a singleton too and reaches EF Core
// (a scoped service) through IServiceScopeFactory internally.
builder.Services.AddSingleton<IRequestQueue, PriorityRequestQueue>();
builder.Services.AddSingleton<SeatCache>();
builder.Services.AddSingleton<ComputerUnitCache>();
builder.Services.AddSingleton<RequestQueueService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    await SeedInitialStaffAsync(scope.ServiceProvider, app.Configuration, app.Logger);

    var queueService = scope.ServiceProvider.GetRequiredService<RequestQueueService>();
    await queueService.InitializeAsync();
}

app.Run();

// Creates the first IT Staff account from configuration if no accounts
// exist yet, since there is no public registration endpoint to bootstrap one.
static async Task SeedInitialStaffAsync(IServiceProvider services, IConfiguration configuration, ILogger logger)
{
    var userManager = services.GetRequiredService<UserManager<ITStaff>>();
    if (userManager.Users.Any())
    {
        return;
    }

    var email = configuration["InitialStaff:Email"];
    var password = configuration["InitialStaff:Password"];
    var name = configuration["InitialStaff:Name"];

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
    {
        logger.LogWarning(
            "No IT Staff accounts exist and InitialStaff:Email/Password are not configured. " +
            "Set them (e.g. via user secrets or environment variables) to seed the first account.");
        return;
    }

    var staff = new ITStaff
    {
        UserName = email,
        Email = email,
        Name = string.IsNullOrWhiteSpace(name) ? email : name
    };

    var result = await userManager.CreateAsync(staff, password);
    if (!result.Succeeded)
    {
        logger.LogError(
            "Failed to seed initial IT Staff account: {Errors}",
            string.Join("; ", result.Errors.Select(e => e.Description)));
    }
}

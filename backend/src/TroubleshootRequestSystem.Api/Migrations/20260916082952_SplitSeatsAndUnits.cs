using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TroubleshootRequestSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class SplitSeatsAndUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_computer_units_labs_LabId",
                table: "computer_units");

            migrationBuilder.DropIndex(
                name: "IX_computer_units_LabId_SeatNumber",
                table: "computer_units");

            migrationBuilder.DropColumn(
                name: "LabId",
                table: "computer_units");

            migrationBuilder.RenameColumn(
                name: "SeatNumber",
                table: "computer_units",
                newName: "AssetTag");

            migrationBuilder.AlterColumn<int>(
                name: "UnitId",
                table: "requests",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "SeatId",
                table: "requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CurrentSeatId",
                table: "computer_units",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "seats",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LabId = table.Column<int>(type: "integer", nullable: false),
                    SeatNumber = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_seats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_seats_labs_LabId",
                        column: x => x.LabId,
                        principalTable: "labs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_requests_SeatId",
                table: "requests",
                column: "SeatId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_units_AssetTag",
                table: "computer_units",
                column: "AssetTag",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_computer_units_CurrentSeatId",
                table: "computer_units",
                column: "CurrentSeatId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_seats_LabId_SeatNumber",
                table: "seats",
                columns: new[] { "LabId", "SeatNumber" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_computer_units_seats_CurrentSeatId",
                table: "computer_units",
                column: "CurrentSeatId",
                principalTable: "seats",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_requests_seats_SeatId",
                table: "requests",
                column: "SeatId",
                principalTable: "seats",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_computer_units_seats_CurrentSeatId",
                table: "computer_units");

            migrationBuilder.DropForeignKey(
                name: "FK_requests_seats_SeatId",
                table: "requests");

            migrationBuilder.DropTable(
                name: "seats");

            migrationBuilder.DropIndex(
                name: "IX_requests_SeatId",
                table: "requests");

            migrationBuilder.DropIndex(
                name: "IX_computer_units_AssetTag",
                table: "computer_units");

            migrationBuilder.DropIndex(
                name: "IX_computer_units_CurrentSeatId",
                table: "computer_units");

            migrationBuilder.DropColumn(
                name: "SeatId",
                table: "requests");

            migrationBuilder.DropColumn(
                name: "CurrentSeatId",
                table: "computer_units");

            migrationBuilder.RenameColumn(
                name: "AssetTag",
                table: "computer_units",
                newName: "SeatNumber");

            migrationBuilder.AlterColumn<int>(
                name: "UnitId",
                table: "requests",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LabId",
                table: "computer_units",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_computer_units_LabId_SeatNumber",
                table: "computer_units",
                columns: new[] { "LabId", "SeatNumber" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_computer_units_labs_LabId",
                table: "computer_units",
                column: "LabId",
                principalTable: "labs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerySimpleFileHost.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    FullName = table.Column<string>(type: "TEXT", nullable: false),
                    LoginName = table.Column<string>(type: "TEXT", nullable: true),
                    PasswordSaltedHash = table.Column<string>(type: "TEXT", nullable: true),
                    InviteKey = table.Column<string>(type: "TEXT", nullable: true),
                    IsAdministrator = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastPasswordChangeUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RejectCookiesOlderThanUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_LoginName",
                table: "Users",
                column: "LoginName",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}

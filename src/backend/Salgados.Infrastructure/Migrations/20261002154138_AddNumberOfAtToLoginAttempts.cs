using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Salgados.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNumberOfAtToLoginAttempts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NumberOfAt",
                table: "LoginAttempts",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumberOfAt",
                table: "LoginAttempts");
        }
    }
}

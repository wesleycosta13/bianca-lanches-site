using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Salgados.Infrastructure.Data;

#nullable disable

namespace Salgados.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261008174500_AddStoreHeroImageSetting")]
    public partial class AddStoreHeroImageSetting : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StoreSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    HeroImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreSettings", x => x.Id);
                });

            migrationBuilder.Sql(
                "INSERT INTO \"StoreSettings\" (\"Id\", \"HeroImageUrl\") " +
                "VALUES (1, 'https://i.pinimg.com/736x/7d/ac/8b/7dac8bdfec19eecf52b3e237165a753e.jpg');");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "StoreSettings");
        }
    }
}

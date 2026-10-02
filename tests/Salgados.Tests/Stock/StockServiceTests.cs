using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Salgados.Api.DTOs.Stock;
using Salgados.Api.Services;
using Salgados.Core.Entities;
using Salgados.Core.Enums;
using Salgados.Infrastructure.Data;

namespace Salgados.Tests.Stock;

public class StockServiceTests
{
    [Fact]
    public async Task RegisterMovementAsync_ShouldIncreaseStockAndRecordInflow()
    {
        await using var context = CreateContext();
        var product = new Product { Name = "Coxinha", StockQuantity = 2 };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var service = new StockService(context);
        var movement = await service.RegisterMovementAsync(new StockMovementRequest
        {
            ProductId = product.Id,
            Type = StockMovementType.Inflow,
            Quantity = 5,
            Reason = "Reposição"
        });

        (await context.Products.SingleAsync()).StockQuantity.Should().Be(7);
        movement.Type.Should().Be(nameof(StockMovementType.Inflow));
        (await context.StockMovements.SingleAsync()).Quantity.Should().Be(5);
    }

    [Fact]
    public async Task RegisterMovementAsync_ShouldRejectOutflowBeyondAvailableStock()
    {
        await using var context = CreateContext();
        var product = new Product { Name = "Coxinha", StockQuantity = 2 };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var service = new StockService(context);
        var act = () => service.RegisterMovementAsync(new StockMovementRequest
        {
            ProductId = product.Id,
            Type = StockMovementType.Outflow,
            Quantity = 3
        });

        await act.Should().ThrowAsync<InvalidOperationException>();
        (await context.Products.SingleAsync()).StockQuantity.Should().Be(2);
        (await context.StockMovements.CountAsync()).Should().Be(0);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
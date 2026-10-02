using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Salgados.Api.DTOs.Products;
using Salgados.Api.Services;
using Salgados.Core.Entities;
using Salgados.Infrastructure.Data;

namespace Salgados.Tests.Products;

public class ProductServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldPersistVariantsAndUseLowestPriceAsProductPrice()
    {
        await using var context = CreateContext();
        var category = new Category { Name = "Fritos" };
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var service = new ProductService(context);
        var response = await service.CreateAsync(new CreateProductRequest
        {
            Name = "Pastel",
            CategoryId = category.Id,
            StockQuantity = 4,
            Variants =
            [
                new ProductVariantRequest { Label = " P ", Price = 3m },
                new ProductVariantRequest { Label = "G", Price = 6m }
            ]
        });

        response.Price.Should().Be(3m);
        response.Variants.Should().HaveCount(2);
        response.Variants.Select(variant => variant.Label).Should().ContainInOrder("P", "G");
        (await context.ProductVariants.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task CreateAsync_ShouldRejectDuplicateVariantLabelsIgnoringCase()
    {
        await using var context = CreateContext();
        var category = new Category { Name = "Fritos" };
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var service = new ProductService(context);
        var act = () => service.CreateAsync(new CreateProductRequest
        {
            Name = "Pastel",
            CategoryId = category.Id,
            Variants =
            [
                new ProductVariantRequest { Label = "Grande", Price = 6m },
                new ProductVariantRequest { Label = " grande ", Price = 7m }
            ]
        });

        await act.Should().ThrowAsync<InvalidOperationException>();
        (await context.Products.CountAsync()).Should().Be(0);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
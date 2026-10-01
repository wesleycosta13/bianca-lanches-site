using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Salgados.Api.DTOs.Orders;
using Salgados.Api.Services;
using Salgados.Core.Entities;
using Salgados.Core.Enums;
using Salgados.Infrastructure.Data;

namespace Salgados.Tests.Orders;

public class OrderPaymentTests
{
    [Fact]
    public async Task Payment_ShouldStayPendingUntilOrderIsDelivered()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);
        var category = new Category { Name = "Fritos" };
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var product = new Product
        {
            Name = "Coxinha",
            Description = "Coxinha de frango",
            CategoryId = category.Id,
            Price = 8m,
            StockQuantity = 2,
            IsAvailable = true
        };
        context.Products.Add(product);
        await context.SaveChangesAsync();
        var variant = new ProductVariant { ProductId = product.Id, Label = "Unidade", Price = 8m };
        context.ProductVariants.Add(variant);
        await context.SaveChangesAsync();

        var service = new OrderService(context);
        var order = await service.CreateAsync(new CreateOrderRequest
        {
            CustomerName = "Cliente de teste",
            CustomerPhone = "88999999999",
            DeliveryStreet = "Rua Central",
            DeliveryNumber = "10",
            DeliveryNeighborhood = "Centro",
            DeliveryCity = "Fortaleza",
            PaymentMethod = PaymentMethod.Pix,
            Items = [new OrderItemRequest { ProductId = product.Id, VariantId = variant.Id, Quantity = 1 }]
        });

        var payment = await context.Payments.SingleAsync();
        payment.Status.Should().Be(PaymentStatus.Pending);
        payment.PaidAt.Should().BeNull();
        payment.Amount.Should().Be(8m);

        await service.UpdateStatusAsync(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.InPreparation });
        payment = await context.Payments.SingleAsync();
        payment.Status.Should().Be(PaymentStatus.Pending);
        payment.PaidAt.Should().BeNull();

        await service.UpdateStatusAsync(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Delivered });
        payment = await context.Payments.SingleAsync();
        payment.Status.Should().Be(PaymentStatus.Paid);
        payment.PaidAt.Should().NotBeNull();

        var legacyOrder = new Order
        {
            OrderNumber = "PED-LEGACY",
            CustomerName = "Cliente antigo",
            CustomerPhone = "88999999999",
            DeliveryStreet = "Rua Central",
            DeliveryNumber = "S/N",
            DeliveryNeighborhood = "Centro",
            DeliveryCity = "Fortaleza",
            Status = OrderStatus.Delivered,
            PaymentMethod = PaymentMethod.Cash,
            TotalAmount = 15m
        };
        context.Orders.Add(legacyOrder);
        await context.SaveChangesAsync();

        await service.UpdateStatusAsync(legacyOrder.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Delivered });

        var legacyPayment = await context.Payments.SingleAsync(payment => payment.OrderId == legacyOrder.Id);
        legacyPayment.Status.Should().Be(PaymentStatus.Paid);
        legacyPayment.Method.Should().Be(PaymentMethod.Cash);
        legacyPayment.Amount.Should().Be(15m);
        legacyPayment.PaidAt.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateOrder_ShouldRejectForeignVariantAndAggregateDuplicateStockLines()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);
        var category = new Category { Name = "Fritos" };
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var firstProduct = new Product { Name = "Coxinha", CategoryId = category.Id, Price = 8m, StockQuantity = 2, IsAvailable = true };
        var secondProduct = new Product { Name = "Risole", CategoryId = category.Id, Price = 9m, StockQuantity = 2, IsAvailable = true };
        context.Products.AddRange(firstProduct, secondProduct);
        await context.SaveChangesAsync();

        var firstVariant = new ProductVariant { ProductId = firstProduct.Id, Label = "Unidade", Price = 8m };
        var secondVariant = new ProductVariant { ProductId = secondProduct.Id, Label = "Unidade", Price = 9m };
        context.ProductVariants.AddRange(firstVariant, secondVariant);
        await context.SaveChangesAsync();

        var service = new OrderService(context);
        var request = new CreateOrderRequest
        {
            CustomerName = "Cliente de teste",
            CustomerPhone = "88999999999",
            DeliveryStreet = "Rua Central",
            DeliveryNumber = "10",
            DeliveryNeighborhood = "Centro",
            DeliveryCity = "Fortaleza",
            PaymentMethod = PaymentMethod.Pix,
            Items = [new OrderItemRequest { ProductId = firstProduct.Id, VariantId = secondVariant.Id, Quantity = 1 }]
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(request));

        request.Items =
        [
            new OrderItemRequest { ProductId = firstProduct.Id, VariantId = firstVariant.Id, Quantity = 2 },
            new OrderItemRequest { ProductId = firstProduct.Id, VariantId = firstVariant.Id, Quantity = 1 }
        ];
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(request));

        (await context.Products.SingleAsync(product => product.Id == firstProduct.Id)).StockQuantity.Should().Be(2);
        (await context.Orders.CountAsync()).Should().Be(0);
    }
}
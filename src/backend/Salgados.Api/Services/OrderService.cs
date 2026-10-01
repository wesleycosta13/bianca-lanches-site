using Microsoft.EntityFrameworkCore;
using Salgados.Api.DTOs.Orders;
using Salgados.Core.Entities;
using Salgados.Core.Enums;
using Salgados.Infrastructure.Data;

namespace Salgados.Api.Services;

public interface IOrderService
{
    Task<List<OrderResponse>> GetAllAsync();
    Task<OrderResponse> GetByIdAsync(int id);
    Task<OrderResponse> CreateAsync(CreateOrderRequest request);
    Task<OrderResponse> UpdateStatusAsync(int id, UpdateOrderStatusRequest request);
}

public class OrderService : IOrderService
{
    private readonly AppDbContext _context;

    public OrderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderResponse>> GetAllAsync()
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToResponse).ToList();
    }

    public async Task<OrderResponse> GetByIdAsync(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new KeyNotFoundException($"Pedido com ID {id} não encontrado.");

        return MapToResponse(order);
    }

    public async Task<OrderResponse> CreateAsync(CreateOrderRequest request)
    {
        var quantitiesByProductId = request.Items
            .GroupBy(item => item.ProductId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));
        var productIds = quantitiesByProductId.Keys.ToList();
        var products = await _context.Products
            .Include(product => product.Variants)
            .Where(p => productIds.Contains(p.Id) && p.IsAvailable)
            .ToListAsync();

        // Verifica se todos os produtos existem e estão disponíveis
        var missingProducts = productIds.Except(products.Select(p => p.Id)).ToList();
        if (missingProducts.Count > 0)
            throw new KeyNotFoundException($"Produto(s) não encontrado(s) ou indisponível(eis): {string.Join(", ", missingProducts)}.");

        // Verifica estoque suficiente
        foreach (var (productId, requestedQuantity) in quantitiesByProductId)
        {
            var product = products.First(p => p.Id == productId);
            if (product.StockQuantity < requestedQuantity)
                throw new InvalidOperationException($"Estoque insuficiente para o produto '{product.Name}'. Disponível: {product.StockQuantity}, solicitado: {requestedQuantity}.");
        }

        // Gera número do pedido
        var orderNumber = $"PED-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        // Monta os itens e calcula total
        var orderItems = request.Items.Select(i =>
        {
            var product = products.First(p => p.Id == i.ProductId);
            var variant = product.Variants.FirstOrDefault(candidate => candidate.Id == i.VariantId && candidate.IsAvailable)
                ?? throw new InvalidOperationException($"A variante selecionada do produto '{product.Name}' não está disponível.");

            return new OrderItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitPrice = variant.Price,
                Subtotal = variant.Price * i.Quantity
            };
        }).ToList();

        var totalAmount = orderItems.Sum(i => i.Subtotal);
        if (totalAmount > 99_999_999.99m)
            throw new InvalidOperationException("O total do pedido excede o limite permitido.");

        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            DeliveryStreet = request.DeliveryStreet,
            DeliveryNumber = request.DeliveryNumber,
            DeliveryNeighborhood = request.DeliveryNeighborhood,
            DeliveryComplement = request.DeliveryComplement,
            DeliveryCity = request.DeliveryCity,
            DeliveryReference = request.DeliveryReference,
            Status = OrderStatus.Received,
            PaymentMethod = request.PaymentMethod,
            TotalAmount = totalAmount,
            ChangeFor = request.ChangeFor,
            Notes = request.Notes,
            Items = orderItems,
            Payment = new Payment
            {
                Method = request.PaymentMethod,
                Status = PaymentStatus.Pending,
                Amount = totalAmount,
                ChangeFor = request.ChangeFor,
                CreatedAt = DateTime.UtcNow
            },
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);

        // Debita estoque e registra movimentações
        foreach (var item in request.Items)
        {
            var product = products.First(p => p.Id == item.ProductId);
            product.StockQuantity -= item.Quantity;
            product.UpdatedAt = DateTime.UtcNow;

            _context.StockMovements.Add(new StockMovement
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                Type = StockMovementType.Outflow,
                Reason = $"Venda via pedido {orderNumber}",
                CreatedAt = DateTime.UtcNow
            });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DbUpdateConcurrencyException("O estoque foi alterado por outro pedido. Atualize o cardápio e tente novamente.");
        }

        // Atualiza a referência do OrderId nas movimentações
        var savedOrder = await _context.Orders.FirstAsync(o => o.OrderNumber == orderNumber);
        var movements = await _context.StockMovements
            .Where(sm => sm.Reason != null && sm.Reason.Contains(orderNumber))
            .ToListAsync();
        foreach (var movement in movements)
            movement.OrderId = savedOrder.Id;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(savedOrder.Id);
    }

    public async Task<OrderResponse> UpdateStatusAsync(int id, UpdateOrderStatusRequest request)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new KeyNotFoundException($"Pedido com ID {id} não encontrado.");

        // Se cancelado, devolve estoque
        if (request.Status == OrderStatus.Cancelled && order.Status != OrderStatus.Cancelled)
        {
            foreach (var item in order.Items)
            {
                item.Product.StockQuantity += item.Quantity;
                item.Product.UpdatedAt = DateTime.UtcNow;

                _context.StockMovements.Add(new StockMovement
                {
                    ProductId = item.ProductId,
                    OrderId = order.Id,
                    Quantity = item.Quantity,
                    Type = StockMovementType.Cancellation,
                    Reason = $"Cancelamento do pedido {order.OrderNumber}",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (request.Status == OrderStatus.Delivered && order.Payment?.Status != PaymentStatus.Paid)
        {
            var paidAt = DateTime.UtcNow;
            order.Payment ??= new Payment { OrderId = order.Id, CreatedAt = paidAt };
            order.Payment.Method = order.PaymentMethod;
            order.Payment.Status = PaymentStatus.Paid;
            order.Payment.Amount = order.TotalAmount;
            order.Payment.ChangeFor = order.ChangeFor;
            order.Payment.PaidAt ??= paidAt;
        }

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(order);
    }

    private static OrderResponse MapToResponse(Order o) => new()
    {
        Id = o.Id,
        OrderNumber = o.OrderNumber,
        CustomerName = o.CustomerName,
        CustomerPhone = o.CustomerPhone,
        DeliveryStreet = o.DeliveryStreet,
        DeliveryNumber = o.DeliveryNumber,
        DeliveryNeighborhood = o.DeliveryNeighborhood,
        DeliveryComplement = o.DeliveryComplement,
        DeliveryCity = o.DeliveryCity,
        DeliveryReference = o.DeliveryReference,
        Status = o.Status.ToString(),
        PaymentMethod = o.PaymentMethod.ToString(),
        TotalAmount = o.TotalAmount,
        ChangeFor = o.ChangeFor,
        Notes = o.Notes,
        Items = o.Items.Select(i => new OrderItemResponse
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ProductName = i.Product?.Name ?? string.Empty,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            Subtotal = i.Subtotal
        }).ToList(),
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt
    };
}

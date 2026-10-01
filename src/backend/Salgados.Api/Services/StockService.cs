using Microsoft.EntityFrameworkCore;
using Salgados.Api.DTOs.Stock;
using Salgados.Core.Entities;
using Salgados.Infrastructure.Data;

namespace Salgados.Api.Services;

public interface IStockService
{
    Task<List<StockResponse>> GetStockAsync();
    Task<StockMovementResponse> RegisterMovementAsync(StockMovementRequest request);
}

public class StockService : IStockService
{
    private readonly AppDbContext _context;

    public StockService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StockResponse>> GetStockAsync()
    {
        var products = await _context.Products
            .Include(p => p.StockMovements)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return products.Select(p => new StockResponse
        {
            ProductId = p.Id,
            ProductName = p.Name,
            CurrentQuantity = p.StockQuantity,
            IsAvailable = p.IsAvailable,
            RecentMovements = p.StockMovements
                .OrderByDescending(m => m.CreatedAt)
                .Take(10)
                .Select(m => new StockMovementResponse
                {
                    Id = m.Id,
                    ProductId = m.ProductId,
                    ProductName = p.Name,
                    Type = m.Type.ToString(),
                    Quantity = m.Quantity,
                    Reason = m.Reason,
                    OrderId = m.OrderId,
                    CreatedAt = m.CreatedAt
                }).ToList()
        }).ToList();
    }

    public async Task<StockMovementResponse> RegisterMovementAsync(StockMovementRequest request)
    {
        var product = await _context.Products.FindAsync(request.ProductId)
            ?? throw new KeyNotFoundException($"Produto com ID {request.ProductId} não encontrado.");

        // Ajusta o estoque conforme o tipo de movimentação
        switch (request.Type)
        {
            case Core.Enums.StockMovementType.Inflow:
            case Core.Enums.StockMovementType.Cancellation:
                product.StockQuantity += request.Quantity;
                break;
            case Core.Enums.StockMovementType.Outflow:
            case Core.Enums.StockMovementType.Adjustment:
                if (product.StockQuantity < request.Quantity)
                    throw new InvalidOperationException($"Estoque insuficiente. Disponível: {product.StockQuantity}, solicitado: {request.Quantity}.");
                product.StockQuantity -= request.Quantity;
                break;
        }

        product.UpdatedAt = DateTime.UtcNow;

        var movement = new StockMovement
        {
            ProductId = request.ProductId,
            Type = request.Type,
            Quantity = request.Quantity,
            Reason = request.Reason,
            CreatedAt = DateTime.UtcNow
        };

        _context.StockMovements.Add(movement);
        await _context.SaveChangesAsync();

        return new StockMovementResponse
        {
            Id = movement.Id,
            ProductId = movement.ProductId,
            ProductName = product.Name,
            Type = movement.Type.ToString(),
            Quantity = movement.Quantity,
            Reason = movement.Reason,
            OrderId = movement.OrderId,
            CreatedAt = movement.CreatedAt
        };
    }
}

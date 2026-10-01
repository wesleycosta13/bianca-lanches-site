using Microsoft.EntityFrameworkCore;
using Salgados.Api.DTOs.Products;
using Salgados.Core.Entities;
using Salgados.Infrastructure.Data;

namespace Salgados.Api.Services;

public interface IProductService
{
    Task<List<ProductResponse>> GetAllAsync();
    Task<ProductResponse> GetByIdAsync(int id);
    Task<ProductResponse> CreateAsync(CreateProductRequest request);
    Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request);
    Task DeleteAsync(int id);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductResponse>> GetAllAsync()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return products.Select(MapToResponse).ToList();
    }

    public async Task<ProductResponse> GetByIdAsync(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException($"Produto com ID {id} não encontrado.");

        return MapToResponse(product);
    }

    public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
            throw new KeyNotFoundException($"Categoria com ID {request.CategoryId} não encontrada.");
        ValidateVariants(request.Variants);

        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            CategoryId = request.CategoryId,
            Price = request.Variants.Min(variant => variant.Price),
            StockQuantity = request.StockQuantity,
            ImageUrl = request.ImageUrl,
            IsAvailable = request.IsAvailable,
            Variants = request.Variants.Select(variant => new ProductVariant
            {
                Label = variant.Label.Trim(),
                Price = variant.Price,
                IsAvailable = variant.IsAvailable,
                CreatedAt = DateTime.UtcNow
            }).ToList(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(product.Id);
    }

    public async Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request)
    {
        var product = await _context.Products.Include(p => p.Variants).FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException($"Produto com ID {id} não encontrado.");

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
            throw new KeyNotFoundException($"Categoria com ID {request.CategoryId} não encontrada.");
        ValidateVariants(request.Variants);

        product.Name = request.Name;
        product.Description = request.Description;
        product.CategoryId = request.CategoryId;
        product.Price = request.Variants.Min(variant => variant.Price);
        product.StockQuantity = request.StockQuantity;
        product.ImageUrl = request.ImageUrl;
        product.IsAvailable = request.IsAvailable;
        product.UpdatedAt = DateTime.UtcNow;
        _context.ProductVariants.RemoveRange(product.Variants);
        product.Variants = request.Variants.Select(variant => new ProductVariant
        {
            ProductId = product.Id,
            Label = variant.Label.Trim(),
            Price = variant.Price,
            IsAvailable = variant.IsAvailable,
            CreatedAt = DateTime.UtcNow
        }).ToList();
        _context.ProductVariants.AddRange(product.Variants);

        await _context.SaveChangesAsync();

        return await GetByIdAsync(product.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id)
            ?? throw new KeyNotFoundException($"Produto com ID {id} não encontrado.");

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
    }

    private static ProductResponse MapToResponse(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? string.Empty,
        Price = p.Price,
        StockQuantity = p.StockQuantity,
        ImageUrl = p.ImageUrl,
        IsAvailable = p.IsAvailable,
        Variants = p.Variants.OrderBy(variant => variant.Price).Select(variant => new ProductVariantResponse
        {
            Id = variant.Id,
            Label = variant.Label,
            Price = variant.Price,
            IsAvailable = variant.IsAvailable
        }).ToList(),
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    private static void ValidateVariants(IReadOnlyCollection<ProductVariantRequest> variants)
    {
        var duplicateLabel = variants
            .GroupBy(variant => variant.Label.Trim(), StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(group => group.Count() > 1);
        if (duplicateLabel is not null)
            throw new InvalidOperationException($"A variante '{duplicateLabel.Key}' foi informada mais de uma vez.");
    }
}

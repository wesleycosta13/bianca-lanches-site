using Microsoft.EntityFrameworkCore;
using Salgados.Api.DTOs.Categories;
using Salgados.Core.Entities;
using Salgados.Infrastructure.Data;

namespace Salgados.Api.Services;

public interface ICategoryService
{
    Task<List<CategoryResponse>> GetAllAsync();
    Task<CategoryResponse> GetByIdAsync(int id);
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request);
    Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request);
    Task DeleteAsync(int id);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryResponse>> GetAllAsync()
    {
        var categories = await _context.Categories
            .Include(c => c.Products)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return categories.Select(MapToResponse).ToList();
    }

    public async Task<CategoryResponse> GetByIdAsync(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new KeyNotFoundException($"Categoria com ID {id} não encontrada.");

        return MapToResponse(category);
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request)
    {
        var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.Trim().ToLower());
        if (exists)
            throw new InvalidOperationException($"Já existe uma categoria com o nome '{request.Name}'.");

        var category = new Category
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(category.Id);
    }

    public async Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request)
    {
        var category = await _context.Categories.FindAsync(id)
            ?? throw new KeyNotFoundException($"Categoria com ID {id} não encontrada.");

        var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.Trim().ToLower() && c.Id != id);
        if (exists)
            throw new InvalidOperationException($"Já existe uma categoria com o nome '{request.Name}'.");

        category.Name = request.Name.Trim();
        category.Description = request.Description;
        category.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(category.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new KeyNotFoundException($"Categoria com ID {id} não encontrada.");

        if (category.Products.Count > 0)
            throw new InvalidOperationException("Não é possível excluir uma categoria que possui produtos vinculados.");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }

    private static CategoryResponse MapToResponse(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        IsActive = c.IsActive,
        ProductCount = c.Products.Count,
        CreatedAt = c.CreatedAt
    };
}

using Microsoft.EntityFrameworkCore;
using Salgados.Core.Entities;
using Salgados.Core.Enums;

namespace Salgados.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext context, string adminEmail, string adminPassword)
    {
        // Aplica migrations pendentes se houver
        await context.Database.MigrateAsync();

        var normalizedAdminEmail = adminEmail.Trim().ToLowerInvariant();
        var otherAdmins = await context.Users
            .Where(user => user.Role == UserRole.Admin && user.Email != normalizedAdminEmail)
            .ToListAsync();
        foreach (var otherAdmin in otherAdmins)
        {
            otherAdmin.Role = UserRole.Customer;
            otherAdmin.UpdatedAt = DateTime.UtcNow;
        }
        if (otherAdmins.Count > 0)
            await context.SaveChangesAsync();

        var admin = await context.Users.FirstOrDefaultAsync(user => user.Email == normalizedAdminEmail);
        if (admin is null)
        {
            admin = new User
            {
                Name = "Administrador",
                Email = normalizedAdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddAsync(admin);
            await context.SaveChangesAsync();
        }
        else if (admin.Role != UserRole.Admin)
        {
            throw new InvalidOperationException("O e-mail configurado para Admin já pertence a uma conta sem papel administrativo.");
        }
        else if (!BCrypt.Net.BCrypt.Verify(adminPassword, admin.PasswordHash))
        {
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
            admin.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        if (!await context.Categories.AnyAsync())
        {
            await context.Categories.AddRangeAsync(
                new Category { Name = "Fritos", CreatedAt = DateTime.UtcNow },
                new Category { Name = "Assados", CreatedAt = DateTime.UtcNow },
                new Category { Name = "Doces", CreatedAt = DateTime.UtcNow },
                new Category { Name = "Combos", CreatedAt = DateTime.UtcNow },
                new Category { Name = "Bebidas", CreatedAt = DateTime.UtcNow });
            await context.SaveChangesAsync();
        }

        if (!await context.Products.AnyAsync())
        {
            var categoryIds = await context.Categories.ToDictionaryAsync(category => category.Name, category => category.Id);
            const string pastelImage = "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85";
            const string snackImage = "https://images.unsplash.com/photo-1625944525533-473f1a3d54e9?auto=format&fit=crop&w=900&q=85";
            const string drinkImage = "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=900&q=85";

            var initialProducts = new (string Name, string Description, string Category, decimal Price, string ImageUrl)[]
            {
                ("Carne", "Recheio bem temperado, feito na casa.", "Fritos", 3m, pastelImage),
                ("Queijo", "Queijo derretido em massa crocante.", "Fritos", 3m, pastelImage),
                ("Frango", "Frango temperado para comer quentinho.", "Fritos", 3m, pastelImage),
                ("Calabresa", "Calabresa saborosa, preparada na hora.", "Fritos", 3m, pastelImage),
                ("Misto", "A combinação clássica de presunto e queijo.", "Fritos", 3m, pastelImage),
                ("Carne de Sol", "Carne de sol com aquele sabor do Nordeste.", "Fritos", 3m, pastelImage),
                ("Coxinha", "Massa macia, recheio generoso e casquinha crocante.", "Fritos", 12.5m, snackImage),
                ("Risole", "Douradinho por fora, macio por dentro.", "Fritos", 13.5m, snackImage),
                ("Enroladinho", "Massa leve, assada até ficar no ponto.", "Assados", 14.5m, snackImage),
                ("Bolinha de carne", "Pequena no tamanho, cheia de sabor.", "Fritos", 16.5m, snackImage),
                ("Coca-Cola", "Gelada para acompanhar seu lanche.", "Bebidas", 3.5m, drinkImage),
                ("Guaraná", "Refrescante do primeiro ao último gole.", "Bebidas", 2m, drinkImage),
                ("Pepsi", "Uma pausa gelada para acompanhar.", "Bebidas", 3.5m, drinkImage),
                ("Fanta Laranja", "Sabor de laranja bem geladinho.", "Bebidas", 3.5m, drinkImage),
                ("Fanta Uva", "Refrescante e pronta para a hora do lanche.", "Bebidas", 3.5m, drinkImage),
                ("Cajuína", "O gostinho regional que combina com tudo.", "Bebidas", 9m, drinkImage)
            };

            await context.Products.AddRangeAsync(initialProducts.Select(product => new Product
            {
                Name = product.Name,
                Description = product.Description,
                CategoryId = categoryIds[product.Category],
                Price = product.Price,
                StockQuantity = 0,
                ImageUrl = product.ImageUrl,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            }));
            await context.SaveChangesAsync();
        }

        if (!await context.ProductVariants.AnyAsync())
        {
            var products = await context.Products.ToListAsync();
            var variants = products.SelectMany(product => GetInitialVariants(product).Select(variant => new ProductVariant
            {
                ProductId = product.Id,
                Label = variant.Label,
                Price = variant.Price,
                IsAvailable = variant.IsAvailable,
                CreatedAt = DateTime.UtcNow
            }));

            await context.ProductVariants.AddRangeAsync(variants);
            await context.SaveChangesAsync();
        }
    }

    private static IReadOnlyList<(string Label, decimal Price, bool IsAvailable)> GetInitialVariants(Product product) => product.Name switch
    {
        "Carne" or "Queijo" or "Frango" or "Calabresa" or "Misto" =>
        [ ("P", 3m, true), ("G", 6m, true), ("GG", 14m, true) ],
        "Carne de Sol" => [ ("P", 3m, true), ("G", 7m, true), ("GG", 15m, true) ],
        "Coxinha" => [ ("Unidade", 12.5m, true) ],
        "Risole" => [ ("Unidade", 13.5m, true) ],
        "Enroladinho" => [ ("Unidade", 14.5m, true) ],
        "Bolinha de carne" => [ ("Unidade", 16.5m, true) ],
        "Coca-Cola" => [ ("250 ml", 3.5m, true), ("1 L", 9m, true), ("2 L", 12m, true) ],
        "Guaraná" => [ ("250 ml", 2m, true), ("1 L", 7m, true), ("2 L", 12m, true) ],
        "Pepsi" => [ ("250 ml", 3.5m, true), ("1 L", 7m, true), ("2 L", 10m, true) ],
        "Fanta Laranja" or "Fanta Uva" => [ ("250 ml", 3.5m, true), ("1 L", 3.5m, false), ("2 L", 12m, true) ],
        "Cajuína" => [ ("250 ml", 9m, false), ("1 L", 9m, true), ("2 L", 12m, true) ],
        _ => [ ("Unidade", product.Price, true) ]
    };
}

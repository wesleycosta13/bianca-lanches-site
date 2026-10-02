using Microsoft.EntityFrameworkCore;
using Salgados.Core.Entities;

namespace Salgados.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();
    public DbSet<BlockedLogin> BlockedLogins => Set<BlockedLogin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User (Administrador)
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Name).IsRequired().HasMaxLength(150);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(150);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<LoginAttempt>(entity =>
        {
            entity.HasKey(attempt => attempt.Id);
            entity.Property(attempt => attempt.Email).IsRequired().HasMaxLength(150);
            entity.Property(attempt => attempt.IpAddress).HasMaxLength(45);
            entity.HasIndex(attempt => new { attempt.Email, attempt.AttemptedAt });
            entity.HasIndex(attempt => attempt.IpAddress).IsUnique().HasFilter("\"IpAddress\" IS NOT NULL");
        });

        modelBuilder.Entity<BlockedLogin>(entity =>
        {
            entity.HasKey(blockedLogin => blockedLogin.Id);
            entity.Property(blockedLogin => blockedLogin.Email).IsRequired().HasMaxLength(150);
            entity.HasIndex(blockedLogin => blockedLogin.Email).IsUnique();
        });

        // Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(c => c.Name).IsUnique();
            entity.Property(c => c.Description).HasMaxLength(255);
        });

        // Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(150);
            entity.Property(p => p.Description).HasMaxLength(500);
            entity.Property(p => p.Price).HasPrecision(10, 2);
            entity.Property(p => p.StockQuantity).IsRequired().IsConcurrencyToken();
            entity.Property(p => p.ImageUrl).HasMaxLength(500);

            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(variant => variant.Id);
            entity.Property(variant => variant.Label).IsRequired().HasMaxLength(50);
            entity.Property(variant => variant.Price).HasPrecision(10, 2);
            entity.HasIndex(variant => new { variant.ProductId, variant.Label }).IsUnique();

            entity.HasOne(variant => variant.Product)
                  .WithMany(product => product.Variants)
                  .HasForeignKey(variant => variant.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // StockMovement
        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.HasKey(sm => sm.Id);
            entity.Property(sm => sm.Type).HasConversion<string>().HasMaxLength(20);
            entity.Property(sm => sm.Reason).HasMaxLength(255);

            entity.HasOne(sm => sm.Product)
                  .WithMany(p => p.StockMovements)
                  .HasForeignKey(sm => sm.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Order
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.OrderNumber).IsRequired().HasMaxLength(50);
            entity.HasIndex(o => o.OrderNumber).IsUnique();

            entity.Property(o => o.CustomerName).IsRequired().HasMaxLength(150);
            entity.Property(o => o.CustomerPhone).IsRequired().HasMaxLength(30);

            entity.Property(o => o.DeliveryStreet).IsRequired().HasMaxLength(200);
            entity.Property(o => o.DeliveryNumber).IsRequired().HasMaxLength(20);
            entity.Property(o => o.DeliveryNeighborhood).IsRequired().HasMaxLength(100);
            entity.Property(o => o.DeliveryComplement).HasMaxLength(100);
            entity.Property(o => o.DeliveryCity).IsRequired().HasMaxLength(100);
            entity.Property(o => o.DeliveryReference).HasMaxLength(200);

            entity.Property(o => o.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(o => o.PaymentMethod).HasConversion<string>().HasMaxLength(20);
            entity.Property(o => o.TotalAmount).HasPrecision(10, 2);
            entity.Property(o => o.ChangeFor).HasPrecision(10, 2);
            entity.Property(o => o.Notes).HasMaxLength(500);
        });

        // OrderItem
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(oi => oi.Id);
            entity.Property(oi => oi.UnitPrice).HasPrecision(10, 2);
            entity.Property(oi => oi.Subtotal).HasPrecision(10, 2);

            entity.HasOne(oi => oi.Order)
                  .WithMany(o => o.Items)
                  .HasForeignKey(oi => oi.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(oi => oi.Product)
                  .WithMany()
                  .HasForeignKey(oi => oi.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Payment (Na entrega)
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(p => p.Method).HasConversion<string>().HasMaxLength(20);
            entity.Property(p => p.Amount).HasPrecision(10, 2);
            entity.Property(p => p.ChangeFor).HasPrecision(10, 2);

            entity.HasOne(p => p.Order)
                  .WithOne(o => o.Payment)
                  .HasForeignKey<Payment>(p => p.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed inicial de Categorias
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Fritos", Description = "Coxinhas, quibes, risoles e pasteis fritos na hora", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 2, Name = "Assados", Description = "Empadas, esfirras, folhados e enroladinhos de forno", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 3, Name = "Doces", Description = "Brigadeiros, beijinhos, mini churros e doces artesanais", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 4, Name = "Combos", Description = "Kits para festas e porções combinadas especiais", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 5, Name = "Bebidas", Description = "Refrigerantes, sucos naturais e águas", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}

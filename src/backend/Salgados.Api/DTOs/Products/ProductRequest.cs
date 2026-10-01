using System.ComponentModel.DataAnnotations;

namespace Salgados.Api.DTOs.Products;

public class CreateProductRequest
{
    [Required(ErrorMessage = "O nome do produto é obrigatório.")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "A categoria é obrigatória.")]
    public int CategoryId { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "O estoque não pode ser negativo.")]
    public int StockQuantity { get; set; } = 0;

    public string? ImageUrl { get; set; }

    public bool IsAvailable { get; set; } = true;

    [Required]
    [MinLength(1, ErrorMessage = "Cadastre ao menos uma variante com preço.")]
    public List<ProductVariantRequest> Variants { get; set; } = new();
}

public class UpdateProductRequest
{
    [Required(ErrorMessage = "O nome do produto é obrigatório.")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "A categoria é obrigatória.")]
    public int CategoryId { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "O estoque não pode ser negativo.")]
    public int StockQuantity { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsAvailable { get; set; } = true;

    [Required]
    [MinLength(1, ErrorMessage = "Cadastre ao menos uma variante com preço.")]
    public List<ProductVariantRequest> Variants { get; set; } = new();
}

public class ProductVariantRequest
{
    [Required]
    [MaxLength(50)]
    public string Label { get; set; } = string.Empty;

    [Range(0.01, 99999.99, ErrorMessage = "O preço deve ser maior que zero.")]
    public decimal Price { get; set; }

    public bool IsAvailable { get; set; } = true;
}

using System.ComponentModel.DataAnnotations;
using Salgados.Core.Enums;

namespace Salgados.Api.DTOs.Stock;

public class StockMovementRequest
{
    [Required(ErrorMessage = "O produto é obrigatório.")]
    public int ProductId { get; set; }

    [Required(ErrorMessage = "O tipo de movimentação é obrigatório.")]
    public StockMovementType Type { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "A quantidade deve ser maior que zero.")]
    public int Quantity { get; set; }

    [MaxLength(255)]
    public string? Reason { get; set; }
}

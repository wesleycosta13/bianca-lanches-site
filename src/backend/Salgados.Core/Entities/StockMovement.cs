using Salgados.Core.Enums;

namespace Salgados.Core.Entities;

public class StockMovement : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
    public StockMovementType Type { get; set; }
    public string? Reason { get; set; }
    public int? OrderId { get; set; }
}

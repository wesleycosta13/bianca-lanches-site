namespace Salgados.Api.DTOs.Stock;

public class StockResponse
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int CurrentQuantity { get; set; }
    public bool IsAvailable { get; set; }
    public List<StockMovementResponse> RecentMovements { get; set; } = new();
}

public class StockMovementResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Reason { get; set; }
    public int? OrderId { get; set; }
    public DateTime CreatedAt { get; set; }
}

namespace Salgados.Api.DTOs.Orders;

public class OrderResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string DeliveryStreet { get; set; } = string.Empty;
    public string DeliveryNumber { get; set; } = string.Empty;
    public string DeliveryNeighborhood { get; set; } = string.Empty;
    public string? DeliveryComplement { get; set; }
    public string DeliveryCity { get; set; } = string.Empty;
    public string? DeliveryReference { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal? ChangeFor { get; set; }
    public string? Notes { get; set; }
    public List<OrderItemResponse> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class OrderItemResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}

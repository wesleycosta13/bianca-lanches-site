using Salgados.Core.Enums;

namespace Salgados.Core.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;

    // Dados do Cliente (sem necessidade de login prévio)
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;

    // Endereço de Entrega
    public string DeliveryStreet { get; set; } = string.Empty;
    public string DeliveryNumber { get; set; } = string.Empty;
    public string DeliveryNeighborhood { get; set; } = string.Empty;
    public string? DeliveryComplement { get; set; }
    public string DeliveryCity { get; set; } = string.Empty;
    public string? DeliveryReference { get; set; }

    // Status e Pagamento
    public OrderStatus Status { get; set; } = OrderStatus.Received;
    public PaymentMethod PaymentMethod { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal? ChangeFor { get; set; } // Valor do troco se pagamento em dinheiro
    public string? Notes { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Relacionamentos
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public Payment? Payment { get; set; }
}

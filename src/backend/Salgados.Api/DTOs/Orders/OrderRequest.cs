using System.ComponentModel.DataAnnotations;
using Salgados.Core.Enums;

namespace Salgados.Api.DTOs.Orders;

public class CreateOrderRequest
{
    [Required(ErrorMessage = "O nome do cliente é obrigatório.")]
    [MaxLength(150)]
    public string CustomerName { get; set; } = string.Empty;

    [Required(ErrorMessage = "O telefone do cliente é obrigatório.")]
    [MaxLength(30)]
    public string CustomerPhone { get; set; } = string.Empty;

    [Required(ErrorMessage = "A rua de entrega é obrigatória.")]
    [MaxLength(200)]
    public string DeliveryStreet { get; set; } = string.Empty;

    [Required(ErrorMessage = "O número de entrega é obrigatório.")]
    [MaxLength(20)]
    public string DeliveryNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "O bairro de entrega é obrigatório.")]
    [MaxLength(100)]
    public string DeliveryNeighborhood { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? DeliveryComplement { get; set; }

    [Required(ErrorMessage = "A cidade de entrega é obrigatória.")]
    [MaxLength(100)]
    public string DeliveryCity { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? DeliveryReference { get; set; }

    [Required(ErrorMessage = "O método de pagamento é obrigatório.")]
    public PaymentMethod PaymentMethod { get; set; }

    public decimal? ChangeFor { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    [Required(ErrorMessage = "O pedido deve ter ao menos um item.")]
    [MinLength(1, ErrorMessage = "O pedido deve ter ao menos um item.")]
    [MaxLength(50, ErrorMessage = "O pedido não pode ter mais de 50 linhas de itens.")]
    public List<OrderItemRequest> Items { get; set; } = new();
}

public class OrderItemRequest
{
    [Required(ErrorMessage = "O produto é obrigatório.")]
    public int ProductId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Selecione uma variante válida.")]
    public int VariantId { get; set; }

    [Range(1, 100, ErrorMessage = "A quantidade por item deve ficar entre 1 e 100.")]
    public int Quantity { get; set; }
}

public class UpdateOrderStatusRequest
{
    [Required(ErrorMessage = "O status do pedido é obrigatório.")]
    public OrderStatus Status { get; set; }
}

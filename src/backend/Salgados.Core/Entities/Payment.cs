using Salgados.Core.Enums;

namespace Salgados.Core.Entities;

public class Payment : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public PaymentMethod Method { get; set; } // Dinheiro, Cartão ou Pix na entrega
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public decimal? ChangeFor { get; set; }    // Se dinheiro: troco para quanto o cliente precisa
    public DateTime? PaidAt { get; set; }     // Registrado quando o entregador confirma o recebimento
}

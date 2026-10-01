namespace Salgados.Core.Enums;

public enum OrderStatus
{
    Received = 1,       // Pedido recebido
    InPreparation = 2,  // Em preparação
    Ready = 3,          // Pronto
    OutForDelivery = 4, // Saiu para entrega (entregador a caminho)
    Delivered = 5,      // Entregue
    Cancelled = 6       // Cancelado
}

namespace Salgados.Core.Enums;

public enum StockMovementType
{
    Inflow = 1,       // Entrada de estoque
    Outflow = 2,      // Saída (venda/consumo)
    Adjustment = 3,   // Ajuste manual de inventário
    Cancellation = 4  // Devolução por cancelamento de pedido
}

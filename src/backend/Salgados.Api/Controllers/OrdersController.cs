using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Salgados.Api.Common;
using Salgados.Api.DTOs.Orders;
using Salgados.Api.Services;

namespace Salgados.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Retorna todos os pedidos. Requer papel de administrador.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<List<OrderResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _orderService.GetAllAsync();
        return Ok(ApiResponse<List<OrderResponse>>.Ok(orders, "Pedidos obtidos com sucesso."));
    }

    /// <summary>
    /// Retorna um pedido pelo ID. Requer papel de administrador.
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<OrderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        return Ok(ApiResponse<OrderResponse>.Ok(order, "Pedido obtido com sucesso."));
    }

    /// <summary>
    /// Cria um novo pedido (público — clientes podem fazer pedidos sem login).
    /// </summary>
    [HttpPost]
    [EnableRateLimiting("public-orders")]
    [ProducesResponseType(typeof(ApiResponse<OrderResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var order = await _orderService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = order.Id },
            ApiResponse<OrderResponse>.Ok(order, "Pedido criado com sucesso."));
    }

    /// <summary>
    /// Atualiza o status de um pedido. Requer papel de administrador.
    /// </summary>
    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<OrderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _orderService.UpdateStatusAsync(id, request);
        return Ok(ApiResponse<OrderResponse>.Ok(order, "Status do pedido atualizado com sucesso."));
    }
}

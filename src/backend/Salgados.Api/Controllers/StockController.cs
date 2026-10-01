using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Salgados.Api.Common;
using Salgados.Api.DTOs.Stock;
using Salgados.Api.Services;

namespace Salgados.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class StockController : ControllerBase
{
    private readonly IStockService _stockService;

    public StockController(IStockService stockService)
    {
        _stockService = stockService;
    }

    /// <summary>
    /// Retorna o estoque atual de todos os produtos com as últimas movimentações.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<StockResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStock()
    {
        var stock = await _stockService.GetStockAsync();
        return Ok(ApiResponse<List<StockResponse>>.Ok(stock, "Estoque obtido com sucesso."));
    }

    /// <summary>
    /// Registra uma movimentação manual de estoque (entrada, saída ou ajuste).
    /// </summary>
    [HttpPost("movement")]
    [ProducesResponseType(typeof(ApiResponse<StockMovementResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterMovement([FromBody] StockMovementRequest request)
    {
        var movement = await _stockService.RegisterMovementAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<StockMovementResponse>.Ok(movement, "Movimentação de estoque registrada com sucesso."));
    }
}

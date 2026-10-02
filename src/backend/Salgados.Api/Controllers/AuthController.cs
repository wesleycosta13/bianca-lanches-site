using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Salgados.Api.Common;
using Salgados.Api.DTOs.Auth;
using Salgados.Api.Services;

namespace Salgados.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Registra um novo administrador no sistema.
    /// </summary>
    [HttpPost("register")]
    [EnableRateLimiting("authentication")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<AuthResponse>.Ok(response, "Usuário registrado com sucesso."));
    }

    /// <summary>
    /// Autentica o administrador do sistema e retorna o Token JWT.
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("authentication")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status423Locked)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString();
        var response = await _authService.LoginAsync(request, ipAddress);
        return Ok(ApiResponse<AuthResponse>.Ok(response, "Login realizado com sucesso."));
    }

    [HttpGet("blocked-logins")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<List<BlockedLoginResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBlockedLogins()
    {
        var blockedLogins = await _authService.GetBlockedLoginsAsync();
        return Ok(ApiResponse<List<BlockedLoginResponse>>.Ok(blockedLogins));
    }

    [HttpDelete("blocked-logins")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnblockLogin([FromQuery] string email)
    {
        await _authService.UnblockLoginAsync(email);
        return Ok(ApiResponse.Ok("Acesso liberado com sucesso."));
    }

    /// <summary>
    /// Retorna os dados do administrador atualmente autenticado.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var name = User.FindFirstValue(ClaimTypes.Name);
        var email = User.FindFirstValue(ClaimTypes.Email);
        var role = User.FindFirstValue(ClaimTypes.Role);

        return Ok(ApiResponse<object>.Ok(new
        {
            Id = id,
            Name = name,
            Email = email,
            Role = role
        }, "Usuário autenticado obtido com sucesso."));
    }
}

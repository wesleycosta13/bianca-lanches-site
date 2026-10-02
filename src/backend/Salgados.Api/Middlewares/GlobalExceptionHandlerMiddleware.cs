using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Salgados.Api.Common;
using Salgados.Api.Services;

namespace Salgados.Api.Middlewares;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate _next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        this._next = _next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exceção não tratada na requisição: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = exception switch
        {
            KeyNotFoundException => HttpStatusCode.NotFound,
            LoginLockedException => HttpStatusCode.Locked,
            DbUpdateConcurrencyException => HttpStatusCode.Conflict,
            ArgumentException or InvalidOperationException => HttpStatusCode.BadRequest,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            _ => HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = (int)statusCode;

        var message = statusCode switch
        {
            HttpStatusCode.InternalServerError => "Ocorreu um erro interno no servidor. Tente novamente mais tarde.",
            HttpStatusCode.Conflict => "O estoque foi atualizado por outro pedido. Atualize o cardápio e tente novamente.",
            _ => exception.Message
        };

        var response = ApiResponse.Fail(message);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return context.Response.WriteAsync(json);
    }
}

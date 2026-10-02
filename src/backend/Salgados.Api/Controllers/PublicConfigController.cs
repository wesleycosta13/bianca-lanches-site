using Microsoft.AspNetCore.Mvc;
using Salgados.Api.Common;
using Salgados.Api.DTOs.Config;

namespace Salgados.Api.Controllers;

[ApiController]
[Route("api/config")]
public class PublicConfigController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public PublicConfigController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("whatsapp-contact")]
    [ProducesResponseType(typeof(ApiResponse<WhatsAppContactResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult GetWhatsAppContact()
    {
        var phoneNumber = _configuration["WHATSAPP_CONTATO"];
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return NoContent();

        var digitsOnlyPhoneNumber = new string(phoneNumber.Where(char.IsDigit).ToArray());
        if (digitsOnlyPhoneNumber.Length == 0)
            return NoContent();

        Response.Headers.CacheControl = "no-store";
        var response = new WhatsAppContactResponse { PhoneNumber = digitsOnlyPhoneNumber };
        return Ok(ApiResponse<WhatsAppContactResponse>.Ok(response));
    }
}

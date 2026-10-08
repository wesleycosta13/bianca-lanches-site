using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Salgados.Api.Common;
using Salgados.Api.DTOs.Config;
using Salgados.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Salgados.Api.Controllers;

[ApiController]
[Route("api/config")]
public class PublicConfigController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;

    public PublicConfigController(IConfiguration configuration, AppDbContext context)
    {
        _configuration = configuration;
        _context = context;
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

    [HttpGet("hero-image")]
    [ProducesResponseType(typeof(ApiResponse<HeroImageConfigResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHeroImage(CancellationToken cancellationToken)
    {
        var setting = await _context.StoreSettings.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == 1, cancellationToken);
        var response = new HeroImageConfigResponse
        {
            ImageUrl = setting?.HeroImageUrl ?? "https://i.pinimg.com/736x/7d/ac/8b/7dac8bdfec19eecf52b3e237165a753e.jpg"
        };

        Response.Headers.CacheControl = "no-store";
        return Ok(ApiResponse<HeroImageConfigResponse>.Ok(response));
    }

    [HttpPut("hero-image")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<HeroImageConfigResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateHeroImage(
        [FromBody] UpdateHeroImageRequest request,
        CancellationToken cancellationToken)
    {
        var imageUrl = request.ImageUrl.Trim();
        if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var imageUri)
            || imageUri.Scheme != Uri.UriSchemeHttps)
        {
            return BadRequest(ApiResponse.Fail("Informe uma URL HTTPS válida para a imagem."));
        }

        var setting = await _context.StoreSettings.SingleOrDefaultAsync(item => item.Id == 1, cancellationToken);
        if (setting is null)
        {
            setting = new Salgados.Core.Entities.StoreSetting { Id = 1 };
            _context.StoreSettings.Add(setting);
        }

        setting.HeroImageUrl = imageUrl;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<HeroImageConfigResponse>.Ok(
            new HeroImageConfigResponse { ImageUrl = setting.HeroImageUrl },
            "Imagem principal atualizada com sucesso."));
    }
}

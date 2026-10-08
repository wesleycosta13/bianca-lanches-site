using System.ComponentModel.DataAnnotations;

namespace Salgados.Api.DTOs.Config;

public class UpdateHeroImageRequest
{
    [Required]
    [MaxLength(2048)]
    public string ImageUrl { get; set; } = string.Empty;
}

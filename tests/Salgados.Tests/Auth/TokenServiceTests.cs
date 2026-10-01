using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Salgados.Api.Services;
using Salgados.Core.Entities;
using Salgados.Core.Enums;
using Xunit;

namespace Salgados.Tests.Auth;

public class TokenServiceTests
{
    private readonly TokenService _tokenService;

    public TokenServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Secret", "UmaChaveSuperSecretaComMaisDeTrintaEDoisCaracteres2026!" },
            { "Jwt:Issuer", "SalgadosApi" },
            { "Jwt:Audience", "SalgadosApp" },
            { "Jwt:ExpiresInHours", "8" }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _tokenService = new TokenService(configuration);
    }

    [Fact]
    public void GenerateToken_ShouldReturnValidJwtToken_WhenUserProvided()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Name = "Administrador",
            Email = "admin@lanchonete.com",
            Role = UserRole.Admin
        };

        // Act
        var (token, expiresAt) = _tokenService.GenerateToken(user);

        // Assert
        token.Should().NotBeNullOrWhiteSpace();
        expiresAt.Should().BeAfter(DateTime.UtcNow);

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        jwtToken.Issuer.Should().Be("SalgadosApi");
        jwtToken.Audiences.Should().Contain("SalgadosApp");
        jwtToken.Claims.Should().Contain(c => (c.Type == "role" || c.Type == ClaimTypes.Role) && c.Value == "Admin");
        jwtToken.Claims.Should().Contain(c => (c.Type == "email" || c.Type == ClaimTypes.Email) && c.Value == "admin@lanchonete.com");
    }
}

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Salgados.Api.DTOs.Auth;
using Salgados.Api.Services;
using Salgados.Core.Entities;
using Salgados.Core.Enums;
using Salgados.Infrastructure.Data;

namespace Salgados.Tests.Auth;

public class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_ShouldCreateCustomerWithHashedPassword()
    {
        await using var context = CreateContext();
        var tokenService = CreateTokenService();
        var service = new AuthService(context, tokenService.Object);

        var response = await service.RegisterAsync(new RegisterRequest
        {
            Name = "  Cliente Teste  ",
            Email = "  CLIENTE@example.com ",
            Password = "Strong-test-password"
        });

        var user = await context.Users.SingleAsync();
        response.Role.Should().Be(nameof(UserRole.Customer));
        response.Email.Should().Be("cliente@example.com");
        response.Name.Should().Be("Cliente Teste");
        user.Role.Should().Be(UserRole.Customer);
        user.PasswordHash.Should().NotBe("Strong-test-password");
        BCrypt.Net.BCrypt.Verify("Strong-test-password", user.PasswordHash).Should().BeTrue();
        response.Token.Should().Be("signed-token");
        tokenService.Verify(tokens => tokens.GenerateToken(It.Is<User>(registered => registered.Role == UserRole.Customer)), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_ShouldRejectDuplicateEmailIgnoringCaseAndWhitespace()
    {
        await using var context = CreateContext();
        context.Users.Add(new User
        {
            Name = "Existing Customer",
            Email = "customer@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("existing-password"),
            Role = UserRole.Customer
        });
        await context.SaveChangesAsync();

        var service = new AuthService(context, CreateTokenService().Object);
        var act = () => service.RegisterAsync(new RegisterRequest
        {
            Name = "Duplicate",
            Email = " CUSTOMER@example.com ",
            Password = "another-strong-password"
        });

        await act.Should().ThrowAsync<InvalidOperationException>();
        (await context.Users.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnSameUnauthorizedErrorForUnknownEmailAndWrongPassword()
    {
        await using var context = CreateContext();
        context.Users.Add(new User
        {
            Name = "Customer",
            Email = "customer@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Role = UserRole.Customer
        });
        await context.SaveChangesAsync();

        var tokenService = CreateTokenService();
        var service = new AuthService(context, tokenService.Object);

        var wrongPassword = () => service.LoginAsync(new LoginRequest
        {
            Email = "customer@example.com",
            Password = "incorrect-password"
        });
        var unknownEmail = () => service.LoginAsync(new LoginRequest
        {
            Email = "unknown@example.com",
            Password = "incorrect-password"
        });

        (await wrongPassword.Should().ThrowAsync<UnauthorizedAccessException>()).WithMessage("E-mail ou senha inválidos.");
        (await unknownEmail.Should().ThrowAsync<UnauthorizedAccessException>()).WithMessage("E-mail ou senha inválidos.");
        tokenService.Verify(tokens => tokens.GenerateToken(It.IsAny<User>()), Times.Never);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static Mock<ITokenService> CreateTokenService()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService
            .Setup(tokens => tokens.GenerateToken(It.IsAny<User>()))
            .Returns(("signed-token", DateTime.UtcNow.AddHours(1)));
        return tokenService;
    }
}
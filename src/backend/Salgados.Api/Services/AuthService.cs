using Microsoft.EntityFrameworkCore;
using Salgados.Api.DTOs.Auth;
using Salgados.Core.Entities;
using Salgados.Core.Enums;
using Salgados.Infrastructure.Data;

namespace Salgados.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<List<BlockedLoginResponse>> GetBlockedLoginsAsync();
    Task UnblockLoginAsync(string email);
}

public class AuthService : IAuthService
{
    private static readonly TimeSpan FailedAttemptWindow = TimeSpan.FromMinutes(15);
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthService(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var blockedLogin = await _context.BlockedLogins
            .FirstOrDefaultAsync(blocked => blocked.Email == normalizedEmail);
        if (blockedLogin is not null)
        {
            await RecordBlockedLoginAttemptAsync(normalizedEmail, ipAddress);
            throw new LoginLockedException();
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            if (await RecordFailedLoginAsync(normalizedEmail, ipAddress))
                throw new LoginLockedException();
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");
        }

        var unclearedAttempts = await _context.LoginAttempts
            .Where(attempt => attempt.Email == normalizedEmail
                && attempt.ClearedAt == null
                && attempt.AttemptedAt >= DateTime.UtcNow - FailedAttemptWindow)
            .ToListAsync();
        foreach (var attempt in unclearedAttempts)
            attempt.ClearedAt = DateTime.UtcNow;
        if (unclearedAttempts.Count > 0)
            await _context.SaveChangesAsync();

        var (token, expiresAt) = _tokenService.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            ExpiresAt = expiresAt
        };
    }

    public async Task<List<BlockedLoginResponse>> GetBlockedLoginsAsync()
    {
        var blockedLogins = await _context.BlockedLogins
            .OrderByDescending(blocked => blocked.BlockedAt)
            .ToListAsync();
        var responses = new List<BlockedLoginResponse>(blockedLogins.Count);

        foreach (var blockedLogin in blockedLogins)
        {
            var ipAddresses = await _context.LoginAttempts
                .Where(attempt => attempt.Email == blockedLogin.Email
                    && attempt.AttemptedAt >= blockedLogin.BlockedAt - FailedAttemptWindow)
                .Select(attempt => attempt.IpAddress)
                .Distinct()
                .ToListAsync();

            responses.Add(new BlockedLoginResponse
            {
                Email = blockedLogin.Email,
                BlockedAt = blockedLogin.BlockedAt,
                FailedAttempts = blockedLogin.FailedAttempts,
                IpAddresses = ipAddresses.OfType<string>().ToList()
            });
        }

        return responses;
    }

    public async Task UnblockLoginAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var blockedLogin = await _context.BlockedLogins
            .FirstOrDefaultAsync(blocked => blocked.Email == normalizedEmail);
        if (blockedLogin is null)
            throw new KeyNotFoundException("Não existe bloqueio para este e-mail.");

        _context.BlockedLogins.Remove(blockedLogin);

        var unclearedAttempts = await _context.LoginAttempts
            .Where(attempt => attempt.Email == normalizedEmail && attempt.ClearedAt == null)
            .ToListAsync();
        foreach (var attempt in unclearedAttempts)
            attempt.ClearedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    private async Task<bool> RecordFailedLoginAsync(string email, string? ipAddress)
    {
        var now = DateTime.UtcNow;
        _context.LoginAttempts.Add(new LoginAttempt
        {
            Email = email,
            IpAddress = ipAddress,
            AttemptedAt = now
        });
        await _context.SaveChangesAsync();

        if (_context.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL")
        {
            await _context.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "BlockedLogins" ("Email", "BlockedAt", "FailedAttempts", "CreatedAt")
                SELECT {email}, {now}, COUNT(*), {now}
                FROM "LoginAttempts"
                WHERE "Email" = {email}
                    AND "ClearedAt" IS NULL
                    AND "AttemptedAt" >= {now - FailedAttemptWindow}
                HAVING COUNT(*) >= {LoginLockedException.AttemptLimit}
                ON CONFLICT ("Email") DO NOTHING;
                """);

            return await _context.BlockedLogins.AnyAsync(blocked => blocked.Email == email);
        }

        var recentFailedAttempts = await _context.LoginAttempts
            .CountAsync(attempt => attempt.Email == email
                && attempt.ClearedAt == null
                && attempt.AttemptedAt >= now - FailedAttemptWindow);

        if (recentFailedAttempts < LoginLockedException.AttemptLimit)
            return false;

        var blockedLogin = await _context.BlockedLogins
            .FirstOrDefaultAsync(blocked => blocked.Email == email);
        if (blockedLogin is not null)
            return true;

        _context.BlockedLogins.Add(new BlockedLogin
        {
            Email = email,
            BlockedAt = now,
            FailedAttempts = recentFailedAttempts,
            CreatedAt = now
        });
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task RecordBlockedLoginAttemptAsync(string email, string? ipAddress)
    {
        _context.LoginAttempts.Add(new LoginAttempt
        {
            Email = email,
            IpAddress = ipAddress,
            AttemptedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var emailTaken = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());

        if (emailTaken)
            throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Customer,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var (token, expiresAt) = _tokenService.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            ExpiresAt = expiresAt
        };
    }
}

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
    Task<List<LoginAttemptResponse>> GetLoginAttemptsAsync();
    Task<LoginAttemptResponse> UpdateLoginAttemptAsync(int id, int numberOfAt);
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
            await RecordAttemptAsync(normalizedEmail, ipAddress, DateTime.UtcNow);
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

        // Login com sucesso: reseta as tentativas ativas deste IP e e-mail
        var attemptsToClear = await _context.LoginAttempts
            .Where(attempt => (attempt.Email == normalizedEmail || (!string.IsNullOrWhiteSpace(ipAddress) && attempt.IpAddress == ipAddress))
                && attempt.ClearedAt == null)
            .ToListAsync();

        foreach (var attempt in attemptsToClear)
        {
            attempt.NumberOfAt = 0;
            attempt.ClearedAt = DateTime.UtcNow;
        }
        if (attemptsToClear.Count > 0)
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
                .Where(attempt => attempt.Email == blockedLogin.Email)
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

        var attempts = await _context.LoginAttempts
            .Where(attempt => attempt.Email == normalizedEmail)
            .ToListAsync();
        foreach (var attempt in attempts)
        {
            attempt.NumberOfAt = 0;
            attempt.ClearedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<LoginAttemptResponse>> GetLoginAttemptsAsync()
    {
        return await _context.LoginAttempts
            .OrderByDescending(attempt => attempt.AttemptedAt)
            .Select(attempt => new LoginAttemptResponse
            {
                Id = attempt.Id,
                Email = attempt.Email,
                IpAddress = attempt.IpAddress,
                NumberOfAt = attempt.NumberOfAt,
                AttemptedAt = attempt.AttemptedAt,
                ClearedAt = attempt.ClearedAt
            })
            .ToListAsync();
    }

    public async Task<LoginAttemptResponse> UpdateLoginAttemptAsync(int id, int numberOfAt)
    {
        var attempt = await _context.LoginAttempts.FindAsync(id);
        if (attempt is null)
            throw new KeyNotFoundException("Tentativa de login não encontrada.");

        attempt.NumberOfAt = Math.Max(0, numberOfAt);
        if (attempt.NumberOfAt == 0)
        {
            attempt.ClearedAt = DateTime.UtcNow;
        }
        else
        {
            attempt.ClearedAt = null;
        }

        await _context.SaveChangesAsync();

        return new LoginAttemptResponse
        {
            Id = attempt.Id,
            Email = attempt.Email,
            IpAddress = attempt.IpAddress,
            NumberOfAt = attempt.NumberOfAt,
            AttemptedAt = attempt.AttemptedAt,
            ClearedAt = attempt.ClearedAt
        };
    }

    private async Task<LoginAttempt> RecordAttemptAsync(string email, string? ipAddress, DateTime now)
    {
        LoginAttempt? attempt = null;
        if (!string.IsNullOrWhiteSpace(ipAddress))
        {
            attempt = await _context.LoginAttempts
                .FirstOrDefaultAsync(a => a.IpAddress == ipAddress);
        }
        else
        {
            attempt = await _context.LoginAttempts
                .FirstOrDefaultAsync(a => a.Email == email);
        }

        if (attempt is not null)
        {
            attempt.Email = email;
            attempt.NumberOfAt += 1;
            attempt.AttemptedAt = now;
            attempt.ClearedAt = null;
        }
        else
        {
            attempt = new LoginAttempt
            {
                Email = email,
                IpAddress = ipAddress,
                AttemptedAt = now,
                NumberOfAt = 1,
                ClearedAt = null
            };
            _context.LoginAttempts.Add(attempt);
        }

        await _context.SaveChangesAsync();
        return attempt;
    }

    private async Task<bool> RecordFailedLoginAsync(string email, string? ipAddress)
    {
        var now = DateTime.UtcNow;
        var attempt = await RecordAttemptAsync(email, ipAddress, now);

        // Se o número de tentativas deste IP atingiu o limite (5), bloqueia imediatamente
        if (attempt.NumberOfAt >= LoginLockedException.AttemptLimit)
        {
            var blockedLogin = await _context.BlockedLogins
                .FirstOrDefaultAsync(blocked => blocked.Email == email);
            if (blockedLogin is null)
            {
                _context.BlockedLogins.Add(new BlockedLogin
                {
                    Email = email,
                    BlockedAt = now,
                    FailedAttempts = attempt.NumberOfAt,
                    CreatedAt = now
                });
                await _context.SaveChangesAsync();
            }
            return true;
        }

        return false;
    }

    private async Task RecordBlockedLoginAttemptAsync(string email, string? ipAddress)
    {
        await RecordAttemptAsync(email, ipAddress, DateTime.UtcNow);
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

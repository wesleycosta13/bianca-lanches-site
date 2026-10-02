namespace Salgados.Api.DTOs.Auth;

public class BlockedLoginResponse
{
    public string Email { get; set; } = string.Empty;
    public DateTime BlockedAt { get; set; }
    public int FailedAttempts { get; set; }
    public List<string> IpAddresses { get; set; } = [];
}

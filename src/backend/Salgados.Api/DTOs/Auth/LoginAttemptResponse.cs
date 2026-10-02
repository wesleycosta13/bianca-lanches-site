namespace Salgados.Api.DTOs.Auth;

public class LoginAttemptResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public int NumberOfAt { get; set; }
    public DateTime AttemptedAt { get; set; }
    public DateTime? ClearedAt { get; set; }
}

public class UpdateLoginAttemptRequest
{
    public int NumberOfAt { get; set; }
}

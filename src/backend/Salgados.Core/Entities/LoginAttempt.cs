namespace Salgados.Core.Entities;

public class LoginAttempt : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public DateTime AttemptedAt { get; set; }
    public DateTime? ClearedAt { get; set; }
}

namespace Salgados.Core.Entities;

public class BlockedLogin : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public DateTime BlockedAt { get; set; }
    public int FailedAttempts { get; set; }
}

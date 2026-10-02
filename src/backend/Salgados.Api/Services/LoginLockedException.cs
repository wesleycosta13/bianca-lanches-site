namespace Salgados.Api.Services;

public class LoginLockedException : UnauthorizedAccessException
{
    public const int AttemptLimit = 5;

    public LoginLockedException()
        : base($"Este e-mail foi bloqueado após {AttemptLimit} tentativas inválidas. Solicite a liberação a um administrador.")
    {
    }
}

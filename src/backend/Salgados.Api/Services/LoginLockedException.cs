namespace Salgados.Api.Services;

public class LoginLockedException : UnauthorizedAccessException
{
    public const int AttemptLimit = 5;

    public LoginLockedException()
        : base($"O acesso foi limitado após {AttemptLimit} tentativas inválidas. Aguarde 15 minutos antes de tentar novamente.")
    {
    }
}

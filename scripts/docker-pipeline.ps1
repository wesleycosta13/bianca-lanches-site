# ==============================================================================
# Script de Execucao Local da Pipeline Docker -- Bianca Lanches
# ==============================================================================
[CmdletBinding()]
param(
    [switch]$SkipUnitTests,
    [switch]$SkipE2E,
    [string]$Grep = "",
    [string]$Project = ""
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host "[PIPELINE] $Message" -ForegroundColor Cyan
    Write-Host "====================================================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

$RootDir = Resolve-Path "$PSScriptRoot\.."
Set-Location $RootDir

# 1. Verificar Docker
Write-Step "1/4: Verificando disponibilidade do Docker Daemon"
try {
    docker info > $null 2>&1
    Write-Success "Docker Daemon esta em execucao."
} catch {
    Write-Failure "Docker nao esta respondendo. Certifique-se de que o Docker Desktop esta aberto."
    exit 1
}

# 2. Validar configuracao do Docker Compose
Write-Step "2/4: Validando arquivos Docker e Compose"
docker compose --profile e2e config > $null
if ($LASTEXITCODE -ne 0) {
    Write-Failure "Erro na validacao do docker-compose.yml."
    exit 1
}
Write-Success "docker-compose.yml validado com sucesso."

# 3. Testes Unitarios do Backend
if (-not $SkipUnitTests) {
    Write-Step "3/4: Executando Testes Unitarios (.NET 8)"
    dotnet test Salgados.sln --configuration Release
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Falha nos testes unitarios do backend."
        exit 1
    }
    Write-Success "Todos os testes unitarios passaram com sucesso."
} else {
    Write-Host "[SKIP] Etapa de testes unitarios ignorada (-SkipUnitTests)." -ForegroundColor Yellow
}

# 4. Testes E2E no Docker Compose
if (-not $SkipE2E) {
    Write-Step "4/4: Executando Testes End-to-End no Docker Compose"
    
    if ($Grep -ne "" -or $Project -ne "") {
        Write-Host "[INFO] Executando teste direcionado com container isolado..." -ForegroundColor Yellow
        $customArgs = @("compose", "run", "--build", "--rm", "e2e", "npx", "playwright", "test")
        if ($Grep -ne "") { $customArgs += @("--grep", $Grep) }
        if ($Project -ne "") { $customArgs += @("--project", $Project) }
        docker @customArgs
    } else {
        $e2eCmd = @("compose", "--profile", "e2e", "up", "--build", "--abort-on-container-exit", "--exit-code-from", "e2e")
        docker @e2eCmd
    }

    $e2eExitCode = $LASTEXITCODE

    if ($e2eExitCode -eq 0) {
        Write-Success "Todos os testes E2E no Docker passaram com sucesso!"
    } else {
        Write-Failure "Falha na execucao dos testes E2E. Verifique os relatorios em e2e/playwright-report/."
        exit $e2eExitCode
    }
} else {
    Write-Host "[SKIP] Etapa de testes E2E ignorada (-SkipE2E)." -ForegroundColor Yellow
}

Write-Step "Pipeline Docker finalizada com sucesso!"
Write-Host "Relatorio HTML disponivel em: e2e/playwright-report/ (execute 'cd e2e; npm run report' para abrir)" -ForegroundColor Green
Write-Host ""

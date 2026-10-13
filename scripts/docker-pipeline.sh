#!/usr/bin/env bash
# ==============================================================================
# Script de Execução Local da Pipeline Docker — Bianca Lanches (Bash/Linux/WSL)
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "===================================================================="
echo " 1/4: Verificando disponibilidade do Docker Daemon"
echo "===================================================================="
if ! docker info > /dev/null 2>&1; then
  echo " Docker não está em execução. Inicie o Docker antes de continuar."
  exit 1
fi
echo " Docker Daemon ativo."

echo "===================================================================="
echo " 2/4: Validando arquivos Docker e Compose"
echo "===================================================================="
docker compose --profile e2e config > /dev/null
echo " docker-compose.yml validado com sucesso."

echo "===================================================================="
echo " 3/4: Executando Testes Unitários (.NET 8)"
echo "===================================================================="
if command -v dotnet > /dev/null 2>&1; then
  dotnet test Salgados.sln --configuration Release
  echo " Testes unitários aprovados."
else
  echo " dotnet CLI não encontrado neste shell. Pulando testes unitários locais..."
fi

echo "===================================================================="
echo " 4/4: Executando Testes End-to-End no Docker Compose"
echo "===================================================================="
docker compose --profile e2e up --build --abort-on-container-exit --exit-code-from e2e

echo "===================================================================="
echo " Pipeline Docker finalizada com sucesso!"
echo "Relatório HTML disponível em: e2e/playwright-report/"
echo "===================================================================="

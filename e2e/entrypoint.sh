#!/usr/bin/env bash
set -e

# Configurações de espera para a aplicação estar pronta antes de rodar os testes
TARGET_URL="${WAIT_FOR_URL:-${API_BASE_URL:-http://127.0.0.1:8080/api}/products}"
MAX_RETRIES="${WAIT_MAX_RETRIES:-60}"
RETRY_INTERVAL="${WAIT_RETRY_INTERVAL:-2}"

if [ "${SKIP_WAIT:-false}" != "true" ]; then
  echo "=========================================================="
  echo " [E2E Docker] Aguardando aplicação ficar pronta..."
  echo "   Endpoint de verificação: $TARGET_URL"
  echo "=========================================================="

  retry=1
  until curl --fail --silent --output /dev/null "$TARGET_URL" > /dev/null 2>&1 || [ "$retry" -gt "$MAX_RETRIES" ]; do
    echo "  [Tentativa $retry/$MAX_RETRIES] Aplicação inicializando, aguardando ${RETRY_INTERVAL}s..."
    sleep "$RETRY_INTERVAL"
    retry=$((retry + 1))
  done

  if [ "$retry" -gt "$MAX_RETRIES" ]; then
    echo "AVISO: Tempo limite de espera atingido para $TARGET_URL."
    echo "   Prosseguindo com a execução para coletar diagnósticos do Playwright..."
  else
    echo "Aplicação pronta! Iniciando testes E2E..."
    echo "=========================================================="
  fi
fi

# Executa o comando passado para o container (padrão: CMD do Dockerfile)
exec "$@"

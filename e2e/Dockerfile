FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app/e2e

# Garante reutilização dos navegadores já embutidos na imagem oficial
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Instalação das dependências Node
COPY e2e/package.json e2e/package-lock.json ./
RUN npm ci

# Copia dos arquivos de configuração e suite de testes
COPY e2e/tsconfig.json e2e/playwright.config.ts ./
COPY e2e/src/ ./src/
COPY e2e/specs/ ./specs/

# Script de entrada (aguarda a aplicação e executa testes)
COPY e2e/entrypoint.sh ./
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

# Variáveis padrão na rede Docker Compose
ENV CI=true
ENV BASE_URL=http://127.0.0.1:8080/
ENV API_BASE_URL=http://127.0.0.1:8080/api

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npx", "playwright", "test"]

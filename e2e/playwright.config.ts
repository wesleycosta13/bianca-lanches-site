import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Carrega variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(import.meta.dirname, ".env") });

/**
 * Configuração do Playwright para testes E2E da Bianca Lanches.
 *
 * Pré-requisito: a aplicação deve estar rodando localmente ou via Docker Compose.
 * - Frontend: http://localhost:5173 (dev) ou http://localhost:8080 (Docker)
 * - API:      http://localhost:5173/api (proxy Vite) ou http://localhost:8080/api
 *
 * Para rodar contra Docker Compose, altere BASE_URL para http://localhost:8080.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "test-results",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },

  projects: [
    // Autenticação do admin — roda antes dos testes admin
    {
      name: "admin-setup",
      testMatch: /global\.setup\.ts/,
    },

    // Testes da vitrine (cliente)
    {
      name: "storefront-chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /storefront\/(?!mobile\.spec\.ts$).+\.spec\.ts$/,
    },
    {
      name: "storefront-mobile",
      use: { ...devices["iPhone 14"] },
      testMatch: /storefront\/mobile\.spec\.ts$/,
    },

    // Testes do painel admin (autenticado)
    {
      name: "admin-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./auth/admin.json",
      },
      dependencies: ["admin-setup"],
      testMatch: /admin\/.+\.spec\.ts/,
    },

    // Testes de segurança
    {
      name: "security-chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /security\/.+\.spec\.ts/,
    },
  ],
});

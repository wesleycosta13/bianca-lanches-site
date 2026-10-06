import { test, expect } from "@fixtures";

/**
 * @security
 * Testes E2E — Segurança e Controle de Acesso
 */
test.describe("Segurança — Controle de Acesso @security", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("deve bloquear acesso direto ao painel para usuários não autenticados", async ({ adminLoginPage, page }) => {
    await adminLoginPage.navigate();

    // Deve forçar exibição do formulário de autenticação restrita
    await adminLoginPage.expectLoginFormVisible();

    // Painel operacional não deve estar acessível
    await expect(page.locator(".admin-workspace")).not.toBeVisible();
    await expect(page.locator(".admin-tabs")).not.toBeVisible();
  });

  test("deve exibir mensagem de erro clara em tentativa de login com dados forjados", async ({ adminLoginPage }) => {
    await adminLoginPage.navigate();
    await adminLoginPage.login("ataque@exemplo.com", "' OR '1'='1");

    await adminLoginPage.expectErrorMessageVisible();
  });

  test("deve garantir sanitização e bloqueio de SQL injection simples no login", async ({ adminLoginPage, page }) => {
    await adminLoginPage.navigate();
    await adminLoginPage.login("admin'--", "qualquerSenha");

    await adminLoginPage.expectErrorMessageVisible();
    await expect(page.locator(".admin-shell")).not.toBeVisible();
  });
});

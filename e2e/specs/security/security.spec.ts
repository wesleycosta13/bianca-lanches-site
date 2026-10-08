import { test, expect } from "@fixtures";
import { ENV } from "@constants/env";

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

  test("deve impedir que e-mail de payload SQL inválido seja enviado pelo formulário", async ({ adminLoginPage, page }) => {
    let loginRequests = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/auth/login") && request.method() === "POST") loginRequests += 1;
    });
    await adminLoginPage.navigate();
    await adminLoginPage.emailInput.fill("admin'--");
    await adminLoginPage.passwordInput.fill("qualquerSenha");
    await adminLoginPage.submitButton.click();

    const emailIsValid = await adminLoginPage.emailInput.evaluate((input: HTMLInputElement) => input.validity.valid);
    expect(emailIsValid).toBe(false);
    expect(loginRequests).toBe(0);
    await expect(page.locator(".admin-shell")).not.toBeVisible();
  });

  test("deve rejeitar chamadas sem token para a API de pedidos", async ({ page }) => {
    const response = await page.request.get(new URL("/api/orders", ENV.BASE_URL).toString());

    expect(response.status()).toBe(401);
    const responseBody = await response.text();
    expect(responseBody).not.toContain("customerName");
    expect(responseBody).not.toContain("orderNumber");
  });

  test("deve tratar payload XSS no login como texto sem executar script", async ({ adminLoginPage, page }) => {
    let dialogOpened = false;
    page.on("dialog", async (dialog) => {
      dialogOpened = true;
      await dialog.dismiss();
    });
    await adminLoginPage.navigate();
    await adminLoginPage.login("xss@example.com", "<script>window.__xssExecuted=true</script>");

    await adminLoginPage.expectErrorMessageVisible();
    await expect.poll(() => page.evaluate(() => Boolean((window as Window & { __xssExecuted?: boolean }).__xssExecuted))).toBe(false);
    expect(dialogOpened).toBe(false);
  });
});

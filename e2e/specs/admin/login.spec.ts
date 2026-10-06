import { test } from "@fixtures";
import { UserDataFactory } from "@data/user.factory";

/**
 * @admin
 * Testes E2E — Login administrativo (Page Object Model)
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Admin — Login @admin", () => {
  test.beforeEach(async ({ adminLoginPage }) => {
    await adminLoginPage.navigate();
  });

  test("deve exibir página de login ao acessar /admin sem autenticação", async ({ adminLoginPage }) => {
    await adminLoginPage.expectLoginFormVisible();
  });

  test("deve exibir erro com credenciais inválidas", async ({ adminLoginPage }) => {
    const invalidCredentials = UserDataFactory.createInvalidCredentials();
    await adminLoginPage.login(invalidCredentials.email, invalidCredentials.password);
    await adminLoginPage.expectErrorMessageVisible();
  });

  test("deve ter link para voltar à loja", async ({ adminLoginPage }) => {
    await adminLoginPage.expectBackToStoreLink();
  });
});

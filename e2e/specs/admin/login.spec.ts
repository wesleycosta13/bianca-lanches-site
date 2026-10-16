import { test, expect } from "@fixtures";
import { ENV } from "@constants/env";
import { fakerPT_BR as faker } from "@faker-js/faker";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Admin — Login @admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("deve exibir página de login ao acessar /admin sem autenticação", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Acesso administrativo" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("deve exibir erro com credenciais inválidas", async ({ page }) => {
    await page.getByLabel("E-mail").fill(faker.internet.email().toLowerCase());
    await page.getByLabel("Senha").fill(faker.internet.password({ length: 14 }));
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.locator("[role='alert']")).toBeVisible({ timeout: 10_000 });
  });

  test("deve ter link para voltar à loja", async ({ page }) => {
    const link = page.getByRole("link", { name: /voltar para a loja/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/");
  });

  test("deve permitir login com credenciais válidas", async ({ page }) => {
    await page.getByLabel("E-mail").fill(ENV.ADMIN.EMAIL);
    await page.getByLabel("Senha").fill(ENV.ADMIN.PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.locator(".admin-workspace")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".admin-tabs")).toBeVisible();
  });
});

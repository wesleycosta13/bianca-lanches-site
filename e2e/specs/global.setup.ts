import { test as setup, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "path";
import { AdminLoginPage } from "@pages/admin-login.page";
import { ENV } from "@constants/env";

const ADMIN_AUTH_FILE = path.join(import.meta.dirname, "..", "auth", "admin.json");
const ADMIN_TOKEN_FILE = path.join(import.meta.dirname, "..", "auth", "admin-token.txt");

/**
 * Global Setup: autentica como administrador e persiste o estado de sessão
 * para reutilização transparente nos testes do painel administrativo.
 */
setup("autenticar como administrador", async ({ page }) => {
  const email = ENV.ADMIN.EMAIL;
  const password = ENV.ADMIN.PASSWORD;

  const adminLoginPage = new AdminLoginPage(page);
  await adminLoginPage.navigate();
  await adminLoginPage.login(email, password);

  await expect(adminLoginPage.dashboardHeading).toBeVisible({ timeout: 15_000 });
  const token = await page.evaluate(() => sessionStorage.getItem("admin-token"));
  expect(token).toBeTruthy();
  await mkdir(path.dirname(ADMIN_TOKEN_FILE), { recursive: true });
  await writeFile(ADMIN_TOKEN_FILE, token!, "utf8");
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});

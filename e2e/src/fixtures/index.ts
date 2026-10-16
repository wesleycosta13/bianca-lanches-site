import { test as baseTest, expect, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ADMIN_TOKEN_FILE = path.resolve(import.meta.dirname, "../../auth/admin-token.txt");

type AdminLoginPage = {
  emailInput: Locator;
  passwordInput: Locator;
  submitButton: Locator;
  navigate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  expectLoginFormVisible: () => Promise<void>;
  expectErrorMessageVisible: () => Promise<void>;
};

/**
 * Fixture customizada: injeta o token de admin no sessionStorage antes de cada teste.
 */
export const test = baseTest.extend<{ injectAdminToken: void; adminLoginPage: AdminLoginPage }>({
  injectAdminToken: [async ({ page }, use) => {
    const token = await readFile(ADMIN_TOKEN_FILE, "utf8");
    await page.addInitScript((adminToken) => {
      sessionStorage.setItem("admin-token", adminToken);
    }, token);  
    await use();
  }, { auto: false }],
  adminLoginPage: async ({ page }, use) => {
    const emailInput = page.getByLabel("E-mail");
    const passwordInput = page.getByLabel("Senha");
    const submitButton = page.getByRole("button", { name: "Entrar" });

    await use({
      emailInput,
      passwordInput,
      submitButton,
      navigate: async () => {
        await page.goto("/admin");
      },
      login: async (email, password) => {
        await emailInput.fill(email);
        await passwordInput.fill(password);
        await submitButton.click();
      },
      expectLoginFormVisible: async () => {
        await expect(page.getByRole("heading", { name: "Acesso administrativo" })).toBeVisible();
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();
      },
      expectErrorMessageVisible: async () => {
        await expect(page.locator("[role='alert']")).toBeVisible({ timeout: 10_000 });
      },
    });
  },
});

export { expect };

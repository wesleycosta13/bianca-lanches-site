import { test as baseTest, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ADMIN_TOKEN_FILE = path.resolve(import.meta.dirname, "../../auth/admin-token.txt");

/**
 * Fixture customizada: injeta o token de admin no sessionStorage antes de cada teste.
 */
export const test = baseTest.extend<{ injectAdminToken: void }>({
  injectAdminToken: [async ({ page }, use) => {
    const token = await readFile(ADMIN_TOKEN_FILE, "utf8");
    await page.addInitScript((adminToken) => {
      sessionStorage.setItem("admin-token", adminToken);
    }, token);  
    await use();
  }, { auto: false }],
});

export { expect };

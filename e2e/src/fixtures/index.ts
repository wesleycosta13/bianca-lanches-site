import { test as baseTest, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { CatalogPage } from "@pages/catalog.page";
import { AdminLoginPage } from "@pages/admin-login.page";
import { AdminDashboardPage } from "@pages/admin-dashboard.page";

const ADMIN_TOKEN_FILE = path.resolve(import.meta.dirname, "../../auth/admin-token.txt");

export interface CustomFixtures {
  catalogPage: CatalogPage;
  adminLoginPage: AdminLoginPage;
  adminDashboardPage: AdminDashboardPage;
}

export const test = baseTest.extend<CustomFixtures>({
  catalogPage: async ({ page }, use) => {
    const catalogPage = new CatalogPage(page);
    await use(catalogPage);
  },
  adminLoginPage: async ({ page }, use) => {
    const adminLoginPage = new AdminLoginPage(page);
    await use(adminLoginPage);
  },
  adminDashboardPage: async ({ page }, use) => {
    const token = await readFile(ADMIN_TOKEN_FILE, "utf8");
    await page.addInitScript((adminToken) => {
      sessionStorage.setItem("admin-token", adminToken);
    }, token);
    const adminDashboardPage = new AdminDashboardPage(page);
    await use(adminDashboardPage);
  },
});

export { expect };

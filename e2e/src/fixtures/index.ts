import { test as baseTest, expect } from "@playwright/test";
import { CatalogPage } from "@pages/catalog.page";
import { AdminLoginPage } from "@pages/admin-login.page";
import { AdminDashboardPage } from "@pages/admin-dashboard.page";

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
    const adminDashboardPage = new AdminDashboardPage(page);
    await use(adminDashboardPage);
  },
});

export { expect };

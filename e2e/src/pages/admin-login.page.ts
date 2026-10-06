import { expect, type Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { ROUTES } from "@constants/routes";

export class AdminLoginPage extends BasePage {
  readonly pageHeading = this.page.getByRole("heading", { name: "Acesso administrativo" });
  readonly emailInput = this.page.getByLabel("E-mail");
  readonly passwordInput = this.page.getByLabel("Senha");
  readonly submitButton = this.page.getByRole("button", { name: "Entrar" });
  readonly errorAlert = this.page.locator("[role='alert']");
  readonly backToStoreLink = this.page.getByRole("link", { name: /voltar para a loja/i });
  readonly dashboardHeading = this.page.getByRole("heading", { name: "Pedidos" });

  constructor(page: Page) {
    super(page);
  }

  get path(): string {
    return ROUTES.ADMIN;
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForDashboard(timeout = 15_000): Promise<void> {
    await this.dashboardHeading.waitFor({ state: "visible", timeout });
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectErrorMessageVisible(timeout = 10_000): Promise<void> {
    await expect(this.errorAlert).toBeVisible({ timeout });
  }

  async expectBackToStoreLink(): Promise<void> {
    await expect(this.backToStoreLink).toBeVisible();
    await expect(this.backToStoreLink).toHaveAttribute("href", "/");
  }
}

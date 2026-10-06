import type { Page } from "@playwright/test";
import { BaseComponent } from "./base.component";
import type { CustomerInfo } from "@models/checkout.model";

export class CheckoutModalComponent extends BaseComponent {
  readonly confirmationLines = this.root.locator(".confirmation-lines");
  readonly confirmationAddress = this.root.locator(".confirmation-address");
  readonly nameInput = this.root.getByLabel("Seu nome");
  readonly phoneInput = this.root.getByLabel("Telefone");
  readonly cityInput = this.root.getByLabel("Cidade");
  readonly confirmButton = this.root.getByRole("button", { name: /confirmar pedido/i });
  readonly errorAlert = this.root.locator("[role='alert']");
  readonly successMessage = this.root.locator(".order-confirm-success");
  readonly backToCatalogButton = this.root.getByRole("button", { name: /voltar ao cardápio/i });
  readonly closeButton = this.root.getByLabel("Fechar confirmação");

  constructor(page: Page) {
    super(page, page.locator(".order-confirmation"));
  }

  async fillCustomerInfo(customer: Partial<CustomerInfo>): Promise<void> {
    if (customer.name !== undefined) {
      await this.nameInput.fill(customer.name);
    }
    if (customer.phone !== undefined) {
      await this.phoneInput.fill(customer.phone);
    }
    if (customer.city !== undefined) {
      await this.cityInput.fill(customer.city);
    }
  }

  async confirmOrder(): Promise<void> {
    await this.confirmButton.click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async returnToCatalog(): Promise<void> {
    await this.backToCatalogButton.click();
  }

  async waitForSuccess(timeout = 15_000): Promise<void> {
    await this.successMessage.waitFor({ state: "visible", timeout });
  }
}

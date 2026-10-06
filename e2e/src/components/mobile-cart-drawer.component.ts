import type { Page } from "@playwright/test";
import { BaseComponent } from "./base.component";

export class MobileCartDrawerComponent extends BaseComponent {
  readonly openButton = this.page.locator(".mobile-cart-button");
  readonly sheet = this.root;
  readonly closeButton = this.root.getByLabel("Fechar sacola");
  readonly checkoutDetails = this.root.locator(".checkout-details");

  constructor(page: Page) {
    super(page, page.locator(".mobile-cart-sheet"));
  }

  async open(): Promise<void> {
    await this.openButton.click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }
}

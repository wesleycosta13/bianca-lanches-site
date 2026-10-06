import type { Locator, Page } from "@playwright/test";
import { BaseComponent } from "./base.component";

export class ProductCardComponent extends BaseComponent {
  readonly title = this.root.locator("h3");
  readonly description = this.root.locator("p");
  readonly startingPrice = this.root.locator(".starting-price");
  readonly addButton = this.root.getByRole("button", { name: /adicionar/i });
  readonly variantSelect = this.root.locator(".variant-select-label select");

  constructor(page: Page, root: Locator) {
    super(page, root);
  }

  async getTitleText(): Promise<string> {
    return (await this.title.textContent())?.trim() ?? "";
  }

  async addToCart(): Promise<void> {
    await this.addButton.click();
  }

  async selectVariantByText(text: string): Promise<void> {
    const option = this.variantSelect.locator("option").filter({ hasText: text }).first();
    const value = await option.getAttribute("value");
    if (value) {
      await this.variantSelect.selectOption(value);
    } else {
      await this.variantSelect.selectOption({ label: text });
    }
  }

  async getVariantOptionsCount(): Promise<number> {
    return this.variantSelect.locator("option").count();
  }
}

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
    const optionLabel = (await this.variantSelect.locator("option").allTextContents())
      .find((label) => label.trim().split("·")[0].trim() === text.trim());
    if (!optionLabel) throw new Error(`Não existe a variante "${text}" neste produto.`);
    await this.variantSelect.selectOption({ label: optionLabel.trim() });
  }

  async getVariantOptionsCount(): Promise<number> {
    return this.variantSelect.locator("option").count();
  }
}

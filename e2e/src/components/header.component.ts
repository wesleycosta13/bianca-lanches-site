import type { Page } from "@playwright/test";
import { BaseComponent } from "./base.component";

export class HeaderComponent extends BaseComponent {
  readonly brand = this.root.locator(".brand");

  constructor(page: Page) {
    super(page, page.locator("header"));
  }

  async getBrandText(): Promise<string> {
    return (await this.brand.textContent()) ?? "";
  }
}

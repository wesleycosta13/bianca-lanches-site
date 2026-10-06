import type { Locator, Page } from "@playwright/test";

export abstract class BaseComponent {
  constructor(
    protected readonly page: Page,
    public readonly root: Locator
  ) {}

  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  async waitForVisible(options?: { timeout?: number }): Promise<void> {
    await this.root.waitFor({ state: "visible", ...options });
  }

  async waitForHidden(options?: { timeout?: number }): Promise<void> {
    await this.root.waitFor({ state: "hidden", ...options });
  }
}

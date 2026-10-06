import type { Page, Response } from "@playwright/test";

export abstract class BasePage {
  constructor(public readonly page: Page) {}

  abstract get path(): string;

  async navigate(): Promise<Response | null> {
    return this.page.goto(this.path);
  }

  async waitForUrl(pattern: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForURL(pattern, options);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async reload(): Promise<Response | null> {
    return this.page.reload();
  }
}

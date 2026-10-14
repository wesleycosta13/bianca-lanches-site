import { test, expect } from "@playwright/test";

/**
 * @storefront
 * Testes E2E — Responsividade mobile (carrinho no drawer)
 */
test.describe("Vitrine — Carrinho Mobile @storefront", () => {
  // Estes testes rodam no projeto storefront-mobile (iPhone 14)

  test.beforeEach(async ({ page }) => {
    await page.goto("/#cardapio");
  });

  test("deve exibir botão flutuante da sacola no mobile", async ({ page }) => {
    const button = page.locator(".mobile-cart-button");
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.y + box!.height).toBeGreaterThan(viewport!.height - 100);
  });

  test("deve abrir drawer da sacola ao clicar no botão flutuante", async ({ page }) => {
    await page.locator(".mobile-cart-button").click();
    const sheet = page.locator(".mobile-cart-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText("Seu pedido");
  });

  test("deve fechar drawer da sacola ao clicar no X", async ({ page }) => {
    await page.locator(".mobile-cart-button").click();
    const sheet = page.locator(".mobile-cart-sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByLabel("Fechar sacola").click();
    await expect(sheet).not.toBeVisible();
  });

  test("deve abrir drawer automaticamente ao adicionar item no mobile", async ({ page }) => {
    await page.locator(".product-card").first().getByRole("button", { name: /adicionar/i }).click();
    await expect(page.locator(".mobile-cart-sheet")).toBeVisible();
  });

  test("deve exibir campos de checkout no drawer mobile quando tem itens", async ({ page }) => {
    await page.locator(".product-card").first().getByRole("button", { name: /adicionar/i }).click();
    await expect(page.locator(".mobile-cart-sheet .checkout-details")).toBeVisible();
  });

  test("deve fechar o drawer ao tocar no overlay sem esvaziar a sacola", async ({ page }) => {
    const openButton = page.locator(".mobile-cart-button");
    await page.locator(".product-card").filter({ hasText: "Carne" }).first()
      .getByRole("button", { name: /adicionar/i }).click();

    await expect(openButton).toHaveAttribute("aria-label", /1 itens/);
    await expect(page.locator(".mobile-cart-sheet")).toBeVisible();

    await page.locator(".mobile-cart-overlay").click({ position: { x: 10, y: 10 } });
    await expect(page.locator(".mobile-cart-sheet")).not.toBeVisible();

    await openButton.click();
    await expect(page.locator(".mobile-cart-sheet")).toContainText("Carne");
  });
});

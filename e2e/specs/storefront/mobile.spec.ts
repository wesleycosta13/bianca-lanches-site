import { test, expect } from "@fixtures";

/**
 * @storefront
 * Testes E2E — Responsividade mobile (carrinho no drawer)
 */
test.describe("Vitrine — Carrinho Mobile @storefront", () => {
  // Estes testes rodam no projeto storefront-mobile (iPhone 14)

  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
  });

  test("deve exibir botão flutuante da sacola no mobile", async ({ catalogPage }) => {
    await expect(catalogPage.mobileCart.openButton).toBeVisible();
    const button = await catalogPage.mobileCart.openButton.boundingBox();
    const viewport = catalogPage.page.viewportSize();
    expect(button).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(button!.y + button!.height).toBeGreaterThan(viewport!.height - 100);
  });

  test("deve abrir drawer da sacola ao clicar no botão flutuante", async ({ catalogPage }) => {
    const { mobileCart } = catalogPage;
    await mobileCart.open();

    await expect(mobileCart.sheet).toBeVisible();
    await expect(mobileCart.sheet).toContainText("Seu pedido");
  });

  test("deve fechar drawer da sacola ao clicar no X", async ({ catalogPage }) => {
    const { mobileCart } = catalogPage;
    await mobileCart.open();
    await expect(mobileCart.sheet).toBeVisible();

    await mobileCart.close();
    await expect(mobileCart.sheet).not.toBeVisible();
  });

  test("deve abrir drawer automaticamente ao adicionar item no mobile", async ({ catalogPage }) => {
    const { mobileCart } = catalogPage;
    await catalogPage.getFirstProductCard().addToCart();

    await expect(mobileCart.sheet).toBeVisible();
  });

  test("deve exibir campos de checkout no drawer mobile quando tem itens", async ({ catalogPage }) => {
    const { mobileCart } = catalogPage;
    await catalogPage.getFirstProductCard().addToCart();

    await expect(mobileCart.checkoutDetails).toBeVisible();
  });

  test("deve fechar o drawer ao tocar no overlay sem esvaziar a sacola", async ({ catalogPage }) => {
    const { mobileCart } = catalogPage;
    await catalogPage.getProductCard("Carne").addToCart();
    await expect(mobileCart.openButton).toHaveAttribute("aria-label", /1 itens/);
    await expect(mobileCart.sheet).toBeVisible();

    await catalogPage.page.locator(".mobile-cart-overlay").click({ position: { x: 10, y: 10 } });

    await expect(mobileCart.sheet).not.toBeVisible();
    await mobileCart.open();
    await expect(mobileCart.sheet).toContainText("Carne");
  });
});

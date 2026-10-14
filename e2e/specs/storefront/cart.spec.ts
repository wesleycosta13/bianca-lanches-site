import { test, expect } from "@playwright/test";

/**
 * Helper: adiciona um produto ao carrinho pelo nome.
 */
async function addToCart(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never, productName: string) {
  const card = page.locator(".product-card").filter({ hasText: productName }).first();
  await card.getByRole("button", { name: /adicionar/i }).click();
}

/**
 * Helper: seleciona uma variante de produto pelo texto (ex: "G").
 */
async function selectVariant(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never, productName: string, variantText: string) {
  const card = page.locator(".product-card").filter({ hasText: productName }).first();
  const select = card.locator(".variant-select-label select");
  const options = await select.locator("option").allTextContents();
  const match = options.find((label) => label.trim().split("·")[0].trim() === variantText.trim());
  if (!match) throw new Error(`Variante "${variantText}" não encontrada no produto "${productName}".`);
  await select.selectOption({ label: match.trim() });
}

/**
 * @storefront
 * Testes E2E — Carrinho de compras e painel de pedido
 */
test.describe("Vitrine — Carrinho de Compras @storefront", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#cardapio");
  });

  test("deve exibir sacola vazia inicialmente", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await expect(cartPanel.locator(".cart-empty")).toBeVisible();
    await expect(cartPanel).toContainText("Sua sacola está vazia");
    await expect(cartPanel.locator(".order-total strong")).toHaveText("R$ 0,00");
    await expect(cartPanel.locator(".checkout-details")).not.toBeVisible();
  });

  test("deve adicionar produto ao carrinho", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await addToCart(page, "Carne");

    await expect(cartPanel.locator(".cart-line")).toHaveCount(1);
    await expect(cartPanel).toContainText("Carne");
    await expect(cartPanel.locator(".cart-line").filter({ hasText: "Carne" }).locator(".quantity-control span")).toHaveText("1");
    await expect(cartPanel.locator(".order-total strong")).not.toHaveText("R$ 0,00");
  });

  test("deve incrementar quantidade ao adicionar mesmo produto novamente", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await addToCart(page, "Carne");
    await addToCart(page, "Carne");

    await expect(cartPanel.locator(".cart-line").filter({ hasText: "Carne" }).locator(".quantity-control span")).toContainText("2");
  });

  test("deve diminuir a quantidade do item no carrinho", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await addToCart(page, "Carne");
    await addToCart(page, "Carne");

    await cartPanel.getByLabel(/diminuir carne/i).click();

    await expect(cartPanel.locator(".cart-line").filter({ hasText: "Carne" }).locator(".quantity-control span")).toContainText("1");
    await expect(cartPanel.locator(".order-total strong")).toHaveText("R$ 3,00");
  });

  test("deve remover item do carrinho quando quantidade chegar a zero", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await addToCart(page, "Carne");
    await cartPanel.getByLabel(/diminuir carne/i).click();

    await expect(cartPanel.locator(".cart-empty")).toBeVisible();
  });

  test("deve calcular o total correto com múltiplos itens", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await selectVariant(page, "Carne", "G");
    await addToCart(page, "Carne");
    await addToCart(page, "Coxinha");

    await expect(cartPanel.locator(".cart-line")).toHaveCount(2);
    await expect(cartPanel.locator(".order-total strong")).toHaveText("R$ 18,50");
  });

  test("deve selecionar variante diferente antes de adicionar", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await selectVariant(page, "Carne", "G");
    await addToCart(page, "Carne");

    await expect(cartPanel.locator(".cart-line")).toContainText("G");
  });

  test("deve exibir campos de checkout quando carrinho tem itens", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await addToCart(page, "Carne");

    await expect(cartPanel.locator(".checkout-details")).toBeVisible();
    await expect(cartPanel.getByPlaceholder("Seu bairro")).toBeVisible();
    await expect(cartPanel.getByPlaceholder("Nome da rua")).toBeVisible();
  });
});

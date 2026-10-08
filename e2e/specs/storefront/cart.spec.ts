import { test, expect } from "@fixtures";

/**
 * @storefront
 * Testes E2E — Carrinho de compras e painel de pedido
 */
test.describe("Vitrine — Carrinho de Compras @storefront", () => {
  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
  });

  test("deve exibir sacola vazia inicialmente", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;
    await expect(cartPanel.emptyMessage).toBeVisible();
    await expect(cartPanel.root).toContainText("Sua sacola está vazia");
    await expect(cartPanel.totalPrice).toHaveText("R$ 0,00");
    await expect(cartPanel.checkoutDetails).not.toBeVisible();
  });

  test("deve adicionar produto ao carrinho", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;
    await catalogPage.getProductCard("Carne").addToCart();

    await expect(cartPanel.cartLines).toHaveCount(1);
    await expect(cartPanel.root).toContainText("Carne");
    await expect(cartPanel.getItemQuantityLocator("Carne")).toHaveText("1");
    await expect(cartPanel.totalPrice).not.toHaveText("R$ 0,00");
  });

  test("deve incrementar quantidade ao adicionar mesmo produto novamente", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;
    const productCard = catalogPage.getProductCard("Carne");

    await productCard.addToCart();
    await productCard.addToCart();

    await expect(cartPanel.getItemQuantityLocator("Carne")).toContainText("2");
  });

  test("deve diminuir a quantidade do item no carrinho", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;
    const productCard = catalogPage.getProductCard("Carne");

    await productCard.addToCart();
    await productCard.addToCart();

    await cartPanel.decreaseItem("carne");

    await expect(cartPanel.getItemQuantityLocator("Carne")).toContainText("1");
    await expect(cartPanel.totalPrice).toHaveText("R$ 3,00");
  });

  test("deve remover item do carrinho quando quantidade chegar a zero", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;
    await catalogPage.getProductCard("Carne").addToCart();

    await cartPanel.decreaseItem("carne");

    await expect(cartPanel.emptyMessage).toBeVisible();
  });

  test("deve calcular o total correto com múltiplos itens", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;

    await catalogPage.getProductCard("Carne").selectVariantByText("G");
    await catalogPage.getProductCard("Carne").addToCart();
    await catalogPage.getProductCard("Coxinha").addToCart();

    await expect(cartPanel.cartLines).toHaveCount(2);
    await expect(cartPanel.totalPrice).toHaveText("R$ 18,50");
  });

  test("deve selecionar variante diferente antes de adicionar", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;
    const productCard = catalogPage.getProductCard("Carne");

    await productCard.selectVariantByText("G");
    await productCard.addToCart();

    await expect(cartPanel.cartLines).toContainText("G");
  });

  test("deve exibir campos de checkout quando carrinho tem itens", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;
    await catalogPage.getProductCard("Carne").addToCart();

    await expect(cartPanel.checkoutDetails).toBeVisible();
    await expect(cartPanel.neighborhoodInput).toBeVisible();
    await expect(cartPanel.streetInput).toBeVisible();
  });
});

import { test, expect } from "@fixtures";

/**
 * @storefront
 * Testes E2E da vitrine pública — Catálogo e navegação
 */
test.describe("Vitrine — Catálogo e Navegação @storefront", () => {
  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.navigateToHome();
  });

  test("deve exibir o header com logo e nome da lanchonete", async ({ catalogPage }) => {
    await expect(catalogPage.header.brand).toBeVisible();
    await expect(catalogPage.header.brand).toContainText("BIANCA");
  });

  test("deve exibir a seção hero com CTA para cardápio", async ({ catalogPage }) => {
    await expect(catalogPage.heroHeading).toContainText("sabor");
    await expect(catalogPage.heroCta).toBeVisible();
  });

  test("deve navegar até o cardápio ao clicar no CTA", async ({ catalogPage }) => {
    await catalogPage.clickHeroCta();
    await expect(catalogPage.catalogSection).toBeInViewport();
  });

  test("deve exibir categorias no cardápio", async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
    await expect(catalogPage.categoryTabs.first()).toBeVisible();
    const tabCount = await catalogPage.categoryTabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(3);
  });

  test("deve filtrar produtos por categoria", async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
    await catalogPage.selectCategory("Bebidas");
    await expect(catalogPage.getCategorySection("Bebidas")).toBeInViewport();
  });

  test("deve buscar produtos no cardápio", async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
    await catalogPage.search("Coxinha");
    const coxinhaCard = catalogPage.getProductCard("Coxinha");
    await expect(coxinhaCard.root).toBeVisible();
  });

  test("deve exibir mensagem quando busca não encontrar resultados", async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
    await catalogPage.search("ProdutoQueNaoExiste12345");
    await expect(catalogPage.emptySearchResults).toBeVisible();
    await expect(catalogPage.emptySearchResults).toContainText("Nenhum item encontrado");
  });

  test("deve limpar a busca ao clicar no botão X", async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
    await catalogPage.search("Coxinha");
    await catalogPage.clearSearch();
    await expect(catalogPage.searchInput).toHaveValue("");
  });

  test("deve exibir cards de produtos com nome, descrição e preço", async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
    const firstCard = catalogPage.getFirstProductCard();
    await expect(firstCard.title).toBeVisible();
    await expect(firstCard.description).toBeVisible();
    await expect(firstCard.startingPrice).toBeVisible();
  });

  test("deve exibir variantes de tamanho nos produtos com múltiplas opções", async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
    const pastelCard = catalogPage.getProductCard("Carne");
    await expect(pastelCard.variantSelect).toBeVisible();
    const count = await pastelCard.getVariantOptionsCount();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

import { test, expect } from "@playwright/test";
import { fakerPT_BR as faker } from "@faker-js/faker";

/**
 * @storefront
 * Testes E2E da vitrine pública — Catálogo e navegação
 */
test.describe("Vitrine — Catálogo e Navegação @storefront", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("deve exibir o header com logo e nome da lanchonete", async ({ page }) => {
    const brand = page.locator("header .brand");
    await expect(brand).toBeVisible();
    await expect(brand).toContainText("BIANCA");
  });

  test("deve exibir a seção hero com CTA para cardápio", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("sabor");
    const cta = page.getByRole("link", { name: /ver cardápio/i });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
    await expect(page.locator("header .brand")).toBeVisible();
    const heroImage = page.locator(".hero-visual img");
    await expect(heroImage).toBeVisible();
    await expect(heroImage).toHaveJSProperty("complete", true);
    await expect.poll(() => heroImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  });

  test("deve navegar até o cardápio ao clicar no CTA", async ({ page }) => {
    await page.getByRole("link", { name: /ver cardápio/i }).click();
    await expect(page.locator("#cardapio")).toBeInViewport();
  });

  test("deve exibir categorias no cardápio", async ({ page }) => {
    await page.goto("/#cardapio");
    const tabs = page.locator(".category-tabs button");
    await expect(tabs.first()).toBeVisible();
    expect(await tabs.count()).toBeGreaterThanOrEqual(3);
  });

  test("deve filtrar produtos por categoria", async ({ page }) => {
    await page.goto("/#cardapio");
    await page.locator(".category-tabs button").filter({ hasText: "Bebidas" }).click();
    await expect(page.locator("#categoria-Bebidas")).toBeInViewport();
    await expect(page.locator("#categoria-Bebidas .product-card").first()).toBeVisible();
    await expect(page.locator(".category-section")).toHaveCount(1);

    await page.locator(".category-tabs button").filter({ hasText: "Todos" }).click();
    await expect(page.locator(".category-section").nth(1)).toBeVisible();
  });

  test("deve buscar produtos no cardápio", async ({ page }) => {
    await page.goto("/#cardapio");
    await page.getByPlaceholder("Buscar no cardápio").fill("Coxinha");
    await expect(page.locator(".product-card").filter({ hasText: "Coxinha" }).first()).toBeVisible();
  });

  test("deve exibir mensagem quando busca não encontrar resultados", async ({ page }) => {
    await page.goto("/#cardapio");
    await page.getByPlaceholder("Buscar no cardápio").fill(faker.word.noun() + "12345XYZ");
    const empty = page.locator(".empty-results");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("Nenhum item encontrado");
  });

  test("deve limpar a busca ao clicar no botão X", async ({ page }) => {
    await page.goto("/#cardapio");
    const searchInput = page.getByPlaceholder("Buscar no cardápio");
    await searchInput.fill("Coxinha");
    await page.getByLabel("Limpar busca").click();
    await expect(searchInput).toHaveValue("");
  });

  test("deve exibir cards de produtos com nome, descrição e preço", async ({ page }) => {
    await page.goto("/#cardapio");
    const firstCard = page.locator(".product-card").first();
    await expect(firstCard.locator("h3")).toBeVisible();
    await expect(firstCard.locator("p")).toBeVisible();
    await expect(firstCard.locator(".starting-price")).toBeVisible();
  });

  test("deve exibir variantes de tamanho nos produtos com múltiplas opções", async ({ page }) => {
    await page.goto("/#cardapio");
    const carneCard = page.locator(".product-card").filter({ hasText: "Carne" }).first();
    const variantSelect = carneCard.locator(".variant-select-label select");
    await expect(variantSelect).toBeVisible();

    const optionCount = await variantSelect.locator("option").count();
    expect(optionCount).toBeGreaterThanOrEqual(3);

    const options = await variantSelect.locator("option").allTextContents();
    const gOption = options.find((label) => label.trim().split("·")[0].trim() === "G");
    if (!gOption) throw new Error('Variante "G" não encontrada no produto Carne.');
    await variantSelect.selectOption({ label: gOption.trim() });
    await expect(variantSelect.locator("option:checked")).toContainText("G · R$ 6,00");
  });
});

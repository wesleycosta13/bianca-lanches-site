import { test, expect } from "@playwright/test";
import { fakerPT_BR as faker } from "@faker-js/faker";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ENV } from "@constants/env";

const ADMIN_TOKEN_FILE = path.resolve(import.meta.dirname, "../../auth/admin-token.txt");
const API_BASE_URL = ENV.API_BASE_URL.replace(/\/+$/, "");

// ── Helpers ────────────────────────────────────────────────────────────────────

type Page = Parameters<typeof test>[1] extends { page: infer P } ? P : never;

async function addToCart(page: Page, productName: string) {
  await page.locator(".product-card").filter({ hasText: productName }).first()
    .getByRole("button", { name: /adicionar/i }).click();
}

async function fillDeliveryAddress(page: Page, opts: { neighborhood?: string; street?: string; number?: string }) {
  const panel = page.locator(".order-panel");
  if (opts.neighborhood) await panel.getByPlaceholder("Seu bairro").fill(opts.neighborhood);
  if (opts.street) await panel.getByPlaceholder("Nome da rua").fill(opts.street);
  if (opts.number) await panel.getByPlaceholder("Número da residência").fill(opts.number);
}

async function selectPaymentMethod(page: Page, method: "Pix" | "Cartão" | "Dinheiro") {
  await page.locator(".order-panel .checkout-details select").selectOption(method);
}

async function fillCustomerInfo(page: Page, customer: { name?: string; phone?: string; city?: string }) {
  const modal = page.locator(".order-confirmation");
  if (customer.name) await modal.getByLabel("Seu nome").fill(customer.name);
  if (customer.phone) await modal.getByLabel("Telefone").fill(customer.phone);
  if (customer.city) await modal.getByLabel("Cidade").fill(customer.city);
}

async function prepareCartWithDelivery(page: Page) {
  await addToCart(page, "Carne");
  await fillDeliveryAddress(page, { neighborhood: "Centro", street: "Rua das Flores", number: "123" });
  await selectPaymentMethod(page, "Pix");
}

async function addCarneInventory(page: Page) {
  const token = await readFile(ADMIN_TOKEN_FILE, "utf8");
  const productsResponse = await page.request.get(`${API_BASE_URL}/products`);
  expect(productsResponse.ok(), "A API deve listar produtos para preparar o estoque do teste.").toBeTruthy();

  const productsResult = await productsResponse.json() as { data?: Array<{ id: number; name: string }> };
  const carne = productsResult.data?.find((p) => p.name.trim().toLocaleLowerCase("pt-BR") === "carne");
  if (!carne) throw new Error("O produto Carne não foi encontrado para preparar o checkout E2E.");

  const stockResponse = await page.request.post(`${API_BASE_URL}/stock/movement`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { productId: carne.id, type: 1, quantity: 10, reason: "Reposição de estoque para checkout E2E" },
  });
  expect(stockResponse.status(), await stockResponse.text()).toBe(201);
}

// ── Testes ─────────────────────────────────────────────────────────────────────

/**
 * @storefront
 * Testes E2E — Fluxo completo de pedido (checkout e confirmação)
 */
test.describe("Vitrine — Fluxo de Pedido @storefront", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#cardapio");
  });

  test("deve exibir botão 'Fechar pedido' somente após preencher campos obrigatórios", async ({ page }) => {
    const cartPanel = page.locator(".order-panel");
    await addToCart(page, "Carne");

    await expect(cartPanel.getByRole("button", { name: /fechar pedido/i })).not.toBeVisible();

    await fillDeliveryAddress(page, { neighborhood: "Centro", street: "Rua das Flores" });
    await expect(cartPanel.getByRole("button", { name: /fechar pedido/i })).not.toBeVisible();

    await selectPaymentMethod(page, "Pix");
    await expect(cartPanel.getByRole("button", { name: /fechar pedido/i })).toBeVisible();
  });

  test("deve abrir modal de confirmação ao clicar em 'Fechar pedido'", async ({ page }) => {
    await prepareCartWithDelivery(page);
    await page.locator(".order-panel").getByRole("button", { name: /fechar pedido/i }).click();

    const modal = page.locator(".order-confirmation");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Revise seu pedido");
  });

  test("deve exibir resumo correto dos itens no modal de confirmação", async ({ page }) => {
    await prepareCartWithDelivery(page);
    await page.locator(".order-panel").getByRole("button", { name: /fechar pedido/i }).click();

    const modal = page.locator(".order-confirmation");
    await expect(modal.locator(".confirmation-lines")).toContainText("Carne");
    await expect(modal.locator(".confirmation-address")).toContainText("Rua das Flores");
    await expect(modal.locator(".confirmation-address")).toContainText("Centro");
    await expect(modal.locator(".confirmation-address")).toContainText("123");
    await expect(modal.locator(".confirmation-address")).toContainText("Pix");
  });

  test("deve exibir erro ao tentar confirmar sem nome, telefone e cidade", async ({ page }) => {
    let orderRequests = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/orders") && request.method() === "POST") orderRequests += 1;
    });
    await prepareCartWithDelivery(page);
    await page.locator(".order-panel").getByRole("button", { name: /fechar pedido/i }).click();

    const modal = page.locator(".order-confirmation");
    await modal.getByRole("button", { name: /confirmar pedido/i }).click();

    await expect(modal.locator("[role='alert']")).toContainText("Preencha seu nome");
    expect(orderRequests).toBe(0);
  });

  test("deve enviar pedido com sucesso e exibir confirmação", async ({ page }) => {
    await addCarneInventory(page);
    await prepareCartWithDelivery(page);
    await page.locator(".order-panel").getByRole("button", { name: /fechar pedido/i }).click();

    await fillCustomerInfo(page, {
      name: faker.person.fullName(),
      phone: `869${faker.string.numeric(8)}`,
      city: faker.location.city(),
    });

    await page.route("**/api/orders", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      }
      await route.continue();
    });

    const modal = page.locator(".order-confirmation");
    await modal.getByRole("button", { name: /confirmar pedido/i }).click();

    await expect(modal.getByRole("button", { name: /confirmar pedido|enviando pedido/i })).toContainText("Enviando pedido...");
    await expect(modal.locator(".order-confirm-success")).toBeVisible({ timeout: 15_000 });
    await expect(modal).toContainText("Recebemos seu pedido");
    await expect(modal).toContainText(/PED-\d{8}-[A-F0-9]{6}/);
  });

  test("deve limpar carrinho após pedido confirmado com sucesso", async ({ page }) => {
    await addCarneInventory(page);
    await prepareCartWithDelivery(page);
    await page.locator(".order-panel").getByRole("button", { name: /fechar pedido/i }).click();

    await fillCustomerInfo(page, {
      name: faker.person.fullName(),
      phone: `869${faker.string.numeric(8)}`,
      city: faker.location.city(),
    });
    const modal = page.locator(".order-confirmation");
    await modal.getByRole("button", { name: /confirmar pedido/i }).click();
    await expect(modal.locator(".order-confirm-success")).toBeVisible({ timeout: 15_000 });
    await modal.getByRole("button", { name: /voltar ao cardápio/i }).click();

    await expect(page.locator(".order-panel .cart-empty")).toBeVisible();
  });

  test("deve fechar modal de confirmação ao clicar no X", async ({ page }) => {
    await prepareCartWithDelivery(page);
    await page.locator(".order-panel").getByRole("button", { name: /fechar pedido/i }).click();

    const modal = page.locator(".order-confirmation");
    await expect(modal).toBeVisible();
    await modal.getByLabel("Fechar confirmação").click();
    await expect(modal).not.toBeVisible();
  });
});

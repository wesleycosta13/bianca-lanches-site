import { test, expect } from "@fixtures";
import { CheckoutDataFactory } from "@data/checkout.factory";
import type { CatalogPage } from "@pages/catalog.page";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ENV } from "@constants/env";

const ADMIN_TOKEN_FILE = path.resolve(import.meta.dirname, "../../auth/admin-token.txt");
const API_BASE_URL = ENV.API_BASE_URL.replace(/\/+$/, "");

/**
 * @storefront
 * Testes E2E — Fluxo completo de pedido (checkout e confirmação)
 */
test.describe("Vitrine — Fluxo de Pedido @storefront", () => {
  const defaultAddress = CheckoutDataFactory.createDeliveryAddress({
    neighborhood: "Centro",
    street: "Rua das Flores",
    number: "123",
  });
  const defaultCustomer = CheckoutDataFactory.createCustomerInfo();

  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.navigateToCatalog();
  });

  async function prepareCartWithDelivery(catalogPage: CatalogPage) {
    await catalogPage.getProductCard("Carne").addToCart();
    await catalogPage.cartPanel.fillDeliveryAddress(defaultAddress);
    await catalogPage.cartPanel.selectPaymentMethod("Pix");
  }

  async function addCarneInventory(page: CatalogPage["page"]) {
    const token = await readFile(ADMIN_TOKEN_FILE, "utf8");
    const productsResponse = await page.request.get(`${API_BASE_URL}/products`);
    expect(productsResponse.ok(), "A API deve listar produtos para preparar o estoque do teste.").toBeTruthy();

    const productsResult = await productsResponse.json() as {
      data?: Array<{ id: number; name: string }>;
    };
    const carne = productsResult.data?.find((product) => product.name.trim().toLocaleLowerCase("pt-BR") === "carne");
    if (!carne) throw new Error("O produto Carne não foi encontrado para preparar o checkout E2E.");

    const stockResponse = await page.request.post(`${API_BASE_URL}/stock/movement`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        productId: carne.id,
        type: 1,
        quantity: 10,
        reason: "Reposição de estoque para checkout E2E",
      },
    });
    expect(stockResponse.status(), await stockResponse.text()).toBe(201);
  }

  test("deve exibir botão 'Fechar pedido' somente após preencher campos obrigatórios", async ({ catalogPage }) => {
    const { cartPanel } = catalogPage;
    await catalogPage.getProductCard("Carne").addToCart();

    // Botão não deve aparecer sem os campos
    await expect(cartPanel.checkoutButton).not.toBeVisible();

    // Preencher bairro e rua (ainda sem forma de pagamento)
    await cartPanel.fillDeliveryAddress({
      neighborhood: defaultAddress.neighborhood,
      street: defaultAddress.street,
    });
    await expect(cartPanel.checkoutButton).not.toBeVisible();

    // Selecionar pagamento
    await cartPanel.selectPaymentMethod("Pix");

    // Agora deve aparecer
    await expect(cartPanel.checkoutButton).toBeVisible();
  });

  test("deve abrir modal de confirmação ao clicar em 'Fechar pedido'", async ({ catalogPage }) => {
    const { cartPanel, checkoutModal } = catalogPage;
    await prepareCartWithDelivery(catalogPage);

    await cartPanel.proceedToCheckout();

    await expect(checkoutModal.root).toBeVisible();
    await expect(checkoutModal.root).toContainText("Revise seu pedido");
  });

  test("deve exibir resumo correto dos itens no modal de confirmação", async ({ catalogPage }) => {
    const { cartPanel, checkoutModal } = catalogPage;
    await prepareCartWithDelivery(catalogPage);

    await cartPanel.proceedToCheckout();

    await expect(checkoutModal.confirmationLines).toContainText("Carne");
    await expect(checkoutModal.confirmationAddress).toContainText(defaultAddress.street);
    await expect(checkoutModal.confirmationAddress).toContainText(defaultAddress.neighborhood);
    await expect(checkoutModal.confirmationAddress).toContainText(defaultAddress.number ?? "S/N");
    await expect(checkoutModal.confirmationAddress).toContainText("Pix");
  });

  test("deve exibir erro ao tentar confirmar sem nome, telefone e cidade", async ({ catalogPage }) => {
    const { cartPanel, checkoutModal } = catalogPage;
    let orderRequests = 0;
    catalogPage.page.on("request", (request) => {
      if (request.url().endsWith("/api/orders") && request.method() === "POST") orderRequests += 1;
    });
    await prepareCartWithDelivery(catalogPage);

    await cartPanel.proceedToCheckout();
    await checkoutModal.confirmOrder();

    await expect(checkoutModal.errorAlert).toContainText("Preencha seu nome");
    expect(orderRequests).toBe(0);
  });

  test("deve enviar pedido com sucesso e exibir confirmação", async ({ catalogPage }) => {
    const { cartPanel, checkoutModal } = catalogPage;
    await addCarneInventory(catalogPage.page);
    await prepareCartWithDelivery(catalogPage);

    await cartPanel.proceedToCheckout();
    await checkoutModal.fillCustomerInfo(defaultCustomer);
    await catalogPage.page.route("**/api/orders", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      }
      await route.continue();
    });
    await checkoutModal.confirmOrder();

    await expect(checkoutModal.confirmButton).toContainText("Enviando pedido...");
    await expect(checkoutModal.successMessage).toBeVisible({ timeout: 15_000 });
    await expect(checkoutModal.root).toContainText("Recebemos seu pedido");
    await expect(checkoutModal.root).toContainText(/PED-\d{8}-[A-F0-9]{6}/);
  });

  test("deve limpar carrinho após pedido confirmado com sucesso", async ({ catalogPage }) => {
    const { cartPanel, checkoutModal } = catalogPage;
    await addCarneInventory(catalogPage.page);
    await prepareCartWithDelivery(catalogPage);

    await cartPanel.proceedToCheckout();
    const anotherCustomer = CheckoutDataFactory.createCustomerInfo();
    await checkoutModal.fillCustomerInfo(anotherCustomer);
    await checkoutModal.confirmOrder();

    await expect(checkoutModal.successMessage).toBeVisible({ timeout: 15_000 });
    await checkoutModal.returnToCatalog();

    await expect(cartPanel.emptyMessage).toBeVisible();
  });

  test("deve fechar modal de confirmação ao clicar no X", async ({ catalogPage }) => {
    const { cartPanel, checkoutModal } = catalogPage;
    await prepareCartWithDelivery(catalogPage);

    await cartPanel.proceedToCheckout();
    await expect(checkoutModal.root).toBeVisible();

    await checkoutModal.close();
    await expect(checkoutModal.root).not.toBeVisible();
  });
});

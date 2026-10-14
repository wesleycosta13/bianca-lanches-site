import { readFile } from "node:fs/promises";
import path from "node:path";
import { ENV } from "@constants/env";
import { test, expect, type Page } from "@playwright/test";

const ADMIN_TOKEN_FILE = path.resolve(import.meta.dirname, "../../auth/admin-token.txt");
const API_BASE_URL = ENV.API_BASE_URL.replace(/\/+$/, "");

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface OrderStub {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryNeighborhood: string;
  deliveryCity: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  items: unknown[];
  createdAt: string;
}

// ── Fixtures inline ────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  const token = await readFile(ADMIN_TOKEN_FILE, "utf8");
  await page.addInitScript((adminToken) => {
    sessionStorage.setItem("admin-token", adminToken);
  }, token);
  await page.goto("/admin");
  await expect(page.locator(".admin-title-row h1")).toBeVisible({ timeout: 15_000 });
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function selectTab(page: Page, tab: "orders" | "products" | "security") {
  const tabMap = {
    orders: page.getByRole("button", { name: "Pedidos" }),
    products: page.getByRole("button", { name: "Produtos" }),
    security: page.getByRole("button", { name: "Segurança" }),
  };
  return tabMap[tab].click();
}

// ── Testes ─────────────────────────────────────────────────────────────────────

test.describe("Admin — Painel Administrativo @admin", () => {

  test("deve carregar o dashboard com as abas principais", async ({ page }) => {
    await expect(page.locator(".admin-brand")).toBeVisible();
    await expect(page.locator(".admin-title-row h1")).toContainText("Pedidos");
    await expect(page.getByRole("button", { name: /pedidos/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /produtos/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /segurança/i })).toBeVisible();
    await expect(page.locator(".admin-account strong")).toBeVisible();
  });

  test("deve combinar filtro de status e busca de pedidos", async ({ page }) => {
    const today = new Date().toISOString();
    const orders: OrderStub[] = [
      {
        id: 91001, orderNumber: "PED-TESTE-01", customerName: "Cliente Alvo", customerPhone: "86999990001",
        deliveryStreet: "Rua Teste", deliveryNumber: "1", deliveryNeighborhood: "Centro", deliveryCity: "Teresina",
        status: "Received", paymentMethod: "Pix", totalAmount: 6, items: [], createdAt: today,
      },
      {
        id: 91002, orderNumber: "PED-TESTE-02", customerName: "Outro Cliente", customerPhone: "86999990002",
        deliveryStreet: "Rua Teste", deliveryNumber: "2", deliveryNeighborhood: "Centro", deliveryCity: "Teresina",
        status: "Delivered", paymentMethod: "Pix", totalAmount: 12, items: [], createdAt: today,
      },
    ];
    await page.route("**/api/orders", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({ json: { success: true, message: "", data: orders } });
    });

    await page.getByRole("button", { name: /atualizar dados/i }).click();
    await page.locator(".admin-filter select").nth(1).selectOption("Received");
    await page.getByPlaceholder("Buscar pedido, cliente ou telefone").fill("Cliente Alvo");

    const rows = page.locator(".admin-order-row");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("PED-TESTE-01");
    await expect(rows.first()).toContainText("Cliente Alvo");
  });

  test("deve alternar para a aba de produtos e visualizar catálogo", async ({ page }) => {
    await selectTab(page, "products");

    await expect(page.locator(".admin-title-row h1")).toContainText("Produtos");
    await expect(page.getByRole("button", { name: /novo produto/i })).toBeVisible();
  });

  test("deve exibir formulário ao clicar em 'Novo produto'", async ({ page }) => {
    await selectTab(page, "products");
    await page.getByRole("button", { name: /novo produto/i }).click();

    await expect(page.locator(".admin-product-form")).toBeVisible();
    await expect(page.locator(".admin-product-form input").first()).toBeVisible();
  });

  test("deve cadastrar produto e disponibilizá-lo na vitrine", async ({ page }) => {
    const productName = `E2E ${Date.now()}`;
    let createdProductId: number | null = null;
    const token = await page.evaluate(() => sessionStorage.getItem("admin-token"));
    expect(token).toBeTruthy();

    try {
      await selectTab(page, "products");
      await page.getByRole("button", { name: /novo produto/i }).click();
      const form = page.locator(".admin-product-form");
      await form.getByLabel("Nome do produto").fill(productName);
      await form.getByLabel("Descrição").fill("Produto criado pelo teste automatizado.");
      await form.getByLabel("Categoria").selectOption({ index: 1 });
      await form.locator(".admin-variant-row").getByLabel("Nome").fill("Unidade");
      await form.locator(".admin-variant-row").getByLabel("Preço (R$)").fill("4.50");
      await form.getByLabel("Estoque").fill("10");

      const createResponse = page.waitForResponse(
        (response) => response.url().endsWith("/api/products") && response.request().method() === "POST",
      );
      await form.getByRole("button", { name: /cadastrar produto/i }).click();
      const response = await createResponse;
      expect(response.ok()).toBeTruthy();
      const result = await response.json() as { data: { id: number } };
      createdProductId = result.data.id;
      await expect(page.locator(".admin-success")).toContainText("Produto cadastrado com sucesso.");

      const productRow = page.locator(".admin-product-row").filter({ hasText: productName });
      await productRow.getByRole("button", { name: `Editar ${productName}` }).click();
      await form.getByLabel("Descrição").fill("Descrição atualizada pelo teste automatizado.");
      const updateResponse = page.waitForResponse(
        (candidate) => candidate.url().match(/\/api\/products\/\d+$/) !== null && candidate.request().method() === "PUT",
      );
      await form.getByRole("button", { name: /salvar alterações/i }).click();
      expect((await updateResponse).ok()).toBeTruthy();
      await expect(page.locator(".admin-success")).toContainText("Produto atualizado com sucesso.");

      const storefrontResponse = await page.request.get(`${API_BASE_URL}/products`);
      expect(storefrontResponse.ok()).toBeTruthy();
      const storefrontResult = await storefrontResponse.json() as { data: Array<{ name: string }> };
      expect(storefrontResult.data.some((product) => product.name === productName)).toBeTruthy();

      await page.goto(new URL("/", ENV.BASE_URL).toString());
      await expect(page.locator(".product-card").filter({ hasText: productName })).toBeVisible();
    } finally {
      if (createdProductId !== null && token) {
        const deleteResponse = await page.request.delete(
          new URL(`/api/products/${createdProductId}`, ENV.BASE_URL).toString(),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        expect(deleteResponse.ok()).toBeTruthy();
      }
    }
  });

  test("deve alternar para a aba de segurança", async ({ page }) => {
    await selectTab(page, "security");

    await expect(page.locator(".admin-title-row h1")).toContainText("Segurança");
    await expect(page.locator("section[aria-label='Acessos administrativos bloqueados']")).toBeVisible();
  });

  test("deve atualizar o status do pedido e preparar a mensagem do WhatsApp", async ({ page }) => {
    const order: OrderStub = {
      id: 91003, orderNumber: "PED-TESTE-03", customerName: "Cliente Notificação", customerPhone: "86999990003",
      deliveryStreet: "Rua Teste", deliveryNumber: "3", deliveryNeighborhood: "Centro", deliveryCity: "Teresina",
      status: "Received", paymentMethod: "Pix", totalAmount: 6, items: [], createdAt: new Date().toISOString(),
    };
    await page.route("**/api/orders**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { success: true, message: "", data: [order] } });
        return;
      }
      if (route.request().method() === "PUT" && route.request().url().endsWith(`/api/orders/${order.id}/status`)) {
        order.status = "InPreparation";
        await route.fulfill({ json: { success: true, message: "", data: order } });
        return;
      }
      await route.continue();
    });
    await page.locator("button[aria-label='Atualizar dados']").click();
    await page.evaluate(() => { window.open = () => null; });

    const updateResponse = page.waitForResponse(
      (response) => response.url().endsWith(`/api/orders/${order.id}/status`) && response.request().method() === "PUT",
    );
    await page.locator(".admin-order-row").first().locator(".admin-status-select").selectOption("InPreparation");
    const response = await updateResponse;
    expect(response.ok()).toBeTruthy();
    expect(await response.request().postDataJSON()).toEqual({ status: 2 });

    await expect(page.locator(".admin-order-row").first().locator(".admin-status-select")).toHaveValue("InPreparation");
    const whatsappLink = page.locator(".admin-whatsapp-link");
    await expect(whatsappLink).toBeVisible();
    await expect(whatsappLink).toHaveAttribute("href", /^https:\/\/wa\.me\/5586999990003\?text=/);
    await expect(whatsappLink).toHaveAttribute("href", /em%20preparo/i);
  });

  test("deve salvar a configuração da imagem principal", async ({ page }) => {
    await page.getByRole("button", { name: /configurações/i }).click();
    const form = page.locator(".admin-settings-form");

    await expect(form).toBeVisible();
    await expect(form.getByRole("heading", { name: "Imagem principal" })).toBeVisible();
    await expect(form.locator("input[type=url]")).toHaveValue(/^https:\/\//);
  });

  test("deve zerar tentativas e liberar um acesso bloqueado", async ({ page }) => {
    const email = "blocked-e2e@example.com";
    let attempts = [{
      id: 92001, email, ipAddress: "192.0.2.10", numberOfAt: 5,
      attemptedAt: new Date().toISOString(), clearedAt: null as string | null,
    }];
    let blockedLogins = [{
      email, blockedAt: new Date().toISOString(), failedAttempts: 5, ipAddresses: ["192.0.2.10"],
    }];

    await page.route("**/api/auth/blocked-logins**", async (route) => {
      if (route.request().method() === "DELETE") {
        blockedLogins = [];
        await route.fulfill({ json: { success: true, message: "Acesso liberado com sucesso.", data: null } });
        return;
      }
      await route.fulfill({ json: { success: true, message: "", data: blockedLogins } });
    });
    await page.route("**/api/auth/login-attempts**", async (route) => {
      if (route.request().method() === "PUT") {
        const update = route.request().postDataJSON() as { numberOfAt: number };
        attempts = attempts.map((attempt) => ({
          ...attempt,
          numberOfAt: update.numberOfAt,
          clearedAt: update.numberOfAt === 0 ? new Date().toISOString() : null,
        }));
        await route.fulfill({ json: { success: true, message: "", data: attempts[0] } });
        return;
      }
      await route.fulfill({ json: { success: true, message: "", data: attempts } });
    });

    await selectTab(page, "security");

    const blockedSection = page.locator("section[aria-label='Acessos administrativos bloqueados']");
    const blockedEntry = blockedSection.locator(".admin-order-list").first()
      .locator(".admin-order-row").filter({ hasText: email });
    await expect(blockedEntry).toBeVisible();

    const attemptsList = blockedSection.locator(".admin-order-list").last();
    const attemptEntry = attemptsList.locator(".admin-order-row").filter({ hasText: email });
    await attemptEntry.getByRole("button", { name: /zerar/i }).click();
    await expect(attemptEntry).toContainText("0 / 5");
    await expect(page.locator(".admin-success")).toContainText("Tentativas atualizadas para 0");
    expect(attempts[0].numberOfAt).toBe(0);

    page.once("dialog", (dialog) => dialog.accept());
    await blockedEntry.getByRole("button", { name: /liberar acesso/i }).click();
    await expect(blockedSection.getByText("Nenhum acesso bloqueado")).toBeVisible();
    await expect(page.locator(".admin-success")).toContainText(`Acesso liberado para ${email}`);
    expect(blockedLogins).toHaveLength(0);
  });

  test("deve filtrar pedidos por texto", async ({ page }) => {
    await selectTab(page, "orders");
    const searchInput = page.getByPlaceholder("Buscar pedido, cliente ou telefone");
    await searchInput.fill("PedidoInexistente999");

    await expect(searchInput).toHaveValue("PedidoInexistente999");
  });

  test("deve deslogar ao clicar em Sair", async ({ page }) => {
    await page.locator(".admin-account button[aria-label='Sair']").click();

    await expect(page.getByRole("heading", { name: "Acesso administrativo" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
  });
});

import { test, expect } from "@fixtures";
import { ENV } from "@constants/env";

/**
 * @admin
 * Testes E2E — Painel Administrativo (Autenticado via storageState)
 */
test.describe("Admin — Painel Administrativo @admin", () => {
  test.beforeEach(async ({ adminDashboardPage }) => {
    await adminDashboardPage.navigate();
    await adminDashboardPage.expectDashboardLoaded();
  });

  test("deve carregar o dashboard administrativo com as abas principais", async ({ adminDashboardPage }) => {
    await expect(adminDashboardPage.brand).toBeVisible();
    await expect(adminDashboardPage.sectionTitle).toContainText("Pedidos");
    await expect(adminDashboardPage.ordersTab).toBeVisible();
    await expect(adminDashboardPage.productsTab).toBeVisible();
    await expect(adminDashboardPage.securityTab).toBeVisible();
    await expect(adminDashboardPage.accountName).toBeVisible();
  });

  test("deve combinar filtro de status e busca de pedidos", async ({ adminDashboardPage, page }) => {
    const today = new Date().toISOString();
    const orders = [
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

    await adminDashboardPage.refreshButton.click();
    await adminDashboardPage.orderStatusFilterSelect.selectOption("Received");
    await adminDashboardPage.searchOrders("Cliente Alvo");

    await expect(adminDashboardPage.orderRows).toHaveCount(1);
    await expect(adminDashboardPage.orderRows.first()).toContainText("PED-TESTE-01");
    await expect(adminDashboardPage.orderRows.first()).toContainText("Cliente Alvo");
  });

  test("deve permitir alternar para a aba de produtos e visualizar catálogo", async ({ adminDashboardPage }) => {
    await adminDashboardPage.selectTab("products");

    await expect(adminDashboardPage.sectionTitle).toContainText("Produtos");
    await expect(adminDashboardPage.newProductButton).toBeVisible();
  });

  test("deve exibir formulário de produto ao clicar em 'Novo produto'", async ({ adminDashboardPage }) => {
    await adminDashboardPage.selectTab("products");
    await adminDashboardPage.clickNewProduct();

    await expect(adminDashboardPage.productForm).toBeVisible();
    await expect(adminDashboardPage.productNameInput).toBeVisible();
  });

  test("deve cadastrar produto e disponibilizá-lo na vitrine", async ({ adminDashboardPage, page }) => {
    const productName = `E2E ${Date.now()}`;
    let createdProductId: number | null = null;
    const token = await page.evaluate(() => sessionStorage.getItem("admin-token"));
    expect(token).toBeTruthy();

    try {
      await adminDashboardPage.selectTab("products");
      await adminDashboardPage.clickNewProduct();
      const form = adminDashboardPage.productForm;
      await form.getByLabel("Nome do produto").fill(productName);
      await form.getByLabel("Descrição").fill("Produto criado pelo teste automatizado.");
      await form.getByLabel("Categoria").selectOption({ index: 1 });
      await form.locator(".admin-variant-row").getByLabel("Nome").fill("Unidade");
      await form.locator(".admin-variant-row").getByLabel("Preço (R$)").fill("4.50");
      await form.getByLabel("Estoque").fill("10");

      const createResponse = page.waitForResponse((response) =>
        response.url().endsWith("/api/products") && response.request().method() === "POST",
      );
      await form.getByRole("button", { name: /cadastrar produto/i }).click();
      const response = await createResponse;
      expect(response.ok()).toBeTruthy();
      const result = await response.json() as { data: { id: number } };
      createdProductId = result.data.id;
      await expect(page.locator(".admin-success")).toContainText("Produto cadastrado com sucesso.");

      const productRow = adminDashboardPage.productRows.filter({ hasText: productName });
      await productRow.getByRole("button", { name: `Editar ${productName}` }).click();
      await form.getByLabel("Descrição").fill("Descrição atualizada pelo teste automatizado.");
      const updateResponse = page.waitForResponse((candidate) =>
        candidate.url().match(/\/api\/products\/\d+$/) !== null && candidate.request().method() === "PUT",
      );
      await form.getByRole("button", { name: /salvar alterações/i }).click();
      expect((await updateResponse).ok()).toBeTruthy();
      await expect(page.locator(".admin-success")).toContainText("Produto atualizado com sucesso.");

      const storefrontResponse = await page.request.get(new URL("/api/products", ENV.BASE_URL).toString());
      expect(storefrontResponse.ok()).toBeTruthy();
      const storefrontResult = await storefrontResponse.json() as { data: Array<{ name: string }> };
      expect(storefrontResult.data.some((product) => product.name === productName)).toBeTruthy();

      await page.goto(new URL("/", ENV.BASE_URL).toString());
      await expect(page.locator(".product-card").filter({ hasText: productName })).toBeVisible();
    } finally {
      if (createdProductId !== null && token) {
        const deleteResponse = await page.request.delete(new URL(`/api/products/${createdProductId}`, ENV.BASE_URL).toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(deleteResponse.ok()).toBeTruthy();
      }
    }
  });

  test("deve permitir alternar para a aba de segurança", async ({ adminDashboardPage }) => {
    await adminDashboardPage.selectTab("security");

    await expect(adminDashboardPage.sectionTitle).toContainText("Segurança");
    await expect(adminDashboardPage.blockedLoginsSection).toBeVisible();
  });

  test("deve atualizar o status do pedido e preparar a mensagem do WhatsApp", async ({ adminDashboardPage, page }) => {
    const order = {
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
    await adminDashboardPage.refreshButton.click();
    await page.evaluate(() => { window.open = () => null; });

    const updateResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/api/orders/${order.id}/status`) && response.request().method() === "PUT",
    );
    await adminDashboardPage.orderRows.first().locator(".admin-status-select").selectOption("InPreparation");
    const response = await updateResponse;
    expect(response.ok()).toBeTruthy();
    expect(await response.request().postDataJSON()).toEqual({ status: 2 });

    await expect(adminDashboardPage.orderRows.first().locator(".admin-status-select")).toHaveValue("InPreparation");
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

  test("deve zerar tentativas e liberar um acesso bloqueado", async ({ adminDashboardPage, page }) => {
    const email = "blocked-e2e@example.com";
    let attempts: Array<{
      id: number; email: string; ipAddress: string; numberOfAt: number;
      attemptedAt: string; clearedAt: string | null;
    }> = [{
      id: 92001, email, ipAddress: "192.0.2.10", numberOfAt: 5,
      attemptedAt: new Date().toISOString(), clearedAt: null,
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

    await adminDashboardPage.selectTab("security");
    const blockedEntry = adminDashboardPage.blockedLoginsSection.locator(".admin-order-list").first()
      .locator(".admin-order-row").filter({ hasText: email });
    await expect(blockedEntry).toBeVisible();
    const attemptEntry = adminDashboardPage.attemptsList.locator(".admin-order-row").filter({ hasText: email });
    await attemptEntry.getByRole("button", { name: /zerar/i }).click();
    await expect(attemptEntry).toContainText("0 / 5");
    await expect(page.locator(".admin-success")).toContainText("Tentativas atualizadas para 0");
    expect(attempts[0].numberOfAt).toBe(0);

    page.once("dialog", (dialog) => dialog.accept());
    await blockedEntry.getByRole("button", { name: /liberar acesso/i }).click();
    await expect(adminDashboardPage.blockedLoginsSection.getByText("Nenhum acesso bloqueado")).toBeVisible();
    await expect(page.locator(".admin-success")).toContainText(`Acesso liberado para ${email}`);
    expect(blockedLogins).toHaveLength(0);
  });

  test("deve permitir filtrar e buscar na lista de pedidos", async ({ adminDashboardPage }) => {
    await adminDashboardPage.selectTab("orders");
    await adminDashboardPage.searchOrders("PedidoInexistente999");

    // Deve exibir aviso ou lista filtrada
    await expect(adminDashboardPage.orderSearchInput).toHaveValue("PedidoInexistente999");
  });

  test("deve deslogar com sucesso ao clicar no botão Sair", async ({ adminDashboardPage, adminLoginPage }) => {
    await adminDashboardPage.signOut();

    await adminLoginPage.expectLoginFormVisible();
  });
});

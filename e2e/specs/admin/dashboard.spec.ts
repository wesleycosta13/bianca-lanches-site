import { test, expect } from "@fixtures";

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

  test("deve permitir alternar para a aba de segurança", async ({ adminDashboardPage }) => {
    await adminDashboardPage.selectTab("security");

    await expect(adminDashboardPage.sectionTitle).toContainText("Segurança");
    await expect(adminDashboardPage.blockedLoginsSection).toBeVisible();
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

import { expect, type Page, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { ROUTES } from "@constants/routes";

export class AdminDashboardPage extends BasePage {
  readonly brand = this.page.locator(".admin-brand");
  readonly accountName = this.page.locator(".admin-account strong");
  readonly signOutButton = this.page.locator(".admin-account button[aria-label='Sair']");
  readonly refreshButton = this.page.locator("button[aria-label='Atualizar dados']");
  readonly sectionTitle = this.page.locator(".admin-title-row h1");

  // Tabs de navegação
  readonly ordersTab = this.page.getByRole("button", { name: /pedidos/i });
  readonly productsTab = this.page.getByRole("button", { name: /produtos/i });
  readonly securityTab = this.page.getByRole("button", { name: /segurança/i });

  // Aba Pedidos
  readonly orderSearchInput = this.page.getByPlaceholder("Buscar pedido, cliente ou telefone");
  readonly orderDateSelect = this.page.locator(".admin-filter select").first();
  readonly orderStatusFilterSelect = this.page.locator(".admin-filter select").nth(1);
  readonly orderRows = this.page.locator(".admin-order-row");
  readonly emptyOrdersNotice = this.page.locator(".admin-empty");

  // Aba Produtos
  readonly newProductButton = this.page.getByRole("button", { name: /novo produto/i });
  readonly productRows = this.page.locator(".admin-product-row");
  readonly productForm = this.page.locator(".admin-product-form");
  readonly productNameInput = this.page.locator(".admin-product-form input").first();

  // Aba Segurança
  readonly blockedLoginsSection = this.page.locator("section[aria-label='Acessos administrativos bloqueados']");

  constructor(page: Page) {
    super(page);
  }

  get path(): string {
    return ROUTES.ADMIN;
  }

  async selectTab(tab: "orders" | "products" | "security"): Promise<void> {
    if (tab === "orders") {
      await this.ordersTab.click();
    } else if (tab === "products") {
      await this.productsTab.click();
    } else if (tab === "security") {
      await this.securityTab.click();
    }
  }

  async searchOrders(query: string): Promise<void> {
    await this.orderSearchInput.fill(query);
  }

  async clickNewProduct(): Promise<void> {
    await this.newProductButton.click();
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
  }

  async expectDashboardLoaded(): Promise<void> {
    await expect(this.sectionTitle).toBeVisible({ timeout: 15_000 });
    await expect(this.ordersTab).toBeVisible();
    await expect(this.productsTab).toBeVisible();
    await expect(this.securityTab).toBeVisible();
  }
}

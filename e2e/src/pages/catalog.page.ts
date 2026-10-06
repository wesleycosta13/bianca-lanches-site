import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { ROUTES } from "@constants/routes";
import { HeaderComponent } from "@components/header.component";
import { CartPanelComponent } from "@components/cart-panel.component";
import { CheckoutModalComponent } from "@components/checkout-modal.component";
import { MobileCartDrawerComponent } from "@components/mobile-cart-drawer.component";
import { ProductCardComponent } from "@components/product-card.component";

export class CatalogPage extends BasePage {
  readonly header: HeaderComponent;
  readonly cartPanel: CartPanelComponent;
  readonly checkoutModal: CheckoutModalComponent;
  readonly mobileCart: MobileCartDrawerComponent;

  // Hero section
  readonly heroHeading = this.page.getByRole("heading", { level: 1 });
  readonly heroCta = this.page.getByRole("link", { name: /ver cardápio/i });
  readonly catalogSection = this.page.locator("#cardapio");

  // Search and categories
  readonly categoryTabs = this.page.locator(".category-tabs button");
  readonly searchInput = this.page.getByPlaceholder("Buscar no cardápio");
  readonly clearSearchButton = this.page.getByLabel("Limpar busca");
  readonly emptySearchResults = this.page.locator(".empty-results");
  readonly productCards = this.page.locator(".product-card");

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.cartPanel = new CartPanelComponent(page);
    this.checkoutModal = new CheckoutModalComponent(page);
    this.mobileCart = new MobileCartDrawerComponent(page);
  }

  get path(): string {
    return ROUTES.CATALOG;
  }

  async navigateToHome(): Promise<void> {
    await this.page.goto(ROUTES.HOME);
  }

  async navigateToCatalog(): Promise<void> {
    await this.page.goto(ROUTES.CATALOG);
  }

  async clickHeroCta(): Promise<void> {
    await this.heroCta.click();
  }

  async selectCategory(name: string): Promise<void> {
    await this.categoryTabs.filter({ hasText: name }).click();
  }

  getCategorySection(name: string): Locator {
    return this.page.locator(`#categoria-${name}`);
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.clearSearchButton.click();
  }

  getProductCard(productName: string): ProductCardComponent {
    const locator = this.productCards.filter({ hasText: productName }).first();
    return new ProductCardComponent(this.page, locator);
  }

  getFirstProductCard(): ProductCardComponent {
    return new ProductCardComponent(this.page, this.productCards.first());
  }
}

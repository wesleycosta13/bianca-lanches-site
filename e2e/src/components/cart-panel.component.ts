import type { Locator, Page } from "@playwright/test";
import { BaseComponent } from "./base.component";
import type { DeliveryAddress, PaymentMethod } from "@models/checkout.model";

export class CartPanelComponent extends BaseComponent {
  readonly emptyMessage = this.root.locator(".cart-empty");
  readonly cartLines = this.root.locator(".cart-line");
  readonly totalPrice = this.root.locator(".order-total strong");
  readonly checkoutDetails = this.root.locator(".checkout-details");
  readonly neighborhoodInput = this.root.getByPlaceholder("Seu bairro");
  readonly streetInput = this.root.getByPlaceholder("Nome da rua");
  readonly numberInput = this.root.getByPlaceholder("Número da residência");
  readonly paymentSelect = this.root.locator(".checkout-details select");
  readonly checkoutButton = this.root.getByRole("button", { name: /fechar pedido/i });

  constructor(page: Page, root: Locator = page.locator(".order-panel")) {
    super(page, root);
  }

  getLineItem(name: string): Locator {
    return this.cartLines.filter({ hasText: name }).first();
  }

  getItemQuantityLocator(name: string): Locator {
    return this.getLineItem(name).locator(".quantity-control span");
  }

  async decreaseItem(name: string): Promise<void> {
    await this.root.getByLabel(new RegExp(`diminuir ${name}`, "i")).click();
  }

  async fillDeliveryAddress(address: Partial<DeliveryAddress>): Promise<void> {
    if (address.neighborhood !== undefined) {
      await this.neighborhoodInput.fill(address.neighborhood);
    }
    if (address.street !== undefined) {
      await this.streetInput.fill(address.street);
    }
    if (address.number !== undefined) {
      await this.numberInput.fill(address.number);
    }
  }

  async selectPaymentMethod(payment: PaymentMethod): Promise<void> {
    await this.paymentSelect.selectOption(payment);
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async fillCheckoutForm(address: DeliveryAddress, payment: PaymentMethod): Promise<void> {
    await this.fillDeliveryAddress(address);
    await this.selectPaymentMethod(payment);
  }
}

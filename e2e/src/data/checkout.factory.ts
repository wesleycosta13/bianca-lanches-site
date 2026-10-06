import { fakerPT_BR as faker } from "@faker-js/faker";
import type { CustomerInfo, DeliveryAddress, CheckoutFormData, FullOrderPayload, PaymentMethod } from "@models/checkout.model";

/**
 * Factory para geração de dados de teste de checkout usando Faker.js (pt_BR).
 */
export class CheckoutDataFactory {
  static createDeliveryAddress(overrides?: Partial<DeliveryAddress>): DeliveryAddress {
    return {
      neighborhood: faker.location.county(),
      street: faker.location.street(),
      number: String(faker.number.int({ min: 10, max: 999 })),
      complement: `Apto ${faker.number.int({ min: 10, max: 500 })}`,
      ...overrides,
    };
  }

  static createCustomerInfo(overrides?: Partial<CustomerInfo>): CustomerInfo {
    return {
      name: faker.person.fullName(),
      // Gera telefone no formato DDD (86) + 9 dígitos
      phone: `869${faker.string.numeric(8)}`,
      city: faker.location.city(),
      ...overrides,
    };
  }

  static createPaymentMethod(): PaymentMethod {
    return faker.helpers.arrayElement(["Pix", "Cartão", "Dinheiro"]);
  }

  static createCheckoutFormData(overrides?: Partial<CheckoutFormData>): CheckoutFormData {
    return {
      address: this.createDeliveryAddress(overrides?.address),
      paymentMethod: overrides?.paymentMethod ?? "Pix",
    };
  }

  static createFullOrder(overrides?: Partial<FullOrderPayload>): FullOrderPayload {
    return {
      ...this.createCheckoutFormData(overrides),
      customer: this.createCustomerInfo(overrides?.customer),
    };
  }

  static createInvalidCustomer(fieldToClear: keyof CustomerInfo): CustomerInfo {
    const customer = this.createCustomerInfo();
    customer[fieldToClear] = "";
    return customer;
  }
}

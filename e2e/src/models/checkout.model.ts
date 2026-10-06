export type PaymentMethod = "Pix" | "Cartão" | "Dinheiro" | string;

export interface DeliveryAddress {
  neighborhood: string;
  street: string;
  number?: string;
  complement?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  city: string;
}

export interface CheckoutFormData {
  address: DeliveryAddress;
  paymentMethod: PaymentMethod;
}

export interface FullOrderPayload extends CheckoutFormData {
  customer: CustomerInfo;
}

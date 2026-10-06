import dotenv from "dotenv";
import path from "path";

// Garante o carregamento do arquivo .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const ENV = {
  BASE_URL: process.env.BASE_URL ?? "http://localhost:5173",
  API_BASE_URL: process.env.API_BASE_URL ?? "http://localhost:5173/api",

  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL ?? "admin123456@gmail.com",
    PASSWORD: process.env.ADMIN_PASSWORD ?? "admin12345678",
  },

  TEST_DATA: {
    CUSTOMER: {
      NAME: process.env.TEST_CUSTOMER_NAME ?? "João Silva",
      PHONE: process.env.TEST_CUSTOMER_PHONE ?? "86999998888",
      CITY: process.env.TEST_CUSTOMER_CITY ?? "Teresina",
    },
    DELIVERY: {
      NEIGHBORHOOD: process.env.TEST_DELIVERY_NEIGHBORHOOD ?? "Centro",
      STREET: process.env.TEST_DELIVERY_STREET ?? "Rua das Flores",
      NUMBER: process.env.TEST_DELIVERY_NUMBER ?? "123",
      COMPLEMENT: process.env.TEST_DELIVERY_COMPLEMENT ?? "Apto 101",
    },
  },
} as const;

import { expect, test } from "@playwright/test";
import { ENV } from "@constants/env";

const apiUrl = (path: string) => `${ENV.API_BASE_URL.replace(/\/+$/, "")}${path}`;

test.describe("API — Endpoints públicos e autorização @api", () => {
  test("GET /products retorna envelope e lista de produtos", async ({ request }) => {
    const response = await request.get(apiUrl("/products"));

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(expect.any(Array));
  });

  test("GET /categories retorna envelope e lista de categorias", async ({ request }) => {
    const response = await request.get(apiUrl("/categories"));

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(expect.any(Array));
  });

  test("GET /config/hero-image retorna uma URL HTTPS pública", async ({ request }) => {
    const response = await request.get(apiUrl("/config/hero-image"));

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.imageUrl).toMatch(/^https:\/\/\S+$/);
  });

  test("GET /orders rejeita chamadas sem token JWT", async ({ request }) => {
    const response = await request.get(apiUrl("/orders"));

    expect(response.status()).toBe(401);
  });

  test("PUT /config/hero-image rejeita alteração sem token JWT", async ({ request }) => {
    const response = await request.put(apiUrl("/config/hero-image"), {
      data: { imageUrl: "https://example.com/hero-test.jpg" },
    });

    expect(response.status()).toBe(401);
  });

  test("POST /products rejeita cadastro sem token JWT", async ({ request }) => {
    const response = await request.post(apiUrl("/products"), {
      data: { name: "Produto não autorizado" },
    });

    expect(response.status()).toBe(401);
  });

  test("POST /orders valida payload antes de criar pedido", async ({ request }) => {
    const response = await request.post(apiUrl("/orders"), {
      data: {},
    });

    expect(response.status()).toBe(400);
  });
});

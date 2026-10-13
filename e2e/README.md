# Testes End-to-End (E2E) — Bianca Lanches

Arquitetura profissional de testes E2E com [Playwright](https://playwright.dev/) orientada aos princípios de **Clean Code** e **SOLID**.

> 📖 **Testes Manuais:** O roteiro completo de casos de teste manuais, passos e critérios de aceite está documentado em [`docs/TESTES_MANUAIS.md`](Repository/Pasta/docs/TESTES_MANUAIS.md).

---

## 🏛️ Princípios Arquiteturais Aplicados

| Princípio | Aplicação na Estrutura |
| :--- | :--- |
| **S** - Single Responsibility | Testes (`specs/`) cuidam apenas de cenários de negócio; Pages (`pages/`) gerenciam rotas e orquestração de tela; Componentes (`components/`) encapsulam seletores e interações da UI; Modelos (`models/`) definem contratos de dados; Factories (`data/`) geram payloads de teste. |
| **O** - Open/Closed | `BasePage` e `BaseComponent` fornecem contratos extensíveis. Novos componentes ou variações estendem as classes base sem modificar código já existente. |
| **L** - Liskov Substitution | Subclasses de componentes e páginas podem ser utilizadas no lugar de suas classes base sem efeitos colaterais. |
| **I** - Interface Segregation | Interfaces enxutas e segregadas (`CustomerInfo`, `DeliveryAddress`, `CheckoutFormData`) evitam acoplamento desnecessário e objetos pesados. |
| **D** - Dependency Inversion | Injeção de dependência via **Playwright Test Fixtures** (`src/fixtures/index.ts`). Os testes recebem instâncias prontas e tipadas (`catalogPage`, `adminLoginPage`) sem instanciação manual `new Page()`. |
| **Clean Code** | Eliminação completa de seletores mágicos e strings duplicadas nas especificações de teste. Nomes expressivos no domínio da aplicação (`addToCart`, `fillDeliveryAddress`, `confirmOrder`). |

---

## 📁 Estrutura de Diretórios

```
e2e/
├── src/
│   ├── components/                 # Component Object Model (COM)
│   │   ├── base.component.ts       # Classe base encapsulando Locator e estado
│   │   ├── header.component.ts     # Cabeçalho da aplicação
│   │   ├── product-card.component.ts # Card individual de produto
│   │   ├── cart-panel.component.ts # Painel lateral de carrinho e checkout desktop
│   │   ├── checkout-modal.component.ts # Modal de revisão e confirmação
│   │   └── mobile-cart-drawer.component.ts # Drawer/sacola em telas móveis
│   │
│   ├── pages/                      # Page Object Model (POM)
│   │   ├── base.page.ts            # Métodos de ciclo de vida e navegação
│   │   ├── catalog.page.ts         # Vitrine pública e catálogo
│   │   ├── admin-login.page.ts     # Tela de login administrativo
│   │   └── admin-dashboard.page.ts # Painel administrativo autenticado
│   │
│   ├── fixtures/                   # Injeção de dependência (Playwright Fixtures)
│   │   └── index.ts                # Runner customizado com Page Objects injetados
│   │
│   ├── models/                     # Interfaces e tipos de domínio
│   │   ├── checkout.model.ts       # Tipos para endereço, cliente e pagamento
│   │   └── product.model.ts        # Tipos e filtros de produtos
│   │
│   ├── data/                       # Factories de dados de teste
│   │   └── checkout.factory.ts     # Geradores de payloads válidos e inválidos
│   │
│   └── constants/                  # Constantes e rotas centralizadas
│       └── routes.ts               # URLs e rotas da aplicação
│
├── specs/                          # Especificações de teste limpas (User Stories)
│   ├── global.setup.ts             # Setup de autenticação administrativa
│   ├── admin/
│   │   ├── login.spec.ts           # Cenários de login administrativo (não autenticado)
│   │   └── dashboard.spec.ts       # Gestão de pedidos, catálogo e abas (autenticado)
│   ├── api/
│   │   └── public-api.spec.ts      # Contratos HTTP, validação e autorização da API (sem navegador)
│   ├── security/
│   │   └── security.spec.ts        # Controle de acesso e proteção contra acessos indevidos
│   └── storefront/
│       ├── catalog.spec.ts         # Vitrine e busca
│       ├── cart.spec.ts            # Adição, remoção e cálculo do carrinho
│       ├── checkout.spec.ts        # Fluxo de finalização do pedido
│       └── mobile.spec.ts          # Comportamento responsivo mobile
│
├── .env                            # Variáveis privadas locais (ignorado no git)
├── .env.example                    # Template de variáveis para versionamento
├── playwright.config.ts            # Configuração do Playwright
├── tsconfig.json                   # Path aliases (@pages, @components, @fixtures, etc.)
└── package.json
```

---

## 🔐 Configuração de Ambiente (.env)

Crie o arquivo `.env` na raiz do diretório `e2e` copiando o modelo:

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `BASE_URL` | URL do frontend | `http://localhost:5173` |
| `API_BASE_URL` | URL da API backend | `http://localhost:5173/api` |
| `ADMIN_EMAIL` | E-mail de administrador para setup e testes | `admin@biancalanches.com` |
| `ADMIN_PASSWORD` | Senha da conta de administrador | `Admin@123` |
| `TEST_CUSTOMER_NAME` | Nome padrão do cliente nos testes | `João Silva` |
| `TEST_CUSTOMER_PHONE` | Telefone de contato nos testes | `86999998888` |
| `TEST_CUSTOMER_CITY` | Cidade de entrega | `Teresina` |
| `TEST_DELIVERY_STREET` | Logradouro de entrega | `Rua das Flores` |

---

## 🚀 Executando os Testes

```bash
# Executar todos os testes
npm test

# Executar com interface interativa
npm run test:ui

# Executar em modo headed (com navegador visível)
npm run test:headed

# Executar apenas testes da vitrine
npm run test:storefront

# Executar apenas testes administrativos
npm run test:admin

# Executar testes da API diretamente por HTTP, sem navegador
npm run test:api

# Visualizar o último relatório HTML
npm run report
```

---

##  Executando com Docker

O ambiente de testes E2E está completamente containerizado com a imagem oficial do Playwright (`mcr.microsoft.com/playwright`), contendo todos os navegadores (Chromium, Firefox e WebKit) pré-instalados.

### 1. Executar toda a suite no Docker (Aplicação + Banco + Testes)

Sobe o PostgreSQL, a API e o Frontend, aguarda a inicialização e executa os testes:

```bash
# A partir da raiz do projeto:
docker compose --profile e2e up --build --abort-on-container-exit --exit-code-from e2e

# Ou dentro da pasta e2e:
npm run test:docker
```

> **Nota:** O container do E2E possui um `entrypoint.sh` inteligente que aguarda a API responder com status 200 antes de iniciar os testes, prevenindo falhas de concorrência ou inicialização lenta.

### 2. Executar testes pontuais em container isolado

Se a aplicação já estiver rodando (`docker compose up -d`):

```bash
# Executar todos os testes
docker compose run --rm e2e

# Executar apenas testes de vitrine
docker compose run --rm e2e npx playwright test --grep @storefront

# Executar apenas testes administrativos
docker compose run --rm e2e npx playwright test --grep @admin

# Executar apenas testes da API
docker compose run --rm e2e npx playwright test --project=api
```

### 3. Relatórios e Evidências

Os relatórios HTML e evidências de erro (screenshots, vídeos e traces) gerados dentro do container são mapeados automaticamente para sua máquina host através de volumes:
- Relatório HTML: [`e2e/playwright-report/`](file:///c:/Users/Wesle/Documents/LanchoneteMãe/e2e/playwright-report) (abra com `npm run report`)
- Evidências de falha: [`e2e/test-results/`](file:///c:/Users/Wesle/Documents/LanchoneteMãe/e2e/test-results)


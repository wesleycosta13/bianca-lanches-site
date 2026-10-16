# Testes E2E — Bianca Lanches

Suíte de testes end-to-end implementada em TypeScript com Playwright Test. Os testes cobrem a vitrine, carrinho, checkout, painel administrativo, segurança e endpoints HTTP da API.

## Estrutura atual

```text
e2e/
├── setup/
│   └── global.setup.ts          # Faz login do admin e salva token/estado de sessão
├── src/
│   ├── constants/
│   │   ├── env.ts                # URLs, credenciais e dados de teste
│   │   └── routes.ts             # Constantes de rotas da aplicação
│   └── fixtures/
│       └── index.ts              # Fixture adminLoginPage e fixture opcional de token
├── specs/
│   ├── admin/
│   │   ├── dashboard.spec.ts     # Abas, pedidos, produtos, segurança e logout
│   │   └── login.spec.ts         # Login admin e validações de acesso
│   ├── api/
│   │   └── public-api.spec.ts    # Contratos HTTP e autorização da API
│   ├── security/
│   │   └── security.spec.ts      # Acesso ao painel e entradas de segurança
│   └── storefront/
│       ├── cart.spec.ts          # Sacola, quantidades e totais
│       ├── catalog.spec.ts       # Catálogo, categorias e busca
│       ├── checkout.spec.ts      # Fluxo de finalização de pedido
│       └── mobile.spec.ts        # Sacola mobile e drawer
├── auth/                         # Estado/token criado pelo setup (ignorado pelo Git)
├── test-results/                 # Evidências de execução
├── playwright-report/            # Relatório HTML do Playwright
├── Dockerfile                    # Imagem Playwright usada pelo Compose
├── entrypoint.sh                 # Aguarda a API antes de iniciar o Playwright
├── playwright.config.ts          # Projetos, browsers, retries e relatórios
├── tsconfig.json                 # Configuração TypeScript e aliases
├── package.json                  # Scripts e dependências
└── .env.example                  # Modelo das variáveis locais
```

### Organização dos testes

Os cenários ficam nos arquivos `specs/**/*.spec.ts`. A maior parte dos seletores e ações usa diretamente a fixture `page` do Playwright; alguns fluxos têm helpers locais dentro do próprio spec para reaproveitar ações.

O arquivo `src/fixtures/index.ts` declara uma fixture chamada `adminLoginPage`, usada pelos testes de segurança. Também declara `injectAdminToken`, desativada por padrão. Os testes administrativos configuram a sessão pelo setup ou por código do próprio spec.

**A suíte atual não implementa uma camada dedicada de Page Objects** (`pages/`/`components/`). A estrutura acima descreve apenas arquivos e responsabilidades existentes no código.

## Bibliotecas e ferramentas

- **Playwright Test** (`@playwright/test`): runner, fixtures, automação de navegador, assertions e requisições HTTP.
- **TypeScript**: linguagem da suíte e checagem de tipos.
- **Faker** (`@faker-js/faker`): geração de dados variáveis para cenários de teste.
- **dotenv**: carregamento de variáveis do arquivo `.env`.
- **Docker Compose**: execução isolada dos testes e conexão com frontend/API.
- A imagem E2E deriva de `mcr.microsoft.com/playwright:v1.63.0-noble`, que inclui os browsers e dependências do Playwright. As versões instaladas das dependências Node são fixadas em `package-lock.json`.

## Projetos Playwright

Os projetos estão definidos em `playwright.config.ts`:

| Projeto | Uso |
| --- | --- |
| `admin-setup` | Autentica o administrador e gera `auth/admin.json` e `auth/admin-token.txt`. |
| `storefront-chromium` | Cenários de catálogo, sacola e checkout no Chromium desktop; depende do setup admin. |
| `storefront-mobile` | Cenários mobile usando o dispositivo emulado `iPhone 14`. |
| `admin-chromium` | Cenários do painel com o estado de sessão salvo; depende do setup admin. |
| `security-chromium` | Testes de segurança em Chromium. |
| `api` | Chamadas HTTP diretas, sem abrir navegador. |

A execução é sequencial (`fullyParallel: false`). Quando `CI=true`, são usados um worker e até duas novas tentativas (`retries: 2`).

## Preparar ambiente local

1. Configure as variáveis do `.env` na raiz do repositório para o backend e copie `e2e/.env.example` para `e2e/.env`.
2. No `.env` do E2E, configure `BASE_URL`, `API_BASE_URL`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` para o ambiente que será testado.
3. Inicie a aplicação. Para Docker Compose, a partir da raiz do repositório:

```bash
docker compose up -d --build
```

O endereço publicado pelo Compose é `http://localhost:8080`. Para execução local com Vite, o padrão é `http://localhost:5173`.

Instale as dependências e execute os testes a partir de `e2e/`:

```bash
npm ci
npx playwright install chromium webkit
npm test
```

O setup de autenticação precisa das credenciais administrativas configuradas e de uma API disponível. Os testes de cadastro/login admin também dependem das credenciais e do estado da aplicação.

## Comandos disponíveis

Na pasta `e2e/`:

```bash
npm test                 # Todos os projetos/testes
npm run test:headed      # Executa com browser visível
npm run test:ui          # Abre a interface do Playwright
npm run test:debug       # Executa em modo de depuração
npm run test:storefront  # Filtra pelo marcador @storefront
npm run test:admin       # Filtra pelo marcador @admin
npm run test:security    # Filtra pelo marcador @security
npm run test:api         # Executa o projeto api
npm run report           # Abre o último relatório HTML
```

Para executar a suíte em container, a partir da raiz do repositório:

```bash
docker compose run --build --rm e2e
```

Esse comando reconstrói a imagem E2E, sobe os serviços dos quais ela depende, espera `/api/products` responder e executa `npx playwright test`. Para subir a aplicação junto com a suíte em uma execução Compose:

```bash
docker compose --profile e2e up --build --abort-on-container-exit --exit-code-from e2e
```

Dentro da rede Docker, o E2E usa `http://frontend:8080` e `http://frontend:8080/api`; não use `localhost` para acessar os outros containers.

## Dados reais e simulados

Há testes que acessam a API e o banco reais, como login e criação de pedido. Outros interceptam chamadas com `page.route()` e devolvem respostas controladas para verificar estados da interface sem alterar dados persistentes. O comportamento de cada cenário depende do próprio spec.

O projeto `admin-setup` grava estado de autenticação em `e2e/auth/`. Alguns cenários de checkout leem o token para preparar estoque pela API. Os testes administrativos dependem do arquivo `admin.json` produzido pelo setup.

## Relatórios e evidências

A configuração gera:

- Relatório HTML em `e2e/playwright-report/`.
- Saída de teste, screenshots, vídeos, traces e contexto de erro em `e2e/test-results/`.

Screenshot, vídeo e trace são configurados para falhas (`only-on-failure`/`retain-on-failure`). Testes HTTP sem browser não produzem vídeo ou screenshot. Para abrir o relatório:

```bash
cd e2e
npm run report
```

No Compose, `playwright-report/` e `test-results/` são montados como volumes para que as evidências continuem disponíveis no host.

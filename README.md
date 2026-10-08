# Bianca Lanches

Sistema completo de autoatendimento, cardápio digital e gestão de pedidos para lanchonete. O cliente consulta o catálogo, personaliza tamanhos e envia pedidos pelo WhatsApp; o painel administrativo gerencia pedidos, fluxo de preparo/entrega, catálogo de produtos, estoque e segurança.

---

## Tecnologias e Arquitetura

- **Frontend:** React 18, TypeScript, Vite, Lucide React e Vanilla CSS.
- **Backend:** ASP.NET Core 8 (.NET 8), Web API REST, Entity Framework Core 8, JWT Bearer e PostgreSQL Provider.
- **Banco de Dados:** PostgreSQL 16 (containerizado).
- **Testes Automatizados (E2E):** Playwright, TypeScript, Page Object Model (POM), Injeção de Dependência por Fixtures e Faker.js.
- **Testes Unitários:** .NET xUnit.
- **Testes Manuais:** Cenários BDD (Dado, Quando, Então) com pré-requisitos em `docs/TESTES_MANUAIS.md`.
- **Integração Contínua (CI):** GitHub Actions para execução de testes E2E e geração de relatórios/evidências.
- **Containerização:** Docker e Docker Compose com proxy Nginx.

---

## Funcionalidades Principais

- **Catálogo e Vitrine Pública:**
  - Busca em tempo real e filtro por abas de categorias.
  - Seleção de variantes de tamanho (P, G, GG) com recálculo dinâmico de preços.
  - Sacola lateral interativa com controle de quantidades e cálculo de totais.
  - Interface responsiva com botão flutuante e gaveta móvel (*drawer*) para celulares.
  - Fluxo de checkout com validação de endereço, seleção de pagamento (Pix, Dinheiro, Cartão) e revisão do pedido.

- **Painel Administrativo (`/admin`):**
  - Autenticação restrita com token JWT e controle por papel (*Admin*).
  - Gestão de pedidos com filtros de data, status (Recebido, Em preparo, Pronto, Saiu para entrega, Entregue, Cancelado) e busca por cliente/telefone.
  - Notificação de status para o cliente via WhatsApp com mensagens pré-configuradas.
  - Cadastro, edição, controle de estoque e exclusão de produtos e variações.
  - Painel de segurança com monitoramento de tentativas de acesso por IP e desbloqueio manual.

---

## Estrutura do Repositório

```
.
├── src/
│   └── backend/                # API REST em ASP.NET Core 8 (Clean Architecture)
│       ├── Salgados.Api/       # Controllers, DTOs, Middlewares e Configuração
│       ├── Salgados.Core/      # Entidades de domínio, Enums e Interfaces
│       └── Salgados.Infrastructure/ # EF Core, Migrations e Repositórios
├── frontend/                   # Interface web do cliente e painel administrativo (React)
├── e2e/                        # Suíte de testes E2E com Playwright + POM + Faker.js
├── tests/                      # Testes unitários do backend (.NET xUnit)
├── docs/                       # Documentação e roteiro de testes manuais em BDD
├── .github/workflows/          # Pipeline de automação do GitHub Actions
└── docker-compose.yml          # Orquestração de containers (Postgres, API e Frontend)
```

---

## Pré-requisitos

- **Com Docker (Recomendado):** Docker Desktop ou Docker Engine com Docker Compose.
- **Desenvolvimento Local Direto:**
  - .NET 8 SDK
  - Node.js 20+ e npm
  - Instância do PostgreSQL 16 ativa

---

## Configuração do Ambiente (.env)

Copie o arquivo de exemplo na raiz do projeto e ajuste as variáveis necessárias:

```bash
cp .env.example .env
```

Principais variáveis:
- `POSTGRES_USER`: Usuário do banco de dados (ex: `postgres`).
- `POSTGRES_PASSWORD`: Senha do banco de dados.
- `POSTGRES_DB`: Nome do banco (ex: `salgados_db`).
- `Admin__Email`: E-mail padrão do administrador (ex: `admin123456@gmail.com`).
- `Admin__Password`: Senha do administrador (ex: `admin12345678`).
- `WHATSAPP_CONTATO`: Número do WhatsApp da loja para contato direto.

---

## Execução via Docker Compose (Recomendado)

Suba toda a pilha (PostgreSQL, Backend .NET e Frontend Vite):

```bash
docker compose up -d --build
```

Acessos:
- **Loja / Cardápio:** `http://localhost:8080`
- **Painel Administrativo:** `http://localhost:8080/admin`
- **Swagger / API:** `http://localhost:8080/swagger`

Comandos úteis:

```bash
# Visualizar logs
docker compose logs -f

# Verificar status dos containers
docker compose ps

# Parar serviços
docker compose down
```

---

## Desenvolvimento Local (Sem Containers)

### 1. Iniciar o Banco de Dados
```bash
docker compose up -d postgres
```

### 2. Iniciar a API Backend (.NET 8)
```bash
dotnet run --project ./src/backend/Salgados.Api --launch-profile https
```

### 3. Iniciar o Frontend (Vite)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```

Acessos locais:
- Vitrine: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`

---

## Testes

### 1. Testes Automatizados E2E (Playwright)
A suíte E2E utiliza Page Object Model (POM), fixtures com injeção de dependência e Faker.js:

```bash
cd e2e
npm install

# Executar todos os testes E2E
npm test

# Executar com interface interativa
npm run test:ui

# Visualizar o relatório HTML
npm run report
```
Consulte o [README do E2E](e2e/README.md) para detalhes da arquitetura de automação.

### 2. Testes Manuais (BDD)
Os cenários funcionais, usabilidade e segurança estão estruturados no formato Dado / Quando / Então com pré-requisitos:
- Consulte [docs/TESTES_MANUAIS.md](docs/TESTES_MANUAIS.md).

### 3. Testes Unitários do Backend
```bash
dotnet test Salgados.sln
```

---

## Credenciais de Demonstração / Teste

- **E-mail:** `admin123456@gmail.com`
- **Senha:** `admin12345678`
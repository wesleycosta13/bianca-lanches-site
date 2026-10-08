# Modelo de Dados — Bianca Lanches

## Visão geral

O banco de dados utiliza PostgreSQL 16 e é acessado pela API ASP.NET Core com Entity Framework Core e Npgsql. O modelo cobre o catálogo, pedidos, pagamentos, controle de estoque, autenticação administrativa e configurações da loja.

## Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    CATEGORIES ||--o{ PRODUCTS : possui
    PRODUCTS ||--o{ PRODUCT_VARIANTS : tem
    PRODUCTS ||--o{ STOCK_MOVEMENTS : movimenta
    PRODUCTS ||--o{ ORDER_ITEMS : vendido_em
    ORDERS ||--o{ ORDER_ITEMS : contem
    ORDERS ||--o| PAYMENTS : tem

    USERS {
        int Id PK
        string Name
        string Email UK
        string PasswordHash
        string Role
        datetime CreatedAt
        datetime UpdatedAt
    }

    CATEGORIES {
        int Id PK
        string Name UK
        string Description
        boolean IsActive
        datetime CreatedAt
    }

    PRODUCTS {
        int Id PK
        int CategoryId FK
        string Name
        string Description
        decimal Price
        int StockQuantity
        string ImageUrl
        boolean IsAvailable
        datetime CreatedAt
        datetime UpdatedAt
    }

    PRODUCT_VARIANTS {
        int Id PK
        int ProductId FK
        string Label
        decimal Price
        boolean IsAvailable
        datetime CreatedAt
    }

    STOCK_MOVEMENTS {
        int Id PK
        int ProductId FK
        int OrderId "sem FK"
        int Quantity
        string Type
        string Reason
        datetime CreatedAt
    }

    ORDERS {
        int Id PK
        string OrderNumber UK
        string CustomerName
        string CustomerPhone
        string DeliveryStreet
        string DeliveryNumber
        string DeliveryNeighborhood
        string DeliveryComplement
        string DeliveryCity
        string DeliveryReference
        string Status
        string PaymentMethod
        decimal TotalAmount
        decimal ChangeFor
        string Notes
        datetime CreatedAt
        datetime UpdatedAt
    }

    ORDER_ITEMS {
        int Id PK
        int OrderId FK
        int ProductId FK
        int Quantity
        decimal UnitPrice
        decimal Subtotal
        datetime CreatedAt
    }

    PAYMENTS {
        int Id PK
        int OrderId FK, UK
        string Method
        string Status
        decimal Amount
        decimal ChangeFor
        datetime PaidAt
        datetime CreatedAt
    }

    LOGIN_ATTEMPTS {
        int Id PK
        string Email
        string IpAddress
        datetime AttemptedAt
        datetime ClearedAt
        int NumberOfAt
        datetime CreatedAt
    }

    BLOCKED_LOGINS {
        int Id PK
        string Email UK
        datetime BlockedAt
        int FailedAttempts
        datetime CreatedAt
    }

    STORE_SETTINGS {
        int Id PK
        string HeroImageUrl
    }
```

## Regras e decisões do modelo

- A API exige pelo menos um item ao criar o pedido; `ORDER_ITEMS` registra o preço unitário e o subtotal no momento da compra, preservando o histórico caso o preço do produto mude depois.
- `PRODUCTS.StockQuantity` é configurado como token de concorrência para ajudar a evitar inconsistências em atualizações simultâneas de estoque.
- Uma categoria não pode ser removida enquanto houver produtos vinculados; variantes dependem do produto e são removidas em cascata.
- Os itens e o pagamento são removidos em cascata quando seu pedido é removido. Os produtos referenciados por itens ou movimentações não são removidos em cascata.
- O relacionamento entre `ORDERS` e `PAYMENTS` é um-para-zero-ou-um; `PAYMENTS.OrderId` é a chave estrangeira e possui unicidade.
- Categorias, e-mails de usuários, e-mails bloqueados, números de pedido e a combinação produto/identificação de variante têm restrições de unicidade.
- `LOGIN_ATTEMPTS` e `BLOCKED_LOGINS` são trilhas independentes: o modelo não define uma relação por chave estrangeira entre elas nem com `USERS`.
- `STORE_SETTINGS` é uma configuração singleton na aplicação, inicializada com `Id = 1`; não há relacionamento com outras entidades.
- Estados e tipos de domínio são enums na aplicação. Alguns são persistidos como texto pelo mapeamento do Entity Framework Core.

## Fluxo principal

1. Uma categoria agrupa produtos; cada produto pode oferecer várias variantes de preço e disponibilidade.
2. Um pedido guarda os dados de contato e entrega do cliente e possui uma ou mais linhas em `ORDER_ITEMS`.
3. Cada linha aponta para um produto e conserva quantidade, preço unitário e subtotal da compra.
4. A criação do pedido reduz o estoque do produto e registra as respectivas movimentações em `STOCK_MOVEMENTS`.
5. O pagamento acompanha o pedido e pode registrar o método, valor, troco, status e data de quitação.

## Implementação

- **SGBD:** PostgreSQL 16
- **ORM:** Entity Framework Core 8
- **Provider:** Npgsql
- **Contexto:** `AppDbContext`
- **Versionamento do esquema:** migrations do Entity Framework Core
- **Execução local:** container Docker Compose com volume persistente para os dados

> O diagrama representa as entidades e os relacionamentos configurados no código. Regras de negócio e restrições de validação adicionais podem ser aplicadas pela API sem corresponder a uma constraint física do banco.

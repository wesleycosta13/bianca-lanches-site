# Lanchonete Mãe

Sistema de cardápio e pedidos para uma lanchonete. O cliente consulta o catálogo e envia pedidos; a área administrativa gerencia pedidos, status, produtos, variantes, preços e disponibilidade.

## Stack

- Frontend: React 18, TypeScript, Vite e Lucide.
- Backend: ASP.NET Core 8, REST API, JWT e Entity Framework Core.
- Banco: PostgreSQL 16.
- Deploy local/containerizado: Docker Compose, API ASP.NET e Nginx não privilegiado.

## Funcionalidades

- Catálogo público com busca, categorias, variantes e carrinho.
- Confirmação de pedido no frontend e gravação pela API.
- Área administrativa em `/admin`, protegida por papel `Admin`.
- Consulta de pedidos e atualização de status; mensagens de andamento são abertas no WhatsApp para envio manual.
- Gestão de produtos, imagens por URL, variantes/preços e disponibilidade.
- Pagamento criado como pendente e marcado como pago quando o pedido é entregue.
- Reserva de estoque no cadastro do pedido, validação por variante e controle de concorrência.
- Bloqueio permanente do e-mail após 5 falhas de login em 15 minutos; um administrador pode consultar IPs e liberar o acesso na seção Segurança do painel. Senhas tentadas não são armazenadas.

## Requisitos

- Docker Engine/Desktop com Docker Compose.
- Para desenvolvimento sem containers: .NET 8 SDK e Node.js.

## Configuração de ambiente

Copie `.env.example` para `.env` e substitua os placeholders por valores próprios. Configure `WHATSAPP_CONTATO` no `.env`; a API o fornece ao frontend em tempo de execução, sem incorporá-lo ao bundle estático. Não compartilhe nem versione `.env`.

## Docker Compose

Com `.env` preenchido, construa e inicie PostgreSQL, API e frontend:

```powershell
docker compose up --build -d
```

Acesse a loja em `http://localhost:8080` e o painel administrativo.

Comandos úteis:

```powershell
docker compose ps
docker compose logs -f api
docker compose logs -f frontend
docker compose down
```

`docker compose down` preserva os dados locais do banco. Evite remover volumes se precisar manter esses dados.

## Desenvolvimento local

1. Inicie somente o banco:

   ```powershell
   docker compose up -d postgres
   ```

2. Inicie a API pelo perfil HTTPS. O `.env` fornece a configuração local:

   ```powershell
   dotnet run --project .\src\backend\Salgados.Api --launch-profile https
   ```

3. Em outro terminal, inicie o frontend:

   ```powershell
   Push-Location .\frontend
   npm ci
   npm run dev
   Pop-Location
   ```

   A vitrine fica em `http://localhost:5173`; o painel fica em `http://localhost:5173/admin`.

## Testes e verificações

```powershell
dotnet test .\Salgados.sln
npm --prefix .\frontend run build
dotnet list .\Salgados.sln package --vulnerable --include-transitive
Push-Location .\frontend
npm audit
Pop-Location
```

Execute as verificações antes de publicar alterações. Revise dependências e configurações do ambiente de implantação.
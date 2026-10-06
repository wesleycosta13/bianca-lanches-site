# Plano e Roteiro de Testes Manuais (BDD) — Bianca Lanches

Este documento descreve os casos de teste manuais estruturados no padrão BDD (Dado, Quando, Então) com pré-requisitos para validação funcional, usabilidade, responsividade e segurança da aplicação Bianca Lanches.

---

## 1. Matriz de Cobertura de Testes

| Módulo | Identificador | Prioridade |
| :--- | :--- | :---: |
| 1. Vitrine & Catálogo | TC-CAT-01 a TC-CAT-06 | Alta |
| 2. Sacola & Carrinho | TC-CART-01 a TC-CART-06 | Crítica |
| 3. Checkout & Pedido | TC-CHK-01 a TC-CHK-06 | Crítica |
| 4. Responsividade Mobile | TC-MOB-01 a TC-MOB-04 | Alta |
| 5. Painel Administrativo | TC-ADM-01 a TC-ADM-07 | Crítica |
| 6. Segurança & Acesso | TC-SEC-01 a TC-SEC-03 | Alta |

---

## Módulo 1: Vitrine e Catálogo (Storefront)

### TC-CAT-01: Carregamento Inicial da Vitrine
- **Objetivo:** Garantir que a página inicial carrega com identidade visual, logotipo e chamada para ação (CTA).
- **Pré-requisitos:** Aplicação frontend e backend em execução (`http://localhost:5173` ou `http://localhost:8080`).
- **Cenário:**
  - **Dado** que o usuário acessa a URL raiz da loja (`/`)
  - **Quando** a página terminar de carregar
  - **Então** o logotipo e o nome da marca "BIANCA" devem estar visíveis no cabeçalho
  - **E** o título principal (Hero) contendo a proposta de valor deve ser exibido
  - **E** o botão de ação "Ver cardápio" deve estar visível e clicável

---

### TC-CAT-02: Navegação e Âncora para o Cardápio
- **Objetivo:** Verificar a rolagem suave até a seção de cardápio ao clicar no CTA.
- **Pré-requisitos:** Estar na página inicial da aplicação.
- **Cenário:**
  - **Dado** que o usuário está na página inicial visualizando a seção Hero
  - **Quando** o usuário clica no botão "Ver cardápio"
  - **Então** a página deve rolar suavemente até a seção `#cardapio`
  - **E** a lista de produtos e abas de categorias devem estar visíveis na viewport

---

### TC-CAT-03: Filtragem de Produtos por Categorias
- **Objetivo:** Verificar o filtro de produtos por abas de categorias.
- **Pré-requisitos:** Produtos cadastrados em múltiplas categorias no banco de dados.
- **Cenário:**
  - **Dado** que o usuário está navegando na seção de cardápio (`#cardapio`)
  - **Quando** o usuário clica na aba "Bebidas"
  - **Então** apenas os produtos pertencentes à categoria "Bebidas" devem ser exibidos
  - **Quando** o usuário clica na aba "Todos"
  - **Então** todos os itens de todas as categorias devem voltar a ser exibidos

---

### TC-CAT-04: Busca em Tempo Real por Nome de Produto
- **Objetivo:** Validar o filtro dinâmico de busca por texto.
- **Pré-requisitos:** Produtos cadastrados com nomes conhecidos (ex: "Coxinha").
- **Cenário:**
  - **Dado** que o usuário está na seção de cardápio
  - **Quando** o usuário digita `"Coxinha"` no campo de busca "Buscar no cardápio"
  - **Então** apenas os cards correspondentes a `"Coxinha"` devem permanecer visíveis
  - **Quando** o usuário clica no botão `"X"` (Limpar busca)
  - **Então** o campo de busca deve ser esvaziado e todos os produtos devem reaparecer

---

### TC-CAT-05: Busca com Termo Inexistente
- **Objetivo:** Validar o estado visual quando a busca não retorna resultados.
- **Pré-requisitos:** Estar na seção de cardápio com campo de busca ativo.
- **Cenário:**
  - **Dado** que o usuário está na seção de cardápio
  - **Quando** o usuário digita um termo inexistente como `"ItemInexistente12345"`
  - **Então** a mensagem "Nenhum item encontrado" deve ser exibida em destaque
  - **E** nenhum card de produto deve ser apresentado

---

### TC-CAT-06: Seleção de Variantes de Tamanho no Card de Produto
- **Objetivo:** Validar a seleção de diferentes tamanhos/preços no produto.
- **Pré-requisitos:** Produto com variantes ativas cadastrado (ex: Pastel com tamanhos P, G, GG).
- **Cenário:**
  - **Dado** que o usuário localiza um produto com múltiplas opções (ex: "Pastel de Carne")
  - **Quando** o usuário seleciona a variação `"G"` no dropdown de tamanhos
  - **Então** o preço exibido no card do produto deve ser atualizado para o valor correspondente ao tamanho `"G"`

---

## Módulo 2: Sacola e Carrinho de Compras

### TC-CART-01: Estado Inicial da Sacola Vazia
- **Objetivo:** Verificar a exibição da sacola sem itens adicionados.
- **Pré-requisitos:** Sessão do navegador limpa sem itens prévios no carrinho.
- **Cenário:**
  - **Dado** que o usuário acessa a loja sem ter adicionado nenhum item
  - **Quando** o usuário observa o painel lateral desktop "Seu pedido"
  - **Então** a mensagem "Sua sacola está vazia" deve estar visível
  - **E** o valor do total parcial deve ser exibido como `"R$ 0,00"`
  - **E** os campos de entrega não devem estar visíveis

---

### TC-CART-02: Adição de Produto ao Carrinho
- **Objetivo:** Validar a inclusão de um item na sacola.
- **Pré-requisitos:** Catálogo carregado com produtos disponíveis para venda.
- **Cenário:**
  - **Dado** que o usuário está visualizando os produtos no cardápio
  - **Quando** o usuário clica no botão "Adicionar" do card de `"Carne"`
  - **Então** uma nova linha correspondente a `"Carne"` deve surgir no painel de pedido
  - **E** a quantidade inicial deve ser igual a `1`
  - **E** o total parcial deve ser atualizado com o valor do item

---

### TC-CART-03: Incremento de Quantidade do Item
- **Objetivo:** Validar o botão de aumentar quantidade (`+`).
- **Pré-requisitos:** Ter pelo menos 1 item já adicionado no carrinho.
- **Cenário:**
  - **Dado** que o item `"Carne"` já está adicionado ao carrinho com quantidade `1`
  - **Quando** o usuário clica no botão `+` ou clica novamente em "Adicionar" no card
  - **Então** o contador de quantidade do item deve ser atualizado para `2`
  - **E** o subtotal e o valor total do pedido devem duplicar proporcionalmente

---

### TC-CART-04: Decremento de Quantidade do Item
- **Objetivo:** Validar o botão de diminuir quantidade (`-`).
- **Pré-requisitos:** Ter pelo menos 1 item com quantidade maior ou igual a 2 no carrinho.
- **Cenário:**
  - **Dado** que o item `"Carne"` está na sacola com quantidade `2`
  - **Quando** o usuário clica no botão `-` (Diminuir)
  - **Então** a quantidade do item deve ser reduzida para `1`
  - **E** o valor total do pedido deve ser recalculado para o valor de uma única unidade

---

### TC-CART-05: Remoção do Item ao Zerar Quantidade
- **Objetivo:** Validar remoção automática do item ao atingir quantidade zero.
- **Pré-requisitos:** Ter exatamente 1 item com quantidade igual a 1 na sacola.
- **Cenário:**
  - **Dado** que o item `"Carne"` está na sacola com quantidade `1`
  - **Quando** o usuário clica no botão `-` / ícone de lixeira
  - **Então** o item deve ser totalmente removido da lista
  - **E** o painel deve exibir novamente o estado "Sua sacola está vazia"

---

### TC-CART-06: Cálculo Correto com Múltiplos Itens e Variantes
- **Objetivo:** Validar cálculo exato com diferentes produtos e tamanhos.
- **Pré-requisitos:** Produtos e variantes com preços distintos disponíveis no cardápio.
- **Cenário:**
  - **Dado** que o usuário adiciona 1 Pastel de Carne tamanho `"G"`
  - **E** adiciona 1 Coxinha
  - **Quando** o usuário confere o painel de pedidos
  - **Então** devem existir 2 linhas distintas na sacola
  - **E** o "Total parcial" deve ser exatamente igual à soma dos preços dos dois itens selecionados

---

## Módulo 3: Checkout e Finalização do Pedido

### TC-CHK-01: Exibição Condicional dos Campos de Entrega
- **Objetivo:** Garantir que os campos de entrega só aparecem quando há itens no carrinho.
- **Pré-requisitos:** Acessar a aplicação no desktop.
- **Cenário:**
  - **Dado** que a sacola do usuário está vazia
  - **Então** os campos "Bairro", "Rua", "Número" e "Forma de pagamento" não devem ser exibidos
  - **Quando** o usuário adiciona ao menos 1 produto à sacola
  - **Então** a seção de checkout com os campos de endereço e pagamento deve se tornar visível

---

### TC-CHK-02: Habilitação do Botão "Fechar pedido"
- **Objetivo:** Validar a obrigatoriedade dos campos de entrega e pagamento.
- **Pré-requisitos:** Ter pelo menos 1 item adicionado na sacola.
- **Cenário:**
  - **Dado** que há itens na sacola mas os campos de endereço estão vazios
  - **Então** o botão "Fechar pedido" não deve estar visível
  - **Quando** o usuário preenche "Bairro" e "Rua", mantendo a forma de pagamento vazia
  - **Então** o botão "Fechar pedido" ainda não deve ser exibido
  - **Quando** o usuário seleciona uma forma de pagamento (ex: `"Pix"`)
  - **Então** o botão "Fechar pedido" deve surgir imediatamente

---

### TC-CHK-03: Abertura e Revisão do Modal de Confirmação
- **Objetivo:** Conferir o resumo completo do pedido no modal de revisão.
- **Pré-requisitos:** Item adicionado na sacola e dados de entrega e pagamento preenchidos.
- **Cenário:**
  - **Dado** que o usuário preencheu Bairro `"Centro"`, Rua `"Rua das Flores"`, Número `"123"` e Pagamento `"Pix"`
  - **Quando** o usuário clica em "Fechar pedido"
  - **Então** o modal "Revise seu pedido" deve ser aberto em tela
  - **E** os itens, endereço digitado e forma de pagamento devem ser exibidos com fidelidade no resumo

---

### TC-CHK-04: Validação de Dados Obrigatórios do Cliente (Cenário Negativo)
- **Objetivo:** Impedir confirmação do pedido sem os dados de contato do cliente.
- **Pré-requisitos:** Modal de revisão "Revise seu pedido" aberto em tela.
- **Cenário:**
  - **Dado** que o modal de confirmação está aberto
  - **Quando** o usuário clica no botão "Confirmar pedido" sem preencher nome, telefone e cidade
  - **Então** uma mensagem de alerta em destaque deve ser exibida informando: `"Preencha seu nome, telefone e cidade para concluir o pedido"`
  - **E** o pedido não deve ser enviado à API

---

### TC-CHK-05: Envio e Confirmação de Pedido com Sucesso (Cenário Positivo)
- **Objetivo:** Validar o envio com sucesso e a tela de confirmação final.
- **Pré-requisitos:** Modal de confirmação aberto e API backend ativa para receber pedidos.
- **Cenário:**
  - **Dado** que o modal de revisão está aberto com itens e endereço válidos
  - **Quando** o usuário preenche Nome: `"Carlos Oliveira"`, Telefone: `"86999991122"`, Cidade: `"Teresina"`
  - **E** clica em "Confirmar pedido"
  - **Então** o botão deve apresentar estado de carregamento ("Enviando pedido...")
  - **E** a tela de sucesso "Recebemos seu pedido!" deve ser exibida
  - **E** um código identificador exclusivo (ex: `#PED-...`) deve ser apresentado ao cliente

---

### TC-CHK-06: Limpeza Automática da Sacola após Pedido Confirmado
- **Objetivo:** Garantir que o carrinho é esvaziado após o pedido ser concluído.
- **Pré-requisitos:** Ter acabado de concluir um pedido com sucesso (tela "Recebemos seu pedido!").
- **Cenário:**
  - **Dado** que o cliente visualiza a tela de sucesso do pedido no modal
  - **Quando** o cliente clica no botão "Voltar ao cardápio"
  - **Então** o modal deve ser fechado
  - **E** o painel lateral deve apresentar a sacola totalmente vazia

---

## Módulo 4: Responsividade Mobile

### TC-MOB-01: Exibição do Botão Flutuante da Sacola
- **Objetivo:** Validar a acessibilidade da sacola em dispositivos móveis.
- **Pré-requisitos:** Dispositivo móvel ou navegador com viewport inferior a 768px (ex: 390x844px).
- **Cenário:**
  - **Dado** que o usuário acessa o sistema através de um dispositivo com tela reduzida (viewport mobile)
  - **Quando** a página carregar
  - **Então** o botão flutuante "Sua sacola" deve estar fixo na parte inferior da tela
  - **E** deve exibir o total de itens e o valor acumulado

---

### TC-MOB-02: Abertura e Fechamento do Drawer da Sacola
- **Objetivo:** Validar abertura e fechamento da sacola em formato bottom-sheet.
- **Pré-requisitos:** Viewport móvel ativa com a loja carregada.
- **Cenário:**
  - **Dado** que o usuário está navegando no celular
  - **Quando** o usuário toca no botão flutuante "Sua sacola"
  - **Então** o drawer (gaveta inferior) deve deslizar para cima exibindo o título "Seu pedido"
  - **Quando** o usuário toca no botão `"X"` (Fechar sacola)
  - **Então** o drawer deve deslizar para baixo e fechar completamente

---

### TC-MOB-03: Abertura Automática ao Adicionar Produto no Mobile
- **Objetivo:** Prover feedback imediato da sacola ao cliente mobile.
- **Pré-requisitos:** Viewport móvel ativa na seção de cardápio.
- **Cenário:**
  - **Dado** que o usuário está visualizando os produtos no dispositivo móvel
  - **Quando** o usuário clica em "Adicionar" em qualquer item do cardápio
  - **Então** o drawer da sacola deve se abrir automaticamente revelando o item recém-adicionado

---

### TC-MOB-04: Fechamento por Toque no Fundo Escuro (Overlay)
- **Objetivo:** Permitir fechamento natural do modal ao tocar fora da área de conteúdo.
- **Pré-requisitos:** Drawer mobile aberto em tela.
- **Cenário:**
  - **Dado** que o drawer da sacola mobile está aberto
  - **Quando** o usuário clica/toca na área escura de fundo (overlay)
  - **Então** o drawer deve ser fechado imediatamente sem afetar os itens contidos na sacola

---

## Módulo 5: Painel Administrativo (Admin)

### TC-ADM-01: Bloqueio de Acesso não Autenticado à Rota `/admin`
- **Objetivo:** Garantir que a área administrativa é restrita a usuários autorizados.
- **Pré-requisitos:** Navegador sem token de administração gravado em sessionStorage/cookies.
- **Cenário:**
  - **Dado** que o usuário não possui uma sessão ativa de administrador
  - **Quando** o usuário navega diretamente para a rota `/admin`
  - **Então** o painel de pedidos não deve ser exibido
  - **E** a tela de login administrativo deve ser apresentada com os campos de e-mail e senha
  - **E** deve existir um link acessível "Voltar para a loja"

---

### TC-ADM-02: Tentativa de Login com Credenciais Inválidas (Cenário Negativo)
- **Objetivo:** Validar tratamento de erro e proteção contra autenticação indevida.
- **Pré-requisitos:** Estar na tela de login administrativo (`/admin`).
- **Cenário:**
  - **Dado** que o usuário está na tela de login administrativo
  - **Quando** o usuário informa E-mail: `"usuario@invalido.com"` e Senha: `"SenhaErrada123"`
  - **E** clica no botão "Entrar"
  - **Então** uma mensagem de erro em destaque (`role="alert"`) deve ser exibida
  - **E** o acesso ao painel de pedidos deve permanecer bloqueado

---

### TC-ADM-03: Autenticação de Administrador com Sucesso (Cenário Positivo)
- **Objetivo:** Validar autenticação e carregamento do painel gerencial.
- **Pré-requisitos:** Usuário administrador cadastrado no banco (ex: `admin123456@gmail.com` / `admin12345678`).
- **Cenário:**
  - **Dado** que o administrador está na tela de login
  - **Quando** o administrador informa credenciais válidas e clica em "Entrar"
  - **Então** o token JWT deve ser gravado na sessão
  - **E** o dashboard administrativo deve ser exibido com o título "Pedidos"
  - **E** o nome do administrador e as abas "Pedidos", "Produtos" e "Segurança" devem estar visíveis

---

### TC-ADM-04: Filtragem e Busca na Lista de Pedidos
- **Objetivo:** Validar filtros operacionais de pedidos em tempo real.
- **Pré-requisitos:** Estar autenticado no painel admin com pedidos registrados no banco.
- **Cenário:**
  - **Dado** que o operador está autenticado na aba "Pedidos"
  - **Quando** o operador seleciona o status `"Recebido"` no filtro
  - **E** digita o número ou nome de um cliente no campo de busca
  - **Então** a lista deve exibir apenas os pedidos que atendem simultaneamente aos filtros selecionados

---

### TC-ADM-05: Atualização do Status do Pedido e Notificação
- **Objetivo:** Validar o ciclo de vida do pedido e integração com WhatsApp.
- **Pré-requisitos:** Pedido existente com status "Recebido" visível na listagem.
- **Cenário:**
  - **Dado** que existe um pedido com status `"Recebido"` na listagem
  - **Quando** o operador altera o status do pedido para `"Em preparo"` ou `"Saiu para entrega"`
  - **Então** o status do pedido deve ser atualizado instantaneamente no banco de dados
  - **E** um botão/link "Abrir mensagem no WhatsApp" deve ser exibido com o texto padrão pré-configurado para notificar o cliente

---

### TC-ADM-06: Cadastro e Edição de Produtos no Catálogo
- **Objetivo:** Validar a gestão do cardápio pelo administrador.
- **Pré-requisitos:** Administrador autenticado com acesso à aba "Produtos".
- **Cenário:**
  - **Dado** que o administrador está autenticado e navega para a aba "Produtos"
  - **Quando** clica no botão "Novo produto"
  - **E** preenche o formulário com Nome, Descrição, Categoria, Preço, Estoque e clica em "Cadastrar produto"
  - **Então** uma notificação de sucesso "Produto cadastrado com sucesso" deve ser exibida
  - **E** o novo item deve constar imediatamente na lista do catálogo administrativo e na vitrine da loja

---

### TC-ADM-07: Encerramento de Sessão (Logout)
- **Objetivo:** Validar a destruição segura da sessão administrativa.
- **Pré-requisitos:** Administrador com sessão ativa no painel administrativo.
- **Cenário:**
  - **Dado** que o administrador está operando o painel administrativo
  - **Quando** o administrador clica no botão "Sair" (Logout)
  - **Então** a sessão local e o token de acesso devem ser expurgados
  - **E** a aplicação deve redirecionar o navegador de volta para a tela de login restrito

---

## Módulo 6: Segurança e Proteção de Acesso

### TC-SEC-01: Proteção de Rotas da API sem Token JWT
- **Objetivo:** Garantir que endpoints protegidos rejeitam requisições sem autenticação.
- **Pré-requisitos:** API backend ativa em execução.
- **Cenário:**
  - **Dado** que um cliente HTTP realiza uma requisição `GET` para a rota `/api/orders`
  - **Quando** a requisição for enviada sem o cabeçalho `Authorization: Bearer <token>`
  - **Então** o servidor deve responder imediatamente com o status HTTP `401 Unauthorized`
  - **E** nenhum dado confidencial de clientes ou pedidos deve ser retornado

---

### TC-SEC-02: Resiliência contra Injeções de Código (SQLi / XSS)
- **Objetivo:** Validar sanitização de entradas no formulário de acesso.
- **Pré-requisitos:** Tela de login `/admin` acessível.
- **Cenário:**
  - **Dado** que o usuário está na tela de login restrito
  - **Quando** o usuário preenche o campo de e-mail com payloads maliciosos (ex: `' OR '1'='1` ou `<script>alert(1)</script>`)
  - **E** tenta submeter o formulário
  - **Então** a aplicação deve sanitizar os dados e tratar a tentativa como credenciais inválidas
  - **E** nenhum script malicioso deve ser executado no navegador

---

### TC-SEC-03: Monitoramento de IPs e Liberação Manual de Acessos
- **Objetivo:** Permitir auditoria e liberação de acessos bloqueados por rate-limit.
- **Pré-requisitos:** Administrador autenticado com acesso à aba "Segurança".
- **Cenário:**
  - **Dado** que o administrador está autenticado no painel
  - **Quando** o administrador acessa a aba "Segurança"
  - **Então** a lista de acessos bloqueados e monitoramento de tentativas por IP deve ser exibida
  - **Quando** o administrador clica em "Zerar (0)" ou "Liberar acesso" em um registro
  - **Então** o contador de tentativas daquele IP deve ser redefinido e o acesso restabelecido

---

## Template de Registro de Execução Manual

| ID | Cenário | Data | Executor | Ambiente / Dispositivo | Status (Pass / Fail) | Evidências / Notas |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| TC-CAT-01 | Carregamento da vitrine | __/__/____ | QA Tester | Chrome 124 (Desktop) | [ ] Pass / [ ] Fail | |
| TC-CART-02 | Adicionar item ao carrinho | __/__/____ | QA Tester | Chrome 124 (Desktop) | [ ] Pass / [ ] Fail | |
| TC-CHK-05 | Confirmação com sucesso | __/__/____ | QA Tester | Firefox 125 (Desktop)| [ ] Pass / [ ] Fail | |
| TC-MOB-01 | Botão sacola mobile | __/__/____ | QA Tester | Safari (iOS 17)      | [ ] Pass / [ ] Fail | |
| TC-ADM-03 | Login admin válido | __/__/____ | QA Tester | Edge 124 (Desktop)   | [ ] Pass / [ ] Fail | |
| TC-SEC-01 | Proteção de rota API | __/__/____ | QA Tester | Postman / Insomnia   | [ ] Pass / [ ] Fail | |

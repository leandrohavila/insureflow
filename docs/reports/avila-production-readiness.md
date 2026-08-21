# Ávila Corretora — Prontidão operacional (CRM-006.4)

**Data:** 21 de agosto de 2026  
**Ambiente:** API `:4000`, web `:3000`, PostgreSQL `insureflow`, Redis `127.0.0.1:6379`  
**Tenant:** `insureflow`  
**Massa:** lote `058324` (leads + 4 apólices 60/30/15/vencida + 4 atividades de agenda)  
**Modelos oficiais:** `docs/templates/importacao/LEADS.xlsx` e `docs/templates/importacao/CLIENTES.xlsx`

## Veredito

# APROVADO COM RESSALVAS — 74% de prontidão operacional neste módulo

O núcleo pedido (importar carteira, ver vencimentos, criar deal de renovação, controlar agenda e abrir o 360) **funcionou em runtime** contra banco e Redis reais, e as telas abriram no front com usuário admin autenticado.

Não está pronto para produção plena: WhatsApp/Cidade/UF **ainda não têm coluna própria**, o comercial **não importa clientes**, a listagem de clientes **não aplica ownership**, e o parceiro **não vê** carteira/agenda/360.

WhatsApp Inbox e Instagram **não entram** neste percentual (fora do escopo do CRM-006.4).

---

## Runtime da auditoria

| Dependência | Status |
|-------------|--------|
| API `/health` | ok |
| PostgreSQL `/health/db` | connected |
| Redis `/health/redis` | connected (`127.0.0.1:6379`) |
| Front `/login` → dashboard | 200 após login admin |
| Overlay Next (hydration `app-sidebar`) | residual; não gerou HTTP 500 nas telas do módulo |

---

## Fase 1 — Importador

### Modelos

Download da API bateu com o layout oficial (15 colunas de leads, 16 de clientes). Arquivos gerados em disco para a corretora.

### Preview e erros

Planilha inválida (sem nome, CPF `123`, prêmio `abc`):

- total 1 / válidos 0 / erros 3
- log CSV disponível (`Nome`, `CPF/CNPJ`, `Prêmio Atual`)

### Importação e upsert

| Passo | Resultado |
|-------|-----------|
| Commit leads | created 1 |
| Reimportar mesmo CPF | created 0, **updated 1** |
| Nome após upsert | `AVILA Lead 058324 ATUALIZADO` |
| Commit clientes (4 linhas) | created 4, policies 4 |
| Reimportar mesmos CPF | created 0, **updated 4**, policies 4 |

### Campos — Leads

| Campo | Obrigatório | Persistência |
|-------|-------------|--------------|
| Nome | sim | `leads.name` |
| CPF/CNPJ | não (se preenchido, deve ser válido) | `leads.document` — chave de upsert |
| Telefone | não | `leads.phone` |
| WhatsApp | não | **notes** (telefone usa WhatsApp só se Telefone vier vazio) |
| Email | não | `leads.email` |
| Cidade | não | **notes** |
| UF | não | **notes** |
| Origem | não | `leads.source` (default `importacao`) |
| Produto Interesse | não | `leads.interestCategories` (alias Auto → `AUTO_INSURANCE`) |
| Data Renovação | não | **notes** |
| Seguradora Atual | não | **notes** |
| Prêmio Atual | não | **notes** |
| Observações | não | `leads.notes` |
| Responsável | não | `ownerUserId` (e-mail/nome/id) |
| Business Unit | não | `businessUnitId` (slug `corretora-avila`) |

**Ainda vão para `notes`:** WhatsApp, Cidade, UF, Data Renovação, Seguradora Atual, Prêmio Atual.

Evidência no lead upsertado:

```
Auditoria produção
Cidade: Santos | UF: SP | WhatsApp: 13988880099 | Seguradora atual: Porto Seguro | Data renovação: 2026-10-05 | Prêmio atual: 3200
```

**Ignorados no modelo oficial (ainda aceitos como legado):** Empresa, Data Vencimento, Observação (singular).

### Campos — Clientes

| Campo | Obrigatório | Persistência |
|-------|-------------|--------------|
| Nome | sim | `customers.name` |
| CPF/CNPJ | sim, válido | `customers.document` — unique + upsert |
| Telefone | não | `customers.phone` |
| WhatsApp | não | só vira telefone se Telefone vazio; **sem coluna** |
| Email | não | `customers.email` |
| Cidade | não | **sem coluna — descartado no commit** |
| UF | não | **sem coluna — descartado no commit** |
| Produto | não* | `policies.productLine` / `policy_renewals.product` |
| Seguradora | não* | `policies.insurer` |
| Número Apólice | não* | `policies.policyNumber` (unique no tenant) |
| Vigência Inicial / Final | não* | `effectiveFrom` / `effectiveTo` e fila de renovação |
| Prêmio | não | `policies.premiumValue` |
| Responsável | não | `ownerUserId` / `brokerUserId` |
| Business Unit | não | `businessUnitId` |
| Observações | não | **sem coluna em customer — descartado** |

\*Apólice + fila só são criadas se vierem **Número Apólice + Seguradora + Produto + Vigência Final**.

**Resposta direta:** WhatsApp, Cidade e UF **ainda não têm coluna**. No lead, entram em `notes`. No cliente, Cidade/UF/Observações são perdidos; WhatsApp só preenche `phone` se o telefone estiver vazio.

---

## Fase 2 — Layout oficial

Arquivos:

- `docs/templates/importacao/LEADS.xlsx`
- `docs/templates/importacao/CLIENTES.xlsx`

Cabeçalhos oficiais (nesta ordem). Há uma linha de exemplo para orientar; **apagar antes de importar a carteira real**.

O botão **Baixar Modelo** da UI gera o mesmo cabeçalho.

---

## Fase 3 — Carteira de renovação

Massa `AVILA-058324-*`:

| Apólice | Dias | Filtro 30 | Filtro 60 | Filtro 90 | Período vencido |
|---------|------|-----------|-----------|-----------|-----------------|
| d60 | 60 | não | não no 1º corte* | sim | não |
| d30 | 30 | sim (após correção do fim do dia) | sim | sim | não |
| d15 | 15 | sim | sim | sim | não |
| overdue | −10 | não | não | não | sim (`from`/`to`) |

\*No primeiro corte, “vence em 30 dias” **excluía o dia 30** (limite UTC 00:00). Corrigido para incluir o fim do dia. Reprobe: **dueInDays=30 → 2 apólices** (d15 + d30).

Ordenação da API: `endDate` / `renewalDate` crescente (vencida primeiro, depois 15, 30, 60).

**Deal de renovação:** `POST /policy-renewals/:id/deal` → HTTP 201, `dealId=cmt32liuk0039kwb4wr0al3wh`, **`sourceType=RENEWAL`**.

UI `/crm/renovacoes-carteira`: filtros 30/60/90/personalizado, ações 360 / Deal / Atividade / Pipeline. Sem contador numérico no cabeçalho (os totais vêm da lista). SLA da carteira = `daysUntil`, não o SLA de estágio do Kanban.

---

## Fase 4 — Agenda comercial

Atividades criadas no cliente de 15 dias: overdue (−2), hoje, +7, +28. Apareceram no 360 (aba Agenda) e no dashboard (“Follow-up AVILA agenda today 058324”).

UI `/crm/agenda` (admin):

| KPI | Valor |
|-----|-------|
| Atividades hoje | 16 |
| Atrasadas | 52 |
| Renovações próximas | 3 |
| Reativações pendentes | 0 |
| SLA atrasados | 24 |

Visões Hoje / Atrasadas / 7 / 30 e tipos Follow-up, Renovação, Reativação, SLA, Ligação, WhatsApp, Email, Reunião estão na tela.

Durante a auditoria, **comercial recebia HTTP 500** na agenda (filtro de BU aplicado em `deal` com shape de lead). Corrigido; reprobe comercial: **200**, 16 itens hoje.

---

## Fase 5 — Ownership (runtime)

Quantidades no momento da auditoria (listagens paginadas).

| Persona | Leads (total) | Clientes | Renovações | Agenda | Importar leads | Importar clientes | Criar lead | Editar/excluir lead | Customer 360 |
|---------|---------------|----------|------------|--------|----------------|-------------------|------------|---------------------|--------------|
| **admin** | 40 (200) | 18 (200) | 10 (200) | 27 (200) | 201 | 201 | 201 | 200 / 200 | 200 |
| **gerencia** | **3** (200) | 18 (200) | 10 (200) | 27 (200) | 201 | 201 | 201 | 200 / 200 | 200 |
| **comercial** | **4** (200) | 18 (200) | 10 (200) | 200* | 201 | **403** | 201 | **404 / 404** no lead recém-criado | 200 |
| **parceiro** | **1** (200) | **403** | **403** | **403** | **403** | **403** | **403** | 403 | **403** |

\*Agenda comercial: 500 na 1ª passagem; 200 após o patch.

Leitura:

- Ownership **funciona em leads** (admin vê todos; gerência time; comercial próprios; parceiro compartilhado).
- Clientes e renovação **não recortam por dono** — comercial e gerência viram os **mesmos 18 / 10** que o admin.
- Comercial **não gerencia clientes** (`clients:manage` ausente) — não pode importar carteira.
- Lead criado pelo comercial **sem dono explícito** some da própria visão (PATCH/DELETE 404). Importação com coluna Responsável = `comercial@...` atribui dono corretamente.

---

## Fase 6 — Customer 360

Cliente `AVILA Ren 15d 058324` (`cmt32lifz002pkwb4f4v5gkra`).

| Aba pedida | Onde está | Runtime |
|------------|-----------|---------|
| Dados | **Cabeçalho** (não há aba “Dados”) — CPF, telefone, e-mail, responsável Bruno Comercial | 200 |
| Timeline | Aba Timeline | evento “Renovação criada” |
| Agenda | Aba Agenda | 4 futuras (overdue/hoje/7/30); concluídas vazio |
| Renovações | Aba Renovações | R$ 3.700 segurado, 1 futura, histórico da apólice |
| Negócios | Aba Negócios | presente (0 deals neste cliente de 15d; deal RENEWAL está no cliente de 30d) |
| Financeiro | Aba Financeiro | payload `finance` 200 |

HTTP 360 admin/gerencia/comercial: **200**. Parceiro: **403**. Nenhum 500 no endpoint.

ACL: `clients:view` no 360; parceiro sem a permissão.

---

## Fase 7 — Posso operar?

| Pergunta | Classificação | Comentário |
|----------|---------------|------------|
| 1. Posso importar meus leads reais? | **APROVADO COM RESSALVAS** | Sim, com modelo oficial, preview e upsert por CPF. WhatsApp/cidade/UF ficam em notes. |
| 2. Posso importar minha carteira de clientes? | **APROVADO COM RESSALVAS** | Sim para admin/gerência; gera apólice + fila. Comercial 403. Cidade/UF do cliente não gravam. |
| 3. Posso controlar renovações reais? | **APROVADO COM RESSALVAS** | Carteira + filtros + deal `sourceType=RENEWAL`. Sem status “Proposta Enviada”. |
| 4. Posso controlar follow-ups reais? | **APROVADO COM RESSALVAS** | Agenda e 360 listam e filtram. Comercial não deve mais tomar 500. |
| 5. Posso iniciar operação comercial da Ávila neste módulo? | **APROVADO COM RESSALVAS** | **Pilotagem com gerência/admin, na Corretora Ávila, usando os XLSX oficiais.** Não abrir WhatsApp/Instagram ainda. Não usar parceiro neste fluxo. |

### Percentual

| Bloco | Peso | Nota | Ponderado |
|-------|------|------|-----------|
| Importador leads | 20 | 85 | 17 |
| Importador clientes + apólice | 25 | 72 | 18 |
| Carteira de renovação | 20 | 82 | 16 |
| Agenda comercial | 15 | 78 | 12 |
| Customer 360 | 10 | 85 | 9 |
| Ownership/ACL no módulo | 10 | 70 | 7 |
| **Total** | 100 | | **74** |

74% = operação assistida da carteira de seguros **neste módulo**. Não é go-live irrestrito da plataforma (inbox, Instagram, ownership de clientes e campos cadastrais nativos ainda faltam).

---

## Correções feitas durante a auditoria

1. Layout oficial de colunas (aliases para o modelo antigo).
2. Filtro “vence em N dias” inclui o último dia (23:59 UTC).
3. Agenda do perfil comercial: filtro de BU em `deal` deixou de usar shape de lead (eliminou HTTP 500).

---

## Pendências para subir de 74% para produção plena deste módulo

1. Colunas `whatsapp`, `city`, `uf` em lead e customer (parar de usar notes / descartar no cliente).
2. Ownership na listagem de clientes e na carteira (hoje o comercial vê a carteira inteira do tenant/BU).
3. `createLead` atribuir `ownerUserId` ao usuário logado.
4. Status comercial **Proposta Enviada**.
5. Filtro de corretor por nome, não por ID.
6. Hydration error residual no `app-sidebar` (não quebrou as telas, mas polui o front).

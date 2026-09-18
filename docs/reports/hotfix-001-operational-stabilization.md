# HOTFIX-001 — Estabilização comercial

**Data:** 20 de agosto de 2026  
**Ambiente:** local (`web` :3000, `api` :4000, PostgreSQL `insureflow`)  
**Escopo:** corrigir bloqueios da auditoria operacional. Sem telas novas. Sem CRM-007.

## Classificação

# APROVADO

Os quatro bloqueios da auditoria foram destravados com evidência de runtime: schema alinhado, Kanban lista os deals, Customer 360 abre, ownership filtra leads, fluxo Lead → Follow-up → Cliente → Deal → Pipeline → Won → Comissão fechou com comissão persistida.

---

## Fase 1 — Auditoria de migrations

Comando: `npx prisma migrate status` em `packages/database`.

### Antes do hotfix

- 27 migrations no disco
- **Pendente:** `20260820250000_sales_targets_commissions`
- Banco sem `deals.product_type`
- Tabelas `sales_targets`, `sales_commissions`, `commission_rules` **inexistentes**
- Prisma Client já esperava esses objetos → `GET /crm/deals`, `GET /customers/:id/360`, performance e executivo em **500**

### Ação

```
npx prisma migrate deploy
```

Aplicada: `20260820250000_sales_targets_commissions`.

Status final: **Database schema is up to date.**

### Migrations aplicadas (27/27)

| Migration | Aplicada |
|-----------|----------|
| 20260220120000_enterprise_init | sim |
| 20260517193000_add_crm_deals | sim |
| 20260517202000_add_customers | sim |
| 20260518002800_add_leads | sim |
| 20260518132500_add_questionnaires | sim |
| 20260519120000_lead_document_and_contact | sim |
| 20260520120000_deal_pipeline_order | sim |
| 20260520140000_add_activities | sim |
| 20260521000000_add_activity_status | sim |
| 20260521143000_backfill_submission_deal_id | sim |
| 20260523143558_npx_prisma_generate | sim |
| 20260523180000_add_policies | sim |
| 20260523200000_policy_enums_and_activity_policy | sim |
| 20260523210000_ensure_activity_policy_id | sim |
| 20260527120000_ownership_foundations | sim |
| 20260701120000_add_quotes_domain | sim |
| 20260703120000_proposal_center | sim |
| 20260708153000_deal_owner_user_id | sim |
| 20260724170000_questionnaire_submission_updated_by | sim |
| 20260820120000_multiempresa_reactivation | sim |
| 20260820180000_commercial_recovery | sim |
| 20260820190000_commercial_communication | sim |
| 20260820200000_user_business_units | sim |
| 20260820220000_evolution_api | sim |
| 20260820230000_customer_360_opportunities | sim |
| 20260820240000_sales_pipeline_inteligente | sim |
| 20260820250000_sales_targets_commissions | **sim (esta sessão)** |

### Pendentes

Nenhuma.

### Divergências schema × banco (após deploy)

| Objeto | Antes | Depois |
|--------|-------|--------|
| `deals.product_type` | ausente | presente |
| `sales_targets` | ausente | presente |
| `sales_commissions` | ausente | presente |
| `commission_rules` | ausente | presente |
| `prisma migrate status` | 1 pending | up to date |

Nenhuma feature nova: só a migration que já existia no repositório e não tinha sido aplicada.

---

## Fase 2 — `GET /crm/deals`

| Checagem | Resultado |
|----------|-----------|
| API `GET /api/v1/crm/deals?limit=50` (admin) | **200** `total=33` `n=33` (depois do fluxo: **34**) |
| UI `/crm/negocios` | **33 registros no banco · 30 em aberto** |
| Cards no Kanban | Sim (ex.: `Lead: TTTT`, `TESTE NEGÓCIO NOVO`, `Lead: LEAD NOVO NEGÓCIO`) |

Causa do 500: Prisma selecionava `product_type` em tabela sem a coluna.

Correção: `migrate deploy`. Sem mudança de código da API de deals.

---

## Fase 3 — Customer 360

Rota real: `GET /api/v1/customers/:id/360` (web: `/crm/customer-360/:id`).

| Checagem | Resultado |
|----------|-----------|
| Cliente existente `cmt1yr8dv0040kwg42ps28pfb` | **200**; payload com timeline, pendencies, finance, leads, deals, policies, properties, communications, followUps, renewals, crossSell |
| Cliente do fluxo `cmt2bkpr2000dkwgodsie25uo` | **200**; `deals=1` `timeline=12` `followUps=1` `financeClosed=1` `financeRev=10000` comissões=1 |
| UI | Abre **HOTFIX001 Fluxo 231752**; abas Timeline, Pendências, Financeiro, Leads, Negócios, Apólices, Imóveis, Comunicações, Follow-ups, Renovações, Cross-sell |
| Aba Financeiro | Receita **R$ 10.000**, 1 negócio fechado, produto **AUTO**, comissão **R$ 1.500 · 15% · PENDING** |
| Aba Negócios | `HOTFIX001 Deal 231752` · fechado · R$ 10.000 · origem LEAD · Bruno Comercial |

Causa do 500: `salesCommission.findMany` em tabela inexistente.

---

## Fase 4 — Ownership

### Ativação

1. `tenants.settings.ownershipEnforcement` = **`on`** (antes estava `shadow`).
2. `OWNERSHIP_ENFORCEMENT=on` em `.env` (raiz), `apps/api/.env` e examples locais.

Precedência no código: env > `tenant.settings` > `off`. Com tenant `on`, o filtro vale mesmo sem restart da API.

### Validação (API, totais de lista)

| Persona | Leads | Clientes | Deals | Notas |
|---------|-------|----------|-------|--------|
| admin | 35 → 36 após fluxo | 8 → 9 | 33 → 34 | Escopo tenant |
| gerencia | **1** | 8 | 0 (antes do fluxo) | Escopo **team**; 1 lead da equipe |
| comercial | **1** → **2** após criar o lead HOTFIX | 8 | **0** → **1** | Escopo **own** |
| parceiro | **1** | **403** | **403** | Escopo **shared**; RBAC bloqueia clientes/deals |

Antes (auditoria, enforcement efetivo `off`/`shadow` sem filtro): comercial e parceiro viam **35** leads.

### Falha residual (fora do bloqueio da auditoria)

Lista de **clientes** de gerência/comercial continua **8** (não há filtro de ownership em `CustomersService`; só BU). Leads e deals passaram a filtrar. Não foi adicionado scoping novo de clientes nesta hotfix.

---

## Fase 5 — Fluxo completo

Produto existente: Cliente pode ser cadastrado antes; **WON vincula** o deal ao cliente (mesmo documento). Convert do lead cria o Deal.

### Evidências

| Passo | Quem | HTTP | IDs / dados |
|-------|------|------|-------------|
| Cliente | gerencia `POST /customers` | 201 implícito (lista posterior) | `cmt2bkpr2000dkwgodsie25uo` · CPF `39053344705` · `HOTFIX001 Fluxo 231752` |
| Lead | comercial `POST /leads` | criado | `cmt2bkptu000fkwgoe5rewehu` · `status=converted` · owner comercial |
| Follow-up | comercial `POST /lead-follow-ups` | criado | `cmt2bkpwa000hkwgo89aqalvo` · `WHATSAPP` · `PENDING` |
| Deal (convert) | comercial `POST /leads/:id/convert` | criado | `cmt2bkq0d000lkwgogtunk06f` · valor 10000 |
| Pipeline | comercial `PATCH /crm/deals/:id` | 200 | `novo` → `qualificacao` → `proposta` → `negociacao` · `productType=AUTO` |
| Won | comercial `PATCH` `{ status: won, stage: fechado }` | 200 | `customerId=cmt2bkpr2000dkwgodsie25uo` |
| Comissão | admin `GET /commissions` | 200 | `dealId` do fluxo · **R$ 1500** · **15%** · **PENDING** |

Timeline 360 registra: lead criado → follow-up → convert → mudanças de estágio → negócio ganho.

Kanban admin após o fluxo: **34** deals.

Parceiro **não** passou a ver o lead novo (continua total 1).

---

## O que foi alterado (código / config)

| Item | Tipo |
|------|------|
| Migration `20260820250000` aplicada no PostgreSQL | banco |
| `OWNERSHIP_ENFORCEMENT=on` em `.env` / `apps/api/.env` / examples locais | config |
| `tenant.settings.ownershipEnforcement = on` | banco |
| Nenhuma tela nova | — |
| Nenhum endpoint novo | — |

Hydration error de `DropdownMenuTrigger` no shell **permanece** (não era bloqueio 500 da auditoria).

---

## Critérios vs resultado

| Critério | Resultado |
|----------|-----------|
| Migrations auditadas e pendente aplicada | PASSOU |
| `GET /crm/deals` 200 + Kanban com deals existentes | PASSOU |
| Customer 360 200 + abas | PASSOU |
| Ownership on + 4 personas | PASSOU (leads/deals/RBAC parceiro) |
| Fluxo até comissão | PASSOU |

**HOTFIX-001: APROVADO.**

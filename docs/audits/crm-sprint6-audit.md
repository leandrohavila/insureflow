# InsureFlow – Sprint 6.0
## Fase 1 – Auditoria Completa do CRM Comercial

**Data:** 2026-07-08  
**Escopo:** Backend (`apps/api`), Frontend (`apps/web`), Banco de Dados (`packages/database/prisma`)  
**Modo:** Somente leitura — nenhum código de produção foi alterado.

---

## Sumário Executivo

O módulo CRM Comercial do InsureFlow é um **monólito modular NestJS** no backend e **Next.js App Router** no frontend, com **Prisma/PostgreSQL** como camada de dados. O fluxo comercial principal está **operacional de ponta a ponta**:

**Lead → Questionário → Negócio (Deal) → Cliente → Apólice**

com eventos de sistema unificados via **Activity Engine** e timeline compartilhada entre entidades.

**Pontos fortes:** leads, pipeline de negócios, atividades/timeline, questionários, autenticação RBAC, integração quotes/proposals no backend.

**Principais lacunas:** módulos Tasks e Notifications inexistentes; ownership parcial (só leads, default `off`); UI de cotações read-only; dashboard com KPIs placeholder; duplicação de sheets e modelos de atribuição (`assignedTo` vs `ownerUserId`).

---

# 1. Arquitetura Atual

## 1.1 Diagrama Textual — Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js App Router)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Pages                    Components                 Data Access             │
│  ├── / (DashboardHome)    ├── CrmShell               ├── lib/data-access/   │
│  ├── /leads               ├── PipelineBoard          │   ├── crm/           │
│  ├── /clientes            ├── DealSheetV2/Legacy     │   ├── leads/         │
│  ├── /crm/*               ├── LeadSheetV2            │   ├── customers/     │
│  ├── /questionarios/*     ├── ActivityTimeline       │   ├── activities/    │
│  ├── /cotacoes            ├── EntitySheets           │   ├── questionnaires/│
│  └── /propostas           └── Design System          │   ├── quotes/        │
│                                                       │   └── dashboard/     │
│  API Routes (BFF)         React Query Hooks          └── query-keys.ts     │
│  app/api/leads/*          useDeals, useLeads, etc.                           │
│  app/api/crm/deals/*                                                         │
│  app/api/customers/*                                                         │
│  app/api/activities/*                                                        │
│  app/api/questionnaires/*                                                    │
│  app/api/quotes/*                                                            │
│  app/api/auth/*                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTP (JWT Bearer)
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                           BACKEND (NestJS)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Global Guards: ThrottlerGuard → JwtAuthGuard → PermissionsGuard            │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐              │
│  │  Auth    │  │ Access   │  │Permissions│  │  AuditLogs    │              │
│  │ Module   │  │ Module   │  │  Module   │  │  + Queue      │              │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └────────────────┘              │
│       │             │ OwnershipService (leads only)                          │
│       ▼             ▼                                                        │
│  ┌─────────┐  ┌───────────┐  ┌────────────┐  ┌──────────────┐              │
│  │  Leads  │──│Activities │──│ Activity   │  │Questionnaires│              │
│  │ Module  │  │  Module   │  │  Engine    │  │   Module     │              │
│  └────┬────┘  └─────┬─────┘  └──────┬─────┘  └──────┬───────┘              │
│       │             │               │               │                        │
│       ▼             │               │               ▼                        │
│  ┌─────────┐        │         publish()      ┌──────────┐                   │
│  │   CRM   │────────┼────────────────────────│  Quotes  │                   │
│  │ (Deals) │        │                        │  Module  │                   │
│  └────┬────┘        │                        └────┬─────┘                   │
│       │             │                             │                          │
│       ▼             ▼                             ▼                          │
│  ┌───────────┐  ┌──────────┐              ┌──────────┐                      │
│  │ Customers │  │ Policies │              │  (sync)  │                      │
│  │ +Activation│  │  Module  │              └──────────┘                      │
│  └───────────┘  └──────────┘                                                 │
│                                                                              │
│  Infrastructure: PrismaModule, RedisModule, BullMQ Queue                     │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ Prisma Client
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                      BANCO DE DADOS (PostgreSQL)                             │
│  22 tabelas | 14 enums | Multi-tenant via tenantId                           │
│                                                                              │
│  Tenant ──┬── Lead ──(1:1 dealId)── Deal ──(customerId)── Customer          │
│           │      │                      │                      │             │
│           │      └── LeadShare[]        ├── convertedLead      ├── Policy[] │
│           │                             └── quoteComparisons[]   └── Activity │
│           ├── Activity (lead|deal|customer|policy FKs)                        │
│           ├── QuestionnaireTemplate → Field → Submission                      │
│           └── QuoteComparison → Quote[] → Proposal[]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Módulos Backend Registrados

| Módulo | Path | Responsabilidade |
|--------|------|------------------|
| **Access** | `modules/access/` | Ownership, data-scope, tenant settings |
| **Auth** | `modules/auth/` | Login, refresh, logout, JWT |
| **Leads** | `modules/leads/` | CRUD leads, conversão, contexto comercial |
| **CRM** | `modules/crm/` | CRUD deals, pipeline, ativação de cliente |
| **Customers** | `modules/customers/` | CRUD clientes, ativação automática |
| **Activities** | `modules/activities/` | CRUD atividades humanas + Activity Engine |
| **Questionnaires** | `modules/questionnaires/` | Templates, campos, submissões |
| **Quotes** | `modules/quotes/` | Comparativos, linhas, propostas, PDF |
| **Policies** | `modules/policies/` | CRUD apólices, emissão, renovação, cancelamento |
| **Permissions** | `modules/permissions/` | Catálogo de permissões e roles |
| **AuditLogs** | `modules/audit-logs/` | Logs de auditoria (login, etc.) |
| **Queue** | `modules/queue/` | BullMQ para processamento assíncrono |

**Não existem:** `TasksModule`, `NotificationsModule`, `ClaimsModule`.

## 1.3 Arquitetura Frontend

| Camada | Localização | Padrão |
|--------|-------------|--------|
| **Pages** | `app/(dashboard)/**` | Server Components + permission gates |
| **CRM Shell** | `components/crm/crm-shell.tsx` | Layout operacional com tabs, density, relationship index |
| **Entity Sheets** | `components/crm/*-sheet-v2.tsx` | Workspace lateral por entidade |
| **Data Access** | `lib/data-access/modules/*` | React Query hooks + API clients |
| **BFF Routes** | `app/api/**` | Proxy para backend NestJS |
| **Design System** | `components/design-system/` + `lib/design-system/` | Tokens, layout, operational workspace |
| **CRM CSS** | `app/crm-operational.css` | Estilos legados do workspace CRM (~1270 linhas) |

## 1.4 Activity Engine (Event Bus v1)

O **Activity Engine** (`activity-engine.service.ts`) é o barramento de eventos síncrono do sistema:

- **Atividades humanas:** `type` = call/whatsapp/email/meeting/visit/note/follow_up; `status` = pending/completed/cancelled
- **Eventos de sistema:** `type` = note (fixo), `status` = completed, `operationalEventKind` = catálogo unificado
- **Metadados:** JSON serializado no campo `outcome`
- **Idempotência:** via `idempotencyKey` (ex.: `lead_converted`, `deal_won`)
- **Interface futura:** `ACTIVITY_EVENT_PUBLISHER` registrado mas não consumido via DI — módulos injetam `ActivityEngineService` diretamente

**Catálogo de eventos** (`activity-event-kinds.util.ts`):

| Categoria | Eventos publicados | Eventos catalogados mas não publicados |
|-----------|-------------------|----------------------------------------|
| Comercial | lead_converted, deal_stage_changed, deal_status_changed, questionnaire_*, quote_*, proposal_* | — |
| Pós-venda | deal_won, policy_issued, renewal_started, renewal_completed, cancellation | policy_issuance, policy_upload, renewal, claim, follow_up, billing, lifecycle_change |

---

# 2. Fluxo Atual

## 2.1 Diagrama do Fluxo Comercial

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   CAPTURA   │     │   QUALIFICAÇÃO   │     │  CONVERSÃO  │
│   DO LEAD   │────▶│  + QUESTIONÁRIO  │────▶│ LEAD→DEAL   │
└─────────────┘     └──────────────────┘     └─────────────┘
      │                      │                       │
      ▼                      ▼                       ▼
 POST /leads          POST /questionnaires/     POST /leads/:id/convert
 LeadsService         submissions              LeadsService.convertLead
 - ownerUserId        - valida campos          - cria Deal (stage=novo)
 - lastContactAt      - touchLastContact       - status lead=converted
 - assignedTo         - publish event          - link submissions→dealId
                      - sync quote comparison  - link activities→dealId
                                               - publish lead_converted
```

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  PIPELINE   │     │   NEGÓCIO GANHO  │     │   CLIENTE   │
│   CRM       │────▶│   status=won     │────▶│  ATIVADO    │
└─────────────┘     └──────────────────┘     └─────────────┘
      │                      │                       │
      ▼                      ▼                       ▼
 PATCH /crm/deals/:id   CrmService.updateDeal    CustomerActivationService
 - stage/status         - publish stage/status   .activateFromWonDeal
 - pipelineOrder        - on won → activation    - dedupe por doc/email/phone
 - commercialContext    - wonAt timestamp        - cria ou vincula Customer
                                               - sourceDealId = deal.id
                                               - propaga submissions/activities
                                               - publish deal_won (idempotente)
```

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  COTAÇÕES   │     │    PROPOSTAS     │     │   APÓLICE   │
│ (paralelo)  │     │   (paralelo)     │     │   EMITIDA   │
└─────────────┘     └──────────────────┘     └─────────────┘
      │                      │                       │
      ▼                      ▼                       ▼
 Questionnaire submit   QuotesService            POST /policies/issue-from-deal
 → syncComparison       - PDF, send, viewed      PoliciesService
 QuotesService          - accept/reject/expire    - requer deal won
 - comparisons/quotes   - publish events        - auto-ativa cliente se necessário
 - proposals            - publish events        - publish policy_issued
                                               - syncCustomerPolicyAggregates
```

## 2.2 Fluxo Detalhado por Etapa

### Etapa 1 — Lead

| Ação | Endpoint | Service | Efeitos colaterais |
|------|----------|---------|-------------------|
| Criar lead | `POST /leads` | `LeadsService.createLead` | Define `ownerUserId`/`ownerTeamId`, `lastContactAt` |
| Listar | `GET /leads` | `LeadsService.findLeads` | Paginação (max 500), filtros, ownership scope |
| Contexto | `GET /leads/:id/context` | `LeadsService.findLeadContext` | Deal, submissions, status questionário, resumo quotes |
| Duplicatas | `GET /leads/duplicates` | Por documento normalizado | — |
| Atualizar | `PATCH /leads/:id` | CRUD com validação de documento | — |
| Excluir | `DELETE /leads/:id` | Bloqueado se `dealId` existe | — |

**Status possíveis:** `new | contacted | qualified | converted | lost`

### Etapa 2 — Questionário

| Ação | Endpoint | Service | Efeitos colaterais |
|------|----------|---------|-------------------|
| Criar template | `POST /questionnaires/templates` | CRUD templates + fields | — |
| Submeter | `POST /questionnaires/submissions` | Validação por tipo de campo | `touchLastContact`, publish `questionnaire_submitted` |
| Revisar | `PATCH /questionnaires/submissions/:id` | Status → reviewed | publish `questionnaire_reviewed`, sync quote comparison |

**Vínculos:** `leadId`, `dealId`, `customerId` (todos opcionais no schema; propagados na conversão/ativação).

### Etapa 3 — Conversão Lead → Deal

**Trigger:** `POST /leads/:id/convert` (requer `leads:manage` + `crm:manage`)

**Transação atômica:**
1. Cria `Deal` com stage default `novo`, status `open`
2. Atualiza lead: `status=converted`, `dealId=deal.id`
3. Propaga `dealId` para todas `QuestionnaireSubmission` do lead
4. `linkLeadActivitiesToDeal` — vincula atividades ao deal
5. Publica evento `lead_converted` (idempotente por dealId)

### Etapa 4 — Pipeline CRM

| Ação | Endpoint | Service | Efeitos colaterais |
|------|----------|---------|-------------------|
| Listar deals | `GET /crm/deals` | `CrmService.findDeals` | Enriquece com `commercialContext` (sem paginação) |
| Criar deal | `POST /crm/deals` | Auto `pipelineOrder` via fractional indexing | — |
| Atualizar | `PATCH /crm/deals/:id` | Stage/status changes | publish events; on `won` → ativação cliente |
| Excluir | `DELETE /crm/deals/:id` | — | — |

**Stages:** `novo | qualificacao | proposta | negociacao | fechado`  
**Status:** `open | won | lost | archived`

**Ausente:** `GET /crm/deals/:id` (detalhe individual no backend).

### Etapa 5 — Cliente (Ativação Automática)

**Trigger:** `PATCH /crm/deals/:id` com `status=won` OU `POST /policies/issue-from-deal`

**`CustomerActivationService.activateFromWonDeal`:**
1. Verifica deal `status=won`
2. Se `deal.customerId` já existe → retorna sem criar
3. Busca customer existente por documento/email/phone
4. Cria customer com `sourceDealId`, `lifecycleStage=won`, documentos sintéticos se necessário (`email:…`, `phone:…`, `deal:…`)
5. Atualiza `deal.customerId`
6. Propaga `customerId` para submissions e activities
7. Publica `deal_won` (idempotente)

**Não exposto:** endpoint manual de ativação.

### Etapa 6 — Apólice

| Ação | Endpoint | Service | Efeitos colaterais |
|------|----------|---------|-------------------|
| Emitir de deal | `POST /policies/issue-from-deal` | Requer deal won | Auto-ativa cliente, publish `policy_issued` |
| CRUD | `/policies/*` | Validação de relações | sync aggregates |
| Cancelar | `POST /policies/:id/cancel` | publish `cancellation` | lifecycle update |
| Renovar | `POST /policies/:id/renew` | publish `renewal_*` | lifecycle update |

## 2.3 Fluxo Frontend (Navegação do Usuário)

```
/leads → LeadSheetV2 → Conversão (dialog) → /crm/negocios?dealId=…
                                              ↓
                                    DealDetailSheet (default) ou DealSheetV2 (?sheet=v2)
                                              ↓
                              Tabs: Overview, Commercial, Quotes, Proposals, Timeline
                                              ↓
                         Deep links: /cotacoes?dealId=… | /propostas?dealId=…
```

**Duas rotas de clientes:**
- `/clientes` — CRUD administrativo (`CustomersPage`)
- `/crm/clientes` — Portfolio operacional com health/lifecycle (`CustomersPortfolioPage`)

---

# 3. Funcionalidades Existentes

## 3.1 Backend

### Leads
- [x] CRUD completo com paginação e filtros
- [x] Normalização e validação de documentos (CPF/CNPJ)
- [x] Detecção de duplicatas por documento
- [x] Contexto comercial agregado (`/context`)
- [x] Conversão para deal (transacional)
- [x] Ownership enforcement (modos off/shadow/on)
- [x] `touchLastContact` para integração com questionários

### CRM (Deals)
- [x] CRUD de negócios
- [x] Pipeline com `pipelineOrder` (fractional indexing)
- [x] `commercialContext` enriquecido (questionário, quotes, última interação)
- [x] Eventos de mudança de stage/status
- [x] Ativação automática de cliente ao ganhar

### Customers
- [x] CRUD com busca e meta counts
- [x] Ativação automática a partir de deal won
- [x] Dedupe por documento/email/phone
- [x] Lifecycle stages e renewal pipeline
- [x] Agregados de apólices no detalhe

### Activities
- [x] CRUD de atividades humanas (7 tipos)
- [x] Timeline por entidade (lead/deal/customer/policy)
- [x] Activity Engine com catálogo de 28 event kinds
- [x] Idempotência de eventos
- [x] Sync de `lastContactAt` do lead

### Questionnaires
- [x] CRUD de templates com versionamento
- [x] CRUD de campos (13 tipos incluindo FILE)
- [x] CRUD de submissões com validação por tipo
- [x] Integração com quotes (sync comparison)
- [x] Eventos de submit/review

### Quotes & Proposals
- [x] CRUD de comparativos de cotação
- [x] CRUD de linhas de cotação (bulk, select)
- [x] CRUD de propostas
- [x] Geração de PDF
- [x] Envio, visualização, expiração, aceite/rejeição
- [x] Métricas agregadas
- [x] Eventos completos no Activity Engine

### Policies
- [x] CRUD de apólices
- [x] Emissão a partir de deal
- [x] Cancelamento e renovação
- [x] Sync de agregados no customer
- [x] Eventos de lifecycle

### Auth & Permissions
- [x] Login com JWT (roles, permissions, dataScope, teamIds)
- [x] Refresh token com rotação
- [x] Logout com revogação
- [x] Guards globais (throttle + JWT + permissions)
- [x] `:manage` implica `:view` no mesmo recurso
- [x] Catálogo de permissões e roles por tenant

### Access / Ownership
- [x] DataScope por role (own/team/tenant/shared)
- [x] Enforcement configurável (env + tenant settings)
- [x] Modo shadow (log sem bloquear)
- [x] Filtro de leads por ownership
- [x] LeadShare no schema (leitura via ownership filter)

## 3.2 Frontend

### Leads (`/leads`)
- [x] Listagem paginada com filtros
- [x] CRUD via dialogs
- [x] LeadSheetV2 (workspace completo)
- [x] Conversão para deal com warnings comerciais
- [x] Detecção de duplicatas
- [x] Integração com questionários
- [x] Seções comerciais e de conversão

### CRM Pipeline (`/crm`)
- [x] Overview com preview do pipeline
- [x] Negócios (`/crm/negocios`) — Kanban DnD + list view
- [x] Métricas do pipeline
- [x] Activity feed na sidebar
- [x] Deal create/edit dialogs
- [x] Commercial context nos cards
- [x] Questionnaire badge nos cards

### CRM Operacional
- [x] Contatos (`/crm/contatos`) — índice derivado de deals/leads
- [x] Empresas (`/crm/empresas`) — índice derivado
- [x] Clientes portfolio (`/crm/clientes`) — health/lifecycle
- [x] Agenda (`/crm/agenda`) — calendário completo
- [x] Tarefas (`/crm/tarefas`) — workspace sobre activities
- [x] Atividades (`/crm/atividades`) — listagem + timeline

### Entity Sheets
- [x] LeadSheetV2 — overview, commercial, conversion, timeline, questionnaires
- [x] DealDetailSheet (legacy, default)
- [x] DealSheetV2 (opt-in via `?sheet=v2`)
- [x] CustomerSheetV2 — overview, timeline, placeholders
- [x] ContactSheetV2, CompanySheetV2

### Timeline & Activities
- [x] ActivityTimeline + TimelineEntry
- [x] TimelineLane (single entity)
- [x] MergedTimelineLane (multi-entity)
- [x] OperationalTimelineLane (customer)
- [x] Activity CRUD dialogs
- [x] Quick actions inline

### Questionnaires
- [x] Template builder (~2066 linhas)
- [x] Field builder com 13 tipos
- [x] Submissions list/review
- [x] Integração em lead/deal sheets

### Quotes & Proposals
- [x] `/cotacoes` — listagem e detalhe read-only
- [x] `/propostas` — listagem com ações completas (PDF, send, expire, accept)
- [x] EntityQuotesSection / EntityProposalsSection em sheets
- [x] QuoteComparisonTable (display)
- [x] Deep links com returnTo

### Dashboard (`/`)
- [x] KPIs reais via `useDashboardKpis`
- [x] Pipeline hero com stages
- [x] Prioridades comerciais
- [x] Agenda preview
- [x] Quotes/proposals summary
- [x] Commercial funnel (parcial)

### Customers (`/clientes`)
- [x] CRUD paginado
- [x] Dialog de criação/edição
- [x] Filtros por tipo, lifecycle, renewal

### Design System
- [x] PageContainer, ContentContainer, Stack, Grid
- [x] OperationalPageLayout, OperationalWorkspace
- [x] PageHeader, FilterBar, FilterSearch
- [x] AppCard, KPI tiles
- [x] EmptyState, LoadingState, ErrorState
- [x] Foundation CSS + theme provider
- [x] UI Kit showcase (`/ui-kit`)

### Auth
- [x] Login form
- [x] Session provider com React Query
- [x] Permission gates por rota
- [x] Role badge, permissions panel
- [x] Unauthorized page

---

# 4. Funcionalidades Inacabadas

## 4.1 Backend — Endpoints e Features Sem Uso Completo

| Item | Status | Detalhe |
|------|--------|---------|
| `GET /crm/deals/:id` | **Ausente** | Frontend usa list + filter; sem endpoint de detalhe |
| `LeadShare` CRUD | **Schema only** | Tabela + permissão `leads:share` seedada, sem API |
| `Team` management | **Seed only** | 0 queries diretas na API; usado via TeamMember |
| `UserRole` writes | **Seed only** | Sem API de atribuição de roles |
| `getCustomerPolicyAggregates()` | **Dead code** | Método público sem callers |
| `mergeTenantSettings()` | **Dead code** | Export não importado |
| `ACTIVITY_EVENT_PUBLISHER` DI | **Não consumido** | Token registrado, injeção direta usada |
| `decodeActivityEventMetadata()` | **Só em testes** | API retorna `outcome` raw |
| Customer `status` filter | **Bug** | Controller documenta param, `buildCustomerWhere` ignora |
| Auth refresh JWT | **Inconsistente** | Refresh não inclui `dataScope`/`teamIds` |
| Event kinds reservados | **8 não publicados** | claim, billing, lifecycle_change, etc. |
| Ownership em Deals/Customers | **Não implementado** | Apenas leads têm scoping |
| Audit logs CRM | **Parcial** | Login auditado; mutações CRM não uniformes |

## 4.2 Frontend — Telas Parcialmente Implementadas

| Tela/Componente | O que falta |
|-----------------|-------------|
| **Dashboard** | KPIs placeholder: Comissão, Apólices, Renovações, Sinistros, Aniversariantes, Premium |
| **Dashboard** | Funnel step "Apólices" é placeholder |
| **Dashboard** | Widgets `DashboardClaims`, `DashboardRenewals`, `DashboardNotifications` construídos mas **não montados** |
| **QuotesPage** | Sem criação/edição de comparativos; botão "Filtros" sem handler |
| **DealSheetV2** | Tabs Documents e Policies são `PlaceholderSection` |
| **CustomerSheetV2** | Tabs Policies, Finance, Claims, Renewal automation são placeholders |
| **Entity Quotes Sections** | Apenas navegação; sem workflow inline |
| **QuoteComparisonTable** | `onSelectLine` suportado mas callers não passam callback |
| **Nav routes** | `/apolices`, `/sinistros`, `/whatsapp`, `/automacao` → `SectionPlaceholder` |
| **Import buttons** | Renderizados em leads, deals, contacts, companies, CRM overview — **sem onClick** |
| **Deal workspace** | Legacy `DealDetailSheet` ainda é default; V2 opt-in via query param |

## 4.3 Hooks Não Utilizados

| Hook | Módulo | Motivo |
|------|--------|--------|
| `useLead` | leads | List usa dados inline; sheet usa prop |
| `useCustomer` | customers | Idem |
| `useActivity` | activities | Timeline usa list query |
| `useQuestionnaireTemplate` | questionnaires | Template vem da list selection |
| `useQuestionnaireField` | questionnaires | Usa `useQuestionnaireFields` |
| `useQuoteMetrics` | quotes | Dashboard usa fetch inline |
| `useProposal` | quotes | ProposalsPage usa list |
| `useCreateQuoteComparison` | quotes | **Sem UI** |
| `useUpdateQuoteComparison` | quotes | **Sem UI** |
| `useAddQuoteLine` | quotes | **Sem UI** |
| `useBulkAddQuoteLines` | quotes | **Sem UI** |
| `useUpdateQuoteLine` | quotes | **Sem UI** |
| `useSelectQuoteLine` | quotes | **Sem UI** |
| `useMarkComparisonSent` | quotes | **Sem UI** |
| `useRecordComparisonViewed` | quotes | **Sem UI** |
| `useCreateProposal` | quotes | **Sem UI** |

**Nota:** Todos os quote write hooks existem apenas em `hooks.ts` — nenhum componente os importa.

## 4.4 Componentes/Arquivos Mortos ou Legados

| Arquivo | Status |
|---------|--------|
| `components/crm/crm-page.tsx` (`CrmPage`) | **Não importado** por nenhuma rota |
| `components/dashboard/dashboard-claims.tsx` | Exportado, nunca importado |
| `components/dashboard/dashboard-renewals.tsx` | Exportado, nunca importado |
| `components/dashboard/dashboard-notifications.tsx` | Exportado, nunca importado |
| `lib/dashboard-mock.ts` | **Deletado** (git status) |
| `components/dashboard/performance-chart.tsx` | **Deletado** |
| `components/dashboard/stats-cards.tsx` | **Deletado** |
| `components/dashboard/recent-leads-table.tsx` | **Deletado** |
| `lib/crm/crm-deal-timeline-preview.ts` | **Deletado** |
| `components/crm/deal-detail-sheet.tsx` | Legado, ainda default |

## 4.5 Mocks, Placeholders e Dados Fake

| Tipo | Localização | Detalhe |
|------|-------------|---------|
| **KPI placeholder** | `dashboard-*-production.tsx`, `dashboard-customers.tsx` | Valor `—` com prop `placeholder` |
| **SectionPlaceholder** | `[[...slug]]/page.tsx` | Rotas sem implementação |
| **PlaceholderSection** | Deal/Customer sheets | "Foundation — emissão real não implementada" |
| **Renewals hardcoded** | `dashboard-notifications.tsx` | `count: 0` fixo |
| **Relationship index** | `relationship-index-provider.tsx` | Derivado client-side, cap 500 registros |
| **Contacts/Companies** | Sem API própria | Entidades virtuais do índice |

## 4.6 TODOs e FIXMEs

**Nenhum `TODO` ou `FIXME` encontrado** no código de produção (`apps/api`, `apps/web`).

**Deprecations ativas:**
- `OPERATIONAL_EVENT_KINDS` → usar `ACTIVITY_EVENT_KINDS` (backend)
- `crm-layout-classes.ts` pipeline constants → usar `dsPipeline` (frontend)
- `validateQuestionnaireAnswers` → usar `validateQuestionnaireAnswersForFinalize` (frontend)

## 4.7 Permissões Seedadas Sem Módulo

| Permissão | Módulo esperado | Status |
|-----------|-----------------|--------|
| `claims:view`, `claims:manage` | Sinistros | Não existe |
| `whatsapp:view`, `whatsapp:manage` | WhatsApp | Não existe |
| `automation:view`, `automation:manage` | Automação | Não existe |
| `leads:share` | Lead sharing | Schema only |

---

# 5. Débito Técnico

## 5.1 Duplicação de Código

| Área | Duplicação | Impacto |
|------|------------|---------|
| **Deal workspace** | `DealDetailSheet` vs `DealSheetV2` | Manutenção dobrada, comportamentos divergentes |
| **CRM overview vs deals** | Pipeline board, metrics, sidebar repetidos | Refatoração necessária ao promover V2 |
| **CrmPage vs CrmOverview** | `crm-page.tsx` é cópia não usada | Código morto |
| **Customers** | `/clientes` CRUD vs `/crm/clientes` portfolio | Confusão de UX e modelos |
| **Timeline lanes** | 3 variantes com UI de filtro/grupo sobreposta | Extrair primitivo comum |
| **DataTable imports** | `@/components/shared` vs `@/components/design-system` | Dual path, mesmo código |
| **WORKFLOW_TONE maps** | Duplicado em `quotes-page.tsx` e `entity-quotes-section.tsx` | Sync manual |
| **Import buttons** | Copy-paste em 6+ páginas CRM | Sem handler compartilhado |
| **Activity event kinds** | Backend + frontend catalogs | Devem ser mantidos sincronizados manualmente |
| **Atribuição** | `assignedTo` (string) vs `ownerUserId` (FK) em Lead/Deal | Modelo dual em transição |

## 5.2 Código Morto

| Item | Tipo |
|------|------|
| `CrmPage` component | Componente não referenciado |
| `DashboardClaims/Renewals/Notifications` | Componentes não montados |
| 11 quote write hooks | Hooks sem consumers |
| `getCustomerPolicyAggregates` | Método backend sem callers |
| `mergeTenantSettings` | Util backend sem imports |
| `ACTIVITY_EVENT_PUBLISHER` token | DI registrado sem uso |
| `useLead`, `useCustomer`, `useActivity` | Hooks de detalhe não usados |

## 5.3 Arquivos Não Utilizados

Confirmados via análise estática de imports:
- `apps/web/components/crm/crm-page.tsx`
- `apps/web/components/dashboard/dashboard-claims.tsx`
- `apps/web/components/dashboard/dashboard-renewals.tsx`
- `apps/web/components/dashboard/dashboard-notifications.tsx`

## 5.4 Problemas Arquiteturais

| Problema | Severidade | Detalhe |
|----------|------------|---------|
| **Ownership incompleto** | Alta | Só leads; deals/customers/policies são tenant-wide |
| **assignedTo legacy** | Alta | String sem FK coexistindo com ownerUserId |
| **Activity Engine síncrono** | Média | Sem fila para eventos; acoplamento em transações |
| **Sem módulo Tasks** | Média | UI de tarefas usa Activity com convenções implícitas |
| **Sem Notifications** | Média | Dashboard widget existe mas sem persistência |
| **BFF sem validação** | Média | API routes são proxy direto |
| **Relationship index client-side** | Média | Cap 500, sem API de contatos/empresas |
| **String statuses no DB** | Média | Lead/Deal/Customer statuses são String, não enum |
| **Permissões inconsistentes** | Baixa | Customers=`clients:*`, Activities=`crm:*` |
| **Schema vs proposal drift** | Média | `ownership-schema-proposal.prisma` difere do schema ativo |

## 5.5 Componentes Grandes (>300 linhas)

| Arquivo | ~Linhas | Risco |
|---------|---------|-------|
| `questionnaire-templates-page.tsx` | 2066 | Monolito; difícil testar e revisar |
| `crm-operational.css` | 1270+ | CSS monolítico legado |
| `leads-page.tsx` | 1138 | Page + dialogs inline |
| `agenda-page.tsx` | 952 | Calendar complexo |
| `tasks-page.tsx` | 567 | Task workspace |
| `entity-sheet-shell.tsx` | 600 | Framework de sheet |
| `proposals-page.tsx` | 466 | Proposals center |
| `deals-page.tsx` | 407 | Deals workspace |
| `customers-page.tsx` | 392 | Customers CRUD |
| `lead-sheet-v2.tsx` | 392 | Lead sheet |
| `customers-portfolio-page.tsx` | 351 | Portfolio |
| `deal-sheet-v2.tsx` | 314 | Deal sheet V2 |
| `merged-timeline-lane.tsx` | 313 | Merged timeline |
| `data-table.tsx` | 311 | Shared table |
| `quotes/hooks.ts` | 479 | Todos os hooks de quotes |
| `dashboard/hooks.ts` | 271 | KPI aggregation |

## 5.6 Services Muito Acoplados

| Service | Acoplamentos | Observação |
|---------|--------------|------------|
| `LeadsService` | Activities, Ownership, Prisma | Conversão orquestra múltiplos domínios |
| `CrmService` | Activities, CustomerActivation | Update deal dispara ativação |
| `QuestionnairesService` | Leads, Activities, Quotes | Submit dispara 3 side effects |
| `CustomerActivationService` | Activities, Prisma (multi-entity) | Propaga IDs em 4 tabelas |
| `PoliciesService` | Customers, Activities | Emissão pode ativar cliente |
| `QuotesService` | CRM entities, Activities | Sync comparison from submission |

## 5.7 Problemas de Tipagem

| Problema | Local |
|----------|-------|
| Status strings no DB vs enums no app | Lead, Deal, Customer, Activity |
| `assignedTo` tipado como string | Lead, Deal DTOs |
| `outcome` armazena JSON ou texto | Activity — sem discriminated union na API |
| `renewalStatus` String no Customer vs Enum no Policy | Inconsistência semântica |
| `commercialContext` enriquecido no service | Sem contrato formal exportado (deal-contract.ts parcial no frontend) |

## 5.8 Problemas de Performance

| Problema | Impacto |
|----------|---------|
| `GET /crm/deals` sem paginação | Retorna todos os deals do tenant |
| Relationship index client-side (cap 500) | Dados truncados silenciosamente |
| `findDeals` com N+1 de commercialContext | Query pesada por deal |
| Dashboard KPIs com múltiplas queries paralelas | Aceitável mas sem cache |
| `questionnaire-templates-page.tsx` monolito | Bundle size, re-render custoso |
| Activities `groupBy` para last interaction | Query adicional por listagem |

## 5.9 Banco de Dados — Inconsistências

| Problema | Detalhe |
|----------|---------|
| **FKs ausentes** | `lead_shares.tenantId`, `quotes.tenantId`, `proposals.tenantId` |
| **assignedTo sem FK** | Lead e Deal têm índice mas sem referência a User |
| **isSelected vs selectedQuoteId** | Redundância em quotes; risco de divergência |
| **Dual Customer↔Deal link** | `sourceDealId` (origem) vs `customerId` (ongoing) sem constraint |
| **Entity FKs opcionais** | Activity/Submission/QuoteComparison podem ter 0 ou N links |
| **String vs Enum** | Apenas Policy tem enum no DB; demais statuses são String |
| **customers.renewalStatus** | String livre vs PolicyRenewalStatus enum |
| **LeadShare sem API** | Tabela populada só via seed |
| **Team sem API** | Tabela populada só via seed |

---

# 6. Melhorias Recomendadas

## 6.1 Prioridade Alta

| # | Melhoria | Justificativa | Esforço |
|---|----------|---------------|---------|
| A1 | **Completar fluxo de cotações no frontend** | 11 write hooks existem sem UI; backend completo | Médio |
| A2 | **Promover DealSheetV2 e remover legacy** | Duplicação ativa de deal workspace | Médio |
| A3 | **Corrigir auth refresh JWT** | `dataScope`/`teamIds` ausentes no refresh quebram ownership | Baixo |
| A4 | **Corrigir filtro `status` em customers** | Param documentado mas ignorado no service | Baixo |
| A5 | **Finalizar migração ownership** | Backfill `ownerUserId` de `assignedTo`; expandir para Deal/Customer | Alto |
| A6 | **Adicionar paginação em GET /crm/deals** | Risco de performance com volume | Médio |
| A7 | **Implementar ou remover LeadShare API** | Permissão seedada, schema pronto, sem funcionalidade | Médio |
| A8 | **Adicionar GET /crm/deals/:id** | Frontend precisa de detalhe sem refetch da lista | Baixo |

## 6.2 Prioridade Média

| # | Melhoria | Justificativa | Esforço |
|---|----------|---------------|---------|
| M1 | **Montar ou remover dashboard widgets** | Claims, Renewals, Notifications construídos mas unused | Baixo |
| M2 | **Preencher KPIs placeholder do dashboard** | Comissão, apólices, renovações mostram `—` | Médio |
| M3 | **Implementar tabs reais em CustomerSheetV2** | Policies, finance, claims são placeholders | Alto |
| M4 | **Promover statuses para enums/check constraints** | Proteção no DB contra valores inválidos | Médio |
| M5 | **Adicionar FKs ausentes** | quotes/proposals/lead_shares tenantId | Baixo |
| M6 | **Resolver isSelected vs selectedQuoteId** | Escolher fonte única de verdade | Baixo |
| M7 | **Extrair primitivo de timeline lane** | 3 variantes com lógica sobreposta | Médio |
| M8 | **Quebrar questionnaire-templates-page** | 2066 linhas em um arquivo | Médio |
| M9 | **Quebrar leads-page** | 1138 linhas com dialogs inline | Médio |
| M10 | **API de contatos/empresas** | Substituir índice client-side com cap 500 | Alto |
| M11 | **Unificar /clientes e /crm/clientes** | Reduzir confusão de navegação | Médio |
| M12 | **Exportar quotes/dashboard no barrel** | `lib/data-access/modules/index.ts` incompleto | Baixo |
| M13 | **Implementar ou esconder botões Importar** | 6+ páginas com botão não funcional | Baixo |
| M14 | **Alinhar customers.renewalStatus com enum** | Consistência com PolicyRenewalStatus | Médio |
| M15 | **Constraint XOR em entity FKs** | Activity/Submission devem ter ≥1 parent | Médio |

## 6.3 Prioridade Baixa

| # | Melhoria | Justificativa | Esforço |
|---|----------|---------------|---------|
| B1 | **Remover CrmPage morto** | Código não referenciado | Baixo |
| B2 | **Remover dead exports backend** | getCustomerPolicyAggregates, mergeTenantSettings | Baixo |
| B3 | **Remover hooks não usados** | useLead, useCustomer, etc. ou wire them | Baixo |
| B4 | **Migrar crm-operational.css para design tokens** | 1270 linhas de CSS legado | Alto |
| B5 | **Deprecar crm-layout-classes.ts** | Constantes já marcadas @deprecated | Baixo |
| B6 | **Publicar event kinds reservados ou remover do catálogo** | 8 kinds sem implementação | Baixo |
| B7 | **Permissões dedicadas para activities** | Hoje reutiliza crm:view/manage | Baixo |
| B8 | **Wire ACTIVITY_EVENT_PUBLISHER via DI** | Preparar para event bus async | Médio |
| B9 | **Decode metadata na API response** | outcome como JSON estruturado | Baixo |
| B10 | **Implementar módulos Claims/WhatsApp/Automation** | Permissões já seedadas | Alto |
| B11 | **Tabelas Task e Notification** | Se persistência for necessária | Alto |
| B12 | **Audit logs uniformes para mutações CRM** | Hoje só login é auditado via queue | Médio |
| B13 | **Sincronizar catálogo event kinds automaticamente** | Hoje sync manual backend↔frontend | Médio |

---

## Apêndice A — Mapa de Entidades do Banco

### Tabelas CRM (22 total no schema)

| Tabela | Model Prisma | Uso na API |
|--------|-------------|------------|
| tenants | Tenant | ✓ |
| users | User | ✓ |
| permissions | Permission | ✓ (read) |
| roles | Role | ✓ (read) |
| role_permissions | RolePermission | ✓ (via include) |
| user_roles | UserRole | ✓ (read only) |
| teams | Team | Seed only |
| team_members | TeamMember | ✓ (read only) |
| lead_shares | LeadShare | ✓ (filter only) |
| leads | Lead | ✓ Full CRUD |
| deals | Deal | ✓ Full CRUD |
| customers | Customer | ✓ Full CRUD |
| activities | Activity | ✓ Full CRUD |
| policies | Policy | ✓ Full CRUD |
| questionnaire_templates | QuestionnaireTemplate | ✓ |
| questionnaire_fields | QuestionnaireField | ✓ |
| questionnaire_submissions | QuestionnaireSubmission | ✓ |
| quote_comparisons | QuoteComparison | ✓ |
| quotes | Quote | ✓ |
| proposals | Proposal | ✓ |
| audit_logs | AuditLog | ✓ |
| refresh_tokens | RefreshToken | ✓ |

### Enums (14)

`TenantStatus`, `DataScope`, `LeadSharePermission`, `AuditSeverity`, `PolicyStatus`, `PolicyRenewalStatus`, `QuestionnaireTemplateStatus`, `QuestionnaireFieldType`, `QuestionnaireOrigin`, `QuestionnaireSubmissionMode`, `QuestionnaireSubmissionStatus`, `QuoteWorkflowStatus`, `QuoteLineStatus`, `ProposalStatus`

---

## Apêndice B — Mapa de Endpoints Backend

### Leads (`/leads`)
| Method | Route | Permission |
|--------|-------|------------|
| GET | `/` | leads:view |
| GET | `/duplicates` | leads:view |
| GET | `/:id/context` | leads:view |
| GET | `/:id` | leads:view |
| POST | `/` | leads:manage |
| PATCH | `/:id` | leads:manage |
| DELETE | `/:id` | leads:manage |
| POST | `/:id/convert` | leads:manage + crm:manage |

### CRM (`/crm/deals`)
| Method | Route | Permission |
|--------|-------|------------|
| GET | `/` | crm:view |
| POST | `/` | crm:manage |
| PATCH | `/:id` | crm:manage |
| DELETE | `/:id` | crm:manage |

### Customers (`/customers`)
| Method | Route | Permission |
|--------|-------|------------|
| GET | `/` | clients:view |
| GET | `/:id` | clients:view |
| POST | `/` | clients:manage |
| PATCH | `/:id` | clients:manage |
| DELETE | `/:id` | clients:manage |

### Activities (`/activities`)
| Method | Route | Permission |
|--------|-------|------------|
| GET | `/` | crm:view |
| GET | `/:id` | crm:view |
| POST | `/` | crm:manage |
| PATCH | `/:id` | crm:manage |
| DELETE | `/:id` | crm:manage |

### Questionnaires (`/questionnaires`)
| Method | Route | Permission |
|--------|-------|------------|
| GET/POST | `/templates` | questionnaires:view/manage |
| GET/PATCH/DELETE | `/templates/:id` | questionnaires:view/manage |
| CRUD | `/templates/:id/fields[/:fieldId]` | questionnaires:view/manage |
| GET/POST | `/submissions` | questionnaires:view/manage |
| GET/PATCH/DELETE | `/submissions/:id` | questionnaires:view/manage |

### Policies (`/policies`)
| Method | Route | Permission |
|--------|-------|------------|
| GET | `/` | policies:view |
| POST | `/` | policies:manage |
| POST | `/issue-from-deal` | policies:manage |
| GET | `/:id` | policies:view |
| PATCH | `/:id` | policies:manage |
| POST | `/:id/cancel` | policies:manage |
| POST | `/:id/renew` | policies:manage |

### Auth (`/auth`)
| Method | Route | Auth |
|--------|-------|------|
| POST | `/login` | Public |
| POST | `/refresh` | Public |
| POST | `/logout` | Bearer |
| GET | `/me` | Bearer |

---

## Apêndice C — Rotas Frontend

| Rota | Componente | Status |
|------|------------|--------|
| `/` | DashboardHome | Completo (KPIs parciais) |
| `/leads` | LeadsPage | Completo |
| `/clientes` | CustomersPage | Completo |
| `/crm` | CrmOverview | Completo |
| `/crm/negocios` | DealsPage | Completo |
| `/crm/contatos` | ContactsPage | Completo (derivado) |
| `/crm/empresas` | CompaniesPage | Completo (derivado) |
| `/crm/clientes` | CustomersPortfolioPage | Parcial (sheet tabs) |
| `/crm/agenda` | AgendaPage | Completo |
| `/crm/tarefas` | TasksPage | Completo |
| `/crm/atividades` | ActivitiesPage | Completo |
| `/questionarios/templates` | QuestionnaireTemplatesPage | Completo |
| `/questionarios/respostas` | QuestionnaireSubmissionsPage | Completo |
| `/cotacoes` | QuotesPage | Parcial (read-only) |
| `/propostas` | ProposalsPage | Completo |
| `/ui-kit` | UI Kit showcase | Dev |
| `/apolices`, `/sinistros`, etc. | SectionPlaceholder | Não implementado |

---

*Relatório gerado em modo somente leitura. Nenhum código de produção foi alterado durante esta auditoria.*

# Inventário do sistema — InsureFlow

**Data:** 20 de agosto de 2026  
**Escopo:** monorepo atual (`apps/web`, `apps/api`, `packages/*`)  
**Regra:** em caso de divergência, o código prevalece. Roadmaps antigos (ex.: `docs/roadmap/crm-evolution.md`, maio/2026) estão **desatualizados** em vários itens e não devem ser lidos como status.

Produto: plataforma operacional da **Corretora Ávila** (seguros) e da **Ávila Imóveis** (imobiliária), no mesmo tenant, isoladas por Business Unit.

---

## Como ler

| Símbolo | Significado |
|---------|-------------|
| Pronto | Comportamento presente no código |
| Parcial | Existe, com lacuna de produto, UI ou integração |
| Placeholder | Rota/menu existe, tela genérica (`SectionPlaceholder`) |
| Pendente | Permissão, enum ou doc sem implementação |

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Web | Next.js 16 (App Router), React 19, TanStack Query, BFF em `apps/web/app/api` |
| API | NestJS 11, prefixo `/api`, versionamento URI `v1` |
| Persistência | Prisma 6 + PostgreSQL 16 |
| Filas | BullMQ + Redis 7 |
| Auth | JWT access + refresh, RBAC (`@RequirePermissions`), ownership + Business Unit ACL |
| Pacotes | `@repo/database`, `@repo/auth`, `@repo/forms-engine`, `@repo/forms-library`, `@repo/ui` |
| Deploy | Web Vercel · API Railway · DB Neon (ver `docs/infra/`) |

Isolamento duro: **`tenantId` em toda entidade de negócio**.

---

## 1. Entidades do banco

Fonte: `packages/database/prisma/schema.prisma`.

### 1.1 Identidade, tenant e acesso

| Modelo | Tabela | Papel |
|--------|--------|--------|
| `Tenant` | `tenants` | Organização (slug, settings JSON, status) |
| `User` | `users` | Usuário do tenant; `primaryTeamId`, `currentBusinessUnitId` |
| `Permission` | `permissions` | Catálogo global de chaves (`crm:view`, …) |
| `Role` | `roles` | Papel por tenant (`slug`, `defaultDataScope`) |
| `RolePermission` | `role_permissions` | N:N papel × permissão |
| `UserRole` | `user_roles` | N:N usuário × papel |
| `Team` | `teams` | Equipe comercial |
| `TeamMember` | `team_members` | Membro + `isLead` (usado em escalonamento de SLA) |
| `LeadShare` | `lead_shares` | Compartilhamento de lead (`read` / `comment`) |
| `RefreshToken` | `refresh_tokens` | Sessão JWT |
| `AuditLog` | `audit_logs` | Auditoria técnica assíncrona (BullMQ) |

### 1.2 Relacionamento e pipeline

| Modelo | Tabela | Papel |
|--------|--------|--------|
| `Lead` | `leads` | Entrada comercial; documento, owner, BU, reativação, conversão (`dealId`) |
| `Deal` | `deals` | Negócio; pipeline, score, sourceType, productType, `wonAt` |
| `Customer` | `customers` | Cliente ativo; documento único no tenant; lifecycle pós-venda |
| `Activity` | `activities` | Interação humana + eventos de sistema (`operationalEventKind`) |
| `DealStageHistory` | `deal_stage_history` | Histórico de estágio (SLA) |
| `BusinessUnitPipeline` | `business_unit_pipelines` | Pipeline por empresa |
| `PipelineStage` | `pipeline_stages` | Estágios com `maxDays` e alerta |

### 1.3 Business Units

| Modelo | Tabela | Papel |
|--------|--------|--------|
| `BusinessUnit` | `business_units` | Empresa: `INSURANCE` ou `REAL_ESTATE` |
| `UserBusinessUnit` | `user_business_units` | Membership do usuário |
| `LeadBusinessUnit` | `lead_business_units` | Lead em múltiplas unidades (`isOrigin`) |
| `CustomerBusinessUnit` | `customer_business_units` | Cliente em múltiplas unidades |

### 1.4 Pós-venda, cotações e questionários

| Modelo | Tabela | Papel |
|--------|--------|--------|
| `Policy` | `policies` | Apólice / contrato |
| `PolicyRenewal` | `policy_renewals` | Fila comercial de renovação |
| `Opportunity` | `opportunities` | Oportunidade 360 (motor + manual) |
| `QuoteComparison` | `quote_comparisons` | Comparativo de cotações |
| `Quote` | `quotes` | Linha de cotação |
| `Proposal` | `proposals` | Proposta comercial (PDF) |
| `QuestionnaireTemplate` | `questionnaire_templates` | Modelo de formulário |
| `QuestionnaireField` | `questionnaire_fields` | Campo do template |
| `QuestionnaireSubmission` | `questionnaire_submissions` | Resposta (draft / submitted / …) |

### 1.5 Automação, comunicação e performance

| Modelo | Tabela | Papel |
|--------|--------|--------|
| `LeadReactivationSetting` | `lead_reactivation_settings` | Config de reativação por tenant |
| `LeadReactivationLog` | `lead_reactivation_logs` | Histórico de disparos |
| `LeadLossReason` | `lead_loss_reasons` | Motivos de perda (por BU) |
| `LeadFollowUp` | `lead_follow_ups` | Follow-up agendado |
| `MessageTemplate` | `message_templates` | Template WhatsApp/e-mail |
| `CrossSellOpportunity` | `cross_sell_opportunities` | Sugestão corretora ↔ imobiliária |
| `CommunicationProviderConfig` | `communication_provider_configs` | Credenciais do provider (JSON) |
| `CommunicationLog` | `communication_logs` | Envio/recebimento comercial |
| `SalesTarget` | `sales_targets` | Meta (indivíduo / equipe / empresa) |
| `SalesCommission` | `sales_commissions` | Comissão por deal ganho |
| `CommissionRule` | `commission_rules` | % por produto e BU |

### 1.6 Enums relevantes

| Enum | Valores (resumo) |
|------|------------------|
| `DataScope` | `own`, `team`, `tenant`, `shared` |
| `BusinessUnitType` | `INSURANCE`, `REAL_ESTATE` |
| `MessageChannel` | `WHATSAPP`, `EMAIL` |
| `CommunicationProviderKind` | `INTERNAL`, `EVOLUTION`, `META`, `ZAPI`, `TWILIO` |
| `DealSourceType` | `LEAD`, `RENEWAL`, `CROSS_SELL`, `MANUAL`, `REACTIVATION` |
| `CommissionStatus` | `PENDING`, `APPROVED`, `PAID`, `CANCELLED` |
| `OpportunityType` | seguros (`AUTO_*`, `LIFE_*`, …) + imóveis (`PROPERTY_BUY/SELL/RENT`) |
| `PolicyStatus` | apólice operacional (`pending` …) |
| `CommercialRenewalStatus` | fila comercial de renovação |

---

## 2. Módulos da API

Prefixo: `/api/v1`. Guards globais: JWT + permissões (rotas `@Public()`: login, health, webhook Evolution).

| Módulo | Controller(s) | Responsabilidade |
|--------|---------------|------------------|
| `auth` | `auth` | Login, refresh, logout, `/me` |
| `users` | `users` | Listar/detalhar usuários (`users:manage`) — sem CRUD completo |
| `tenants` | `tenants` | `GET /tenants/me` |
| `permissions` | `permissions` | Catálogo + papéis do tenant |
| `access` | (global) | `OwnershipService`, `BusinessUnitAccessService` |
| `leads` | `leads` | CRUD, duplicatas, contexto, conversão, shares, BU |
| `crm` | `crm/deals`, `crm` | Deals, pipelines, dashboards executivo e SLA |
| `customers` | `customers` | CRUD, Customer 360, dashboard 360 |
| `activities` | `activities` | Timeline operacional |
| `questionnaires` | `questionnaires` | Templates, campos, submissões |
| `quotes` | `quotes` | Comparativos, linhas, propostas, PDF, métricas |
| `policies` | `policies` | Emissão/listagem de apólices |
| `policy-renewals` | `policy-renewals` | Fila de renovação |
| `opportunities` | `opportunities` | Motor 360 + CRUD |
| `business-units` | `business-units` | Unidades + contexto ativo do usuário |
| `lead-follow-ups` | `lead-follow-ups` | Follow-ups |
| `lead-reactivation` | `automation/reactivation` | Config, métricas, run |
| `lead-loss-reasons` | `lead-loss-reasons` | Motivos de perda |
| `message-templates` | `message-templates` | Templates |
| `cross-sell` | `cross-sell` | Oportunidades e métricas |
| `communications` | `communications` | Dispatch, logs, Evolution, webhook |
| `commercial-automation` | `commercial/dashboard`, `automation/commercial/run` | Motor diário + dashboard recuperação |
| `sales-performance` | `performance`, `sales-targets`, `commissions`, `commission-rules` | Metas, comissões, ranking |
| `audit-logs` | `audit-logs` | Consulta de auditoria |
| `queue` | — | Worker `audit` (BullMQ) |
| `health` | `health` | Liveness, DB, Redis, runtime |

O web fala com a API via **BFF** (`apps/web/app/api/**`), não diretamente do browser (exceto o fluxo de login, que chama a API internamente no server).

---

## 3. Telas do front-end

### 3.1 Autenticação e home

| Rota | Tela | Status |
|------|------|--------|
| `/login` | Login | Pronto |
| `/` | Dashboard executivo operacional (`DashboardHome`) | Pronto |

### 3.2 Navegação principal (`mainNav`)

| Rota | Tela | Status |
|------|------|--------|
| `/crm/*` | Módulo CRM (subnav próprio) | Pronto (ver 3.3) |
| `/clientes` | Carteira de clientes | Pronto |
| `/leads` | Lista/sheet de leads | Pronto |
| `/questionarios/templates` | Builder de templates | Pronto |
| `/questionarios/respostas` | Submissões | Pronto |
| `/cotacoes` | Cotações / comparativos | Pronto |
| `/propostas` | Propostas | Pronto |
| `/apolices` | Apólices | **Placeholder** (`SectionPlaceholder`) |
| `/sinistros` | Sinistros | **Placeholder** |
| `/whatsapp` | Inbox WhatsApp | **Placeholder** (envio real está em Comunicação) |
| `/automacao/*` | Automação comercial | Pronto (ver 3.4) |
| `/configuracoes/*` | Configurações | Pronto (ver 3.5) |
| `/ui-kit` | Kit de design interno | Pronto (dev) |

`/apolices`, `/sinistros` e `/whatsapp` caem no catch-all `app/(dashboard)/[[...slug]]/page.tsx`.

### 3.3 CRM (`crmNavItems`)

| Rota | Tela |
|------|------|
| `/crm` | Visão geral do pipeline |
| `/crm/dashboard-comercial` | Recuperação comercial |
| `/crm/dashboard-360` | Carteira / receita / oportunidades |
| `/crm/dashboard-executivo` | Funil, conversão, receita por empresa |
| `/crm/dashboard-sla` | SLA do funil |
| `/crm/performance` | Metas, comissões, ranking |
| `/crm/negocios` | Kanban de deals |
| `/crm/contatos` | Índice de pessoas (derivado de leads/clientes) |
| `/crm/empresas` | Índice de contas |
| `/crm/clientes` | Clientes no shell CRM |
| `/crm/agenda` | Agenda do dia |
| `/crm/follow-ups` | Fila de follow-ups |
| `/crm/renovacoes` | Fila de renovações |
| `/crm/tarefas` | Workspace de tarefas (activities) |
| `/crm/atividades` | Timeline |
| `/crm/customer-360/[id]` | Customer 360 (abas: timeline, pendências, financeiro, leads, negócios, apólices, …) |

Contatos e empresas **não** são entidades Prisma próprias: são projeções do índice relacional (TD-10).

### 3.4 Automação

| Rota | Tela |
|------|------|
| `/automacao` | Hub |
| `/automacao/reativacao` | Config + métricas de reativação |
| `/automacao/comunicacao` | Dashboard de comunicação |
| `/automacao/templates` | Templates |
| `/automacao/cross-sell` | Cross-sell |

### 3.5 Configurações

| Rota | Tela |
|------|------|
| `/configuracoes` | Perfil + painel de permissões (somente leitura da sessão) |
| `/configuracoes/unidades` | Business Units + contexto |
| `/configuracoes/comunicacao` | Evolution / WhatsApp Business |
| `/configuracoes/crm/motivos-perda` | Motivos de perda |

Não há UI de CRUD de usuários/papéis (API de users é só GET).

---

## 4. Jobs agendados

**Um único cron comercial.** Não criar segundo job diário.

| Job | Fila | Agenda | O que faz |
|-----|------|--------|-----------|
| `CommercialAutomationJob` | `commercial-automation` | `0 7 * * *` America/Sao_Paulo | Orquestra o motor do dia |
| `LeadReactivationJob` (legado) | `lead-reactivation` | **Removido** do repeatable | O scheduler apaga o repeatable legado na subida |

`CommercialAutomationService.runDailyJob` executa, nesta ordem:

1. Reativação de leads perdidos  
2. Follow-ups vencidos  
3. Renovações (60/30/15 + idle)  
4. Motor de SLA comercial (`SalesSlaEngine`: warning 80%, overdue, escalonamento 3/5/7 dias)

Disparo manual: `POST /api/v1/automation/commercial/run` (`automation:manage`).

Fila à parte (não é cron):

| Worker | Fila | Papel |
|--------|------|--------|
| `AuditQueueProcessor` | `audit` | Persiste `AuditLog` de forma assíncrona |

---

## 5. Providers de comunicação

Interface: `CommunicationProvider` (`send`, `validateConnection`, `generateQrCode`, `disconnect`, `healthCheck`).

| Kind | Status | Comportamento |
|------|--------|----------------|
| `INTERNAL` | Pronto | Log local (compatibilidade / fallback) |
| `EVOLUTION` | Pronto | WhatsApp real (Evolution API / Baileys v2) |
| `META` | Stub | Falha explícita “não configurado” |
| `ZAPI` | Stub | Idem |
| `TWILIO` | Stub | Idem |

Canal persistido: `WHATSAPP` ou `EMAIL`. Evolution envia **WhatsApp**. E-mail existe no domínio (`MessageChannel.EMAIL`, templates) mas **não há SMTP/provider de e-mail**.

Webhook público: `POST /api/v1/communications/webhooks/evolution` (ACK sent/delivered/read/failed + inbound `communication_replied`).

Config UI: `/configuracoes/comunicacao`. API Key nunca retorna em claro.

---

## 6. ACL e ownership

Duas dimensões **independentes**, depois do filtro de `tenantId`:

```
Request → tenantId → permissão RBAC → Business Unit ACL → ownership → dados
```

Detalhe fora do escopo devolve **HTTP 404** (não 403), para não vazar existência.

### 6.1 RBAC

Catálogo em `@repo/auth` / seed: `dashboard:*`, `crm:*`, `clients:*`, `leads:*`, `leads:share`, `questionnaires:*`, `quotes:*`, `policies:*`, `claims:*`, `whatsapp:*`, `automation:*`, `settings:*`, `business-units:view-all|manage`, `users:manage`, `tenants:manage`, `audit:view`.

Papéis de sistema no seed principal: `admin`, `viewer`, `sales`.

Papéis extras no seed de ownership (`seed-ownership.ts`): `comercial`, `gerencia`, `parceiro` — **não** estão no `seed.ts` principal.

### 6.2 Ownership (`OwnershipService`)

| Escopo | Quem vê |
|--------|---------|
| `own` | `ownerUserId = eu` (e share, quando aplicável) |
| `team` | Equipes do usuário (`TeamMember`) |
| `tenant` | Todo o tenant (ainda filtrado por BU) |
| `shared` | Apenas `LeadShare` (parceiro) |

Enforcement configurável: `OWNERSHIP_ENFORCEMENT` (env) ou `tenant.settings.ownershipEnforcement` (`off` / modos de aviso vs bloqueio).

Leads têm `ownerUserId` + `ownerTeamId`. Deals têm `ownerUserId` (sem `teamId` próprio; equipe via usuário). `assignedTo` em Lead/Deal ainda é string livre (TD-02).

### 6.3 Business Unit ACL (`BusinessUnitAccessService`)

| Contexto | Visibilidade |
|----------|----------------|
| Admin + “Todas” (`currentBusinessUnitId` vazio) + `business-units:view-all` | Sem filtro de unidade |
| Unidade ativa no usuário | Só aquela unidade (se estiver na membership) |
| Membership vazia e sem view-all | Nenhum dado (`id in []`) |
| Filtro `businessUnitId` na query | Interseção com o permitido |

Leads/clientes: origem (`businessUnitId`) **ou** vínculo M:N. Deals/follow-ups/renovações/comissões: `businessUnitId` direto.

---

## 7. Business Units

Seed homologação:

| Slug | Tipo | Nome |
|------|------|------|
| `corretora-avila` | `INSURANCE` | Corretora Ávila |
| `avila-imoveis` | `REAL_ESTATE` | Ávila Imóveis |

Usuários de teste (seed principal):

| E-mail | Papel | Unidade |
|--------|-------|---------|
| `admin@insureflow.com` | admin | Todas |
| `viewer@insureflow.com` | viewer | — |
| `sales@insureflow.com` | sales | só Corretora |
| `imoveis@insureflow.com` | sales | só Imobiliária |

Pipeline comercial é **por unidade** (`BusinessUnitPipeline` + `PipelineStage`), com SLA (`maxDays`). Deal carrega `businessUnitId`, `pipelineId`, `sourceType`, `score`, `productType`.

Lead/cliente podem estar nas duas empresas (cross-sell). Contexto ativo: `PATCH /business-units/context` → `User.currentBusinessUnitId`.

---

## 8. Dashboards

| Tela | API | Conteúdo |
|------|-----|----------|
| `/` | KPIs agregados (leads, deals, atividades, quotes) | Home operacional |
| `/crm/dashboard-comercial` | `GET /commercial/dashboard` | Recuperação: reativação, follow-ups, renovações |
| `/crm/dashboard-360` | `GET /customers/dashboard-360` | Carteira, receita prevista, renovação, cross-sell |
| `/crm/dashboard-executivo` | `GET /crm/dashboard-executivo` | Funil, conversão, receita Corretora/Imobiliária, top corretores/produtos/fontes, comissões |
| `/crm/dashboard-sla` | `GET /crm/dashboard-sla` | In SLA / warning / overdue por corretor e empresa |
| `/crm/performance` | `GET /performance` + `/ranking` | Receita, meta %, comissões, ticket, conversão, ranking |
| `/automacao/comunicacao` | `GET /communications/dashboard` | Enviadas, entregues, lidas, respondidas, falhas |
| Customer 360 | `GET /customers/:id/360` | Visão 360 do cliente (inclui aba Financeiro) |

Todos respeitam tenant + BU ACL (+ owner quando o query informa `userId`).

---

## 9. Integrações existentes

| Integração | Uso |
|------------|-----|
| PostgreSQL | Persistência |
| Redis / BullMQ | Filas (audit + automação diária) |
| Evolution API | WhatsApp: envio, QR, conexão, webhooks de ACK/inbound |
| Next.js BFF | Proxy autenticado web → API |
| Prisma Migrate | Schema versionado |
| Neon / Railway / Vercel | Infra de ambientes (documentada em `docs/infra/`) |

Não há gateway de pagamento, storage S3 de arquivos de questionário, nem motor de e-mail.

---

## 10. Integrações pendentes

| Integração | Evidência no código | Observação |
|------------|---------------------|------------|
| Meta Cloud API (WhatsApp oficial) | `CommunicationProviderKind.META` + stub | Enum pronto, adapter não envia |
| Z-API | stub | Idem |
| Twilio | stub | SMS/WhatsApp Twilio não implementado |
| SMTP / provedor de e-mail | `MessageChannel.EMAIL` + templates | Dispatch de e-mail não é real |
| Inbox `/whatsapp` | nav + permissão `whatsapp:*` | Placeholder; o operacional vive em Comunicação |
| Sinistros / claims | permissão `claims:*`, evento `claim` na timeline | Sem módulo, sem tabela |
| Seguradoras (cotação automática) | cotações manuais | Sem API de seguradora |
| Storage de arquivos (campo FILE) | tipo de campo existe | Validado como string (TD-12) |
| IA / recomendação avançada | roadmap Smart Forms 7.6–7.8 | Score comercial no CRM é heurístico local |

---

## 11. Funcionalidades concluídas

Agrupado por epic recente (código mergeado neste repositório):

| Área | O que está pronto |
|------|-------------------|
| Multi-tenant + JWT + RBAC | Login, guards, catálogo de permissões |
| Leads | CRUD, documento, duplicatas, conversão transacional, shares, contexto `GET /leads/:id/context` |
| CRM pipeline | Kanban, deals, estágios por BU, source/score, histórico de estágio |
| SLA comercial (CRM-006.1) | Warning 80%, overdue, escalonamento owner/gerente/diretor, dashboard SLA, pendências no 360 |
| Customer 360 (CRM-005) | Agregação + geração de oportunidades + aba Pendências + aba Financeiro |
| Business Units (CRM-003.2) | Isolamento operacional Corretora/Imóveis, contexto, ACL em lista e detalhe |
| Evolution (CRM-004) | WhatsApp real, QR, webhooks, dashboard de comunicação |
| Automação comercial | Reativação, follow-ups, renovações 60/30/15, cross-sell, templates, um cron 07:00 |
| Questionários | Templates, builder, autosave, submissões, engine `@repo/forms-engine` (sprints 6–7 parciais) |
| Cotações e propostas | Comparativo, seleção, PDF, envio, métricas |
| Metas e comissões (CRM-006.2) | Targets, regras, comissão no Deal WON, ranking, performance |
| Ownership | Escopos own/team/tenant/shared em leads (e deals via owner/lead) |
| Auditoria | `AuditLog` assíncrono + activity kinds comerciais |

---

## 12. Funcionalidades parcialmente concluídas

| Item | O que falta |
|------|-------------|
| Apólices | API `policies` existe; **não há tela `/apolices`** (placeholder). Emissão a partir de deal ganho. |
| E-mail comercial | Canal e templates; sem provider de envio |
| WhatsApp no produto | Envio/recebimento via Evolution; **sem inbox** `/whatsapp` |
| Usuários e papéis | GET users/permissions; **sem UI/API de CRUD** de usuários/roles |
| Ownership em todas as entidades | Forte em Lead; Deal herda; Policy/Quote/Questionnaire nem sempre filtram ownership (BU sim) |
| Seed de papéis de corretora | Comentários citam comercial/gerência/parceiro; seed principal só admin/viewer/sales |
| Role `sales` | Sem `questionnaires:*` (TD-05) — corretor pode não abrir questionários |
| Questionário EXTERNAL | Modo no domínio; web não usa (TD-15) |
| Merge de leads | Endpoint de duplicatas existe; merge/preview não |
| `performance_viewed` | Kind de auditoria cadastrado; GET performance **não publica** o evento (evita spam) |
| Locação “1 aluguel” | Modelado como 100% do `deal.value`; depende do valor ser o aluguel mensal |
| Contatos / empresas no CRM | UI pronta sobre índice derivado; sem entidade própria |
| Dashboard home vs CRM | Home agrega KPIs; alguns blocos (produção financeira, indicadores de seguro) ainda são recortes operacionais, não BI |
| Smart Forms Engine | Validation + rules + field/block library avançados em docs/sprints 7; revisão/versionamento de template incompletos |
| Claims | Permissão e kind de activity; zero domínio |

---

## 13. Débitos técnicos

Fonte viva: `docs/technical-debt/README.md`, cruzada com o código atual.

| ID | Descrição | Área | Notas 2026-08 |
|----|-----------|------|----------------|
| TD-01 | Delete de lead sem validar deal/questionários | Leads | Ainda relevante |
| TD-02 | `assignedTo` sem FK | Domínio | Coexiste com `ownerUserId` |
| TD-03 | Lead sem documento | Domínio | Duplicata inevitável |
| TD-04 | Stage `fechado` vs `status: won` | CRM | Ativação de cliente no WON mitiga, mas o desacoplamento permanece |
| TD-05 | Role `sales` sem questionários | Auth/seed | Ainda no seed |
| TD-06 | Submissão `submitted` editável | Questionários | Sem workflow de revisão |
| TD-07 | `submittedAt` não auto no server | Questionários | Verificar se sprints 6+ mitigaram pontualmente |
| TD-08 | Múltiplos drafts por lead+template | Questionários | |
| TD-09 | Paginação em deals | CRM | **Parcialmente resolvido** (`page`/`limit` no `CrmService`) |
| TD-10 | Contatos/empresas sem entidade | CRM UI | |
| TD-11 | Status `reviewed`/`archived` sem UI | Questionários | |
| TD-12 | FILE como string | Questionários | Sem storage |
| TD-13 | Drift validação client/server | Forms | Mitigado pelo `@repo/forms-engine`, risco residual |
| TD-14 | Artefatos de build no working tree | Repo | |
| TD-15 | EXTERNAL mode não usado | Questionários | |
| TD-16 | Query keys `companies`/`policies` sem módulo completo | Frontend | `/apolices` placeholder confirma |
| TD-17 | DataTable ainda acoplado a legado | DS | |
| — | `prisma generate` EPERM no Windows se a API segura o query engine | DX | Reiniciar API |
| — | Unique de meta com NULL no Postgres | Performance | Resolvido via `scopeKey` |
| — | Textos de UI desatualizados (ex.: Automação ainda diz “interno agora; WhatsApp depois”) | UX | Evolution já está pronto |
| — | Roadmap CRM maio/2026 desatualizado | Docs | Este inventário é a fonte de status |

---

## 14. Bugs conhecidos

### 14.1 Corrigidos (relatórios em `docs/reports/` e `docs/audits/`)

Tratar como **histórico**, não como fila aberta, salvo regressão:

| ID | Tema | Status documentado |
|----|------|-------------------|
| BUG-003 | Questionário submissions 400 | Relatório de correção |
| BUG-005 | Estado de erro no dialog de lead | Relatório |
| BUG-006 / 007 | Contrato de criação de lead | Relatório |
| BUG-008 | Ambiente de execução | Relatório |
| BUG-009 | Double submit | Relatório |
| BUG-010.* | Performance de criação de lead / drawer | Instrumentado e mitigado |
| BUG-011.1 | Login BFF 500 | Instrumentado; 500 não reproduzido |
| BUG-014 | GET por ID sem ACL de BU | Corrigido na CRM-003.2 (404 fora do escopo) |
| BUG-015 | Seed sem vínculo de empresa | Corrigido na CRM-003.2 |

### 14.2 Riscos / lacunas abertas

Não há tracker único de bugs abertos no repositório. Itens que ainda podem gerar incidente:

1. **Placeholder `/apolices` / `/sinistros` / `/whatsapp`** — usuário com permissão chega numa tela vazia.  
2. **E-mail nas automações** — `CommunicationsService.dispatch` com canal EMAIL pode falhar/logar em tenant Evolution.  
3. **Deal WON sem `performedById`** — comissão/ativação só disparam no `updateDeal` autenticado.  
4. **Ownership `off`** — se o tenant deixar enforcement desligado, o ACL reduz-se a tenant + BU.  
5. **Parceiro (`shared`)** — seed de ownership separado; fluxo de parceiro pouco exercitado na UI principal.  
6. **Prisma generate no Windows** — EPERM com API ligada (DX, não produto).  
7. **Copy desatualizada** na hub de Automação (menciona WhatsApp “depois”).

---

## 15. Roadmap sugerido

Ordem pensada para a operação da Corretora Ávila + Ávila Imóveis, sem reabrir o que já está estável (SLA, Evolution, BU ACL, metas/comissões).

### Agora (integridade e superfície)

1. Tela de **Apólices** (`/apolices`) sobre a API `policies` já existente.  
2. Atualizar copy da Automação e do nav WhatsApp (ou ligar `/whatsapp` ao dashboard de comunicação).  
3. Completar seed de papéis (`comercial`, `gerencia`, `parceiro`) no `seed.ts` e corrigir TD-05 (`sales` + questionários).  
4. Validar enforcement de ownership em HML (`on`) com as três personas.

### Sequência comercial

5. **CRUD de usuários e papéis** (API + `/configuracoes` admin).  
6. Provider de **e-mail** (SMTP ou API) para follow-up/renovação quando o canal for EMAIL.  
7. **Merge de leads** (preview + `mergedIntoId`) — fecha Fase 6 do roadmap antigo.  
8. Inbox mínima de WhatsApp (thread por lead/cliente) em vez do placeholder.  
9. Unicidade parcial de documento em Lead + política de backfill (TD-03).

### Produto / domínio

10. Módulo **Sinistros** (hoje só permissão) ou remover da nav até existir.  
11. Entidade opcional de Contato/Empresa **ou** documentar o índice derivado como contrato oficial.  
12. Smart Forms: revisão de submissão + versionamento de template (sprints 7.5 / 7.9).  
13. Integração Meta Cloud API se a corretora exigir WhatsApp oficial (BSP), mantendo Evolution como default.

### Explicitamente fora (até haver demanda)

- Gateway de pagamento / financeiro além de comissões.  
- Cotação automática em seguradora.  
- Segundo cron diário (tudo entra no job das 07:00).  
- IA generativa no CRM.

---

## Referências rápidas

| Documento | Uso |
|-----------|-----|
| `docs/architecture/rbac-architecture.md` | Modelo RBAC |
| `docs/architecture/ownership-architecture.md` | Ownership (parte planejada vs implementada) |
| `docs/reports/crm-003-2-final-validation.md` | BU ACL homologado |
| `docs/reports/crm-004-evolution-api.md` | Evolution homologado |
| `docs/technical-debt/README.md` | Dívida técnica numerada |
| `docs/infra/README.md` | Ambientes e deploy |
| `packages/database/prisma/schema.prisma` | Fonte das entidades |
| `apps/api/src/app.module.ts` | Fonte dos módulos |
| `apps/web/lib/navigation.ts` + `apps/web/lib/crm-nav.ts` | Fonte das telas |

---

*Inventário gerado a partir do código em 20/08/2026. Não substitui ADRs nem runbooks de infra.*

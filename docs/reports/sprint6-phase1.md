# InsureFlow – Sprint 6.1
## Fase 1 – Consolidação da Arquitetura do CRM

**Data:** 2026-07-08  
**Referência:** [`docs/audits/crm-sprint6-audit.md`](../audits/crm-sprint6-audit.md)

---

## Resumo

Consolidação arquitetural do CRM com foco em ownership (`ownerUserId`), promoção do `DealSheetV2`, paginação opcional de deals, correção de segurança no refresh token, preparação de scoping por proprietário e remoção de código morto — **sem alterar contratos públicos existentes, regras de negócio ou layout**.

---

## Arquivos alterados (Sprint 6.1)

### Backend – novos

| Arquivo | Descrição |
|---------|-----------|
| `apps/api/src/common/utils/owner-assignment.util.ts` | Utilitários canônicos de responsável (`ownerUserId` → label) |
| `apps/api/src/common/utils/owner-assignment.util.spec.ts` | Testes unitários |

### Backend – modificados

| Arquivo | Descrição |
|---------|-----------|
| `apps/api/src/modules/leads/leads.service.ts` | Migração ownership: create/update/convert/mine/search |
| `apps/api/src/modules/access/ownership.service.ts` | `buildDealAccessWhere`, shadow logging para deals |
| `apps/api/src/modules/access/ownership-scope.spec.ts` | Testes de scoping de deals |
| `apps/api/src/modules/access/tenant-settings.util.ts` | Remoção de `mergeTenantSettings` (morto) |
| `apps/api/src/modules/crm/crm.service.ts` | Paginação opcional, scoping, `resolveResponsibleLabel` |
| `apps/api/src/modules/crm/crm.controller.ts` | Query params + actor no list |
| `apps/api/src/modules/crm/dto/deal.dto.ts` | `ListDealsQueryDto` |
| `apps/api/src/modules/auth/auth.service.ts` | Refresh token com `dataScope` + `teamIds` |
| `apps/api/src/modules/policies/policies.service.ts` | Remoção de `getCustomerPolicyAggregates` |

### Frontend – modificados

| Arquivo | Descrição |
|---------|-----------|
| `apps/web/components/crm/deals-page.tsx` | `DealSheetV2` como único sheet |
| `apps/web/components/crm/deal-sheet-v2.tsx` | Comentários atualizados |
| `apps/web/lib/data-access/modules/crm/api.ts` | Suporte a resposta paginada ou array |
| `apps/web/lib/crm/entity-sheet-navigation.ts` | Deal não exige mais `?sheet=v2` |
| `apps/web/lib/crm/relationship/search.ts` | Links de deal sem flag |

### Frontend – removidos

| Arquivo | Motivo |
|---------|--------|
| `apps/web/components/crm/deal-detail-sheet.tsx` | Legado substituído por V2 |
| `apps/web/components/crm/crm-page.tsx` | Componente morto (não referenciado) |
| `apps/web/components/dashboard/dashboard-claims.tsx` | Widget nunca montado |
| `apps/web/components/dashboard/dashboard-renewals.tsx` | Widget nunca montado |
| `apps/web/components/dashboard/dashboard-notifications.tsx` | Widget nunca montado |

### Documentação

| Arquivo | Descrição |
|---------|-----------|
| `docs/reports/sprint6-phase1.md` | Este relatório |

---

## Decisões arquiteturais

### 1. Ownership — `ownerUserId` como fonte canônica

- **`ownerUserId`** passa a ser a referência para filtro `mine`, enforcement de escopo e responsável exibido.
- **`assignedTo`** permanece no schema e nas respostas API como **campo legado sincronizado** (compatibilidade retroativa).
- Criação de lead: `ownerUserId` do actor; `assignedTo` derivado do nome/e-mail do owner.
- Update com `assignedTo`: tenta resolver `ownerUserId` por id/e-mail/nome; limpar `assignedTo` zera `ownerUserId`.
- Conversão lead→deal: `assignedTo` do deal usa `lead.owner` (canônico) antes do fallback legado.
- Busca: inclui `ownerUser.name` e `ownerUser.email` além de `assignedTo`.

### 2. Scoping de deals (preparação)

- `OwnershipService.buildDealAccessWhere()` filtra via `convertedLead.ownerUserId/ownerTeamId/shares`.
- `CrmService.findDeals()` aplica scoping quando `OWNERSHIP_ENFORCEMENT` ≠ `off`:
  - **`shadow`:** log de comparação, sem filtrar (igual leads).
  - **`on`:** filtra negócios pelo owner do lead convertido.
- Negócios **sem lead convertido** ficam visíveis apenas em escopo `tenant` quando enforcement está `on`.

### 3. Paginação GET /crm/deals (compatível)

- Query params opcionais: `page`, `limit` (max 500).
- **Sem params:** retorna **array** (contrato existente inalterado) — Kanban continua recebendo todos os deals.
- **Com params:** retorna `{ data, meta }` (padrão leads) para consumo futuro/APIs paginadas.
- Frontend `fetchDeals()` aceita ambos os formatos.

### 4. Deal Workspace

- `DealSheetV2` é a **única** implementação em `/crm/negocios`.
- Flag `?sheet=v2` removida para deals (links de workspace search e `buildEntitySheetHref`).
- Outras entidades (lead, contact, company, customer) mantêm opt-in `?sheet=v2`.

### 5. Segurança — refresh token

- `AuthService.refresh()` agora chama `OwnershipService.resolveContext()` e inclui **`dataScope`** e **`teamIds`** no JWT — paridade com login.

---

## Melhorias implementadas

| Área | Melhoria | Prioridade audit |
|------|----------|------------------|
| Ownership | Migração para `ownerUserId`, sync legado `assignedTo` | A5 |
| Ownership | Scoping de deals preparado (shadow/on) | A5 |
| Deal Workspace | `DealSheetV2` default, legacy removido | A2 |
| Performance | Paginação opcional + batch queries mantidas | A6 |
| Performance | `dealLeadSelect` reutilizável, `ownerUser` no include | A6 |
| Segurança | Refresh JWT com `dataScope`/`teamIds` | A3 |
| Segurança | RBAC CRM inalterado (`crm:view`/`crm:manage` em todos endpoints) | — |
| Limpeza | 5 arquivos mortos removidos | B1, B2 |
| Limpeza | `getCustomerPolicyAggregates`, `mergeTenantSettings` removidos | B2 |

---

## Validação executada

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | ✅ Passou |
| `npm run check-types` | ✅ Passou |
| `npm test` (api) | ⚠️ 47/49 passaram — **2 falhas pré-existentes** não relacionadas a esta fase |
| `npm run build` | ✅ Passou |

### Testes pré-existentes falhando

1. `document.util.spec.ts` — normalização CNPJ
2. `app.controller.spec.ts` — expectativa `"Hello World!"` desatualizada

### Testes novos/atualizados passando

- `owner-assignment.util.spec.ts`
- `ownership-scope.spec.ts` (inclui `buildDealAccessWhere`)

---

## Riscos encontrados

| Risco | Severidade | Mitigação aplicada |
|-------|------------|-------------------|
| Deals sem lead invisíveis com enforcement `on` | Média | Documentado; shadow mode permite validação antes de ativar |
| `assignedTo` legado em deals diretos (sem lead) | Baixa | Campo mantido; scoping usa lead convertido |
| Paginação não usada pelo Kanban | Baixa | Default sem params = array completo |
| Leads antigos sem `ownerUserId` backfill | Média | `assignedTo` ainda retornado; script `hml:sprint2:align-owners` disponível |
| Testes legados quebrados | Baixa | Fora do escopo desta fase; corrigir em hardening |

---

## Pendências restantes (fora desta fase)

| Item | Prioridade | Notas |
|------|------------|-------|
| Corrigir filtro `status` em GET /customers | Alta (A4) | Bug documentado na auditoria |
| Backfill massivo `ownerUserId` ← `assignedTo` | Alta | Script existente; rodar em staging |
| `ownerUserId`/`ownerTeamId` no model `Deal` | Média | Requer migration |
| LeadShare API (`leads:share`) | Média | Schema pronto, sem CRUD |
| GET /crm/deals/:id | Média | Endpoint individual |
| UI write de cotações | Alta (A1) | Feature nova — Sprint posterior |
| Promover `LeadSheetV2` (remover flag leads) | Média | Mesmo padrão do deal |
| Corrigir testes `document.util` e `app.controller` | Baixa | Débito pré-existente |
| FKs ausentes (`quotes.tenantId`, etc.) | Média | Migration futura |
| Dashboard widgets (claims/renewals/notifications) | Média | Removidos como mortos; reimplementar quando houver backend |

---

## Compatibilidade garantida

- ✅ Endpoints existentes mantêm shape de resposta default (array de deals).
- ✅ DTOs de create/update lead e deal inalterados (`assignedTo` ainda aceito).
- ✅ Layout das telas inalterado (`DealSheetV2` já validado visualmente).
- ✅ Regras de negócio (conversão, won→cliente, pipeline) inalteradas.
- ✅ RBAC CRM: `@RequirePermissions('crm:view'|'crm:manage')` preservado em todos os endpoints.

---

*Relatório gerado ao concluir Sprint 6.1 – Fase 1.*

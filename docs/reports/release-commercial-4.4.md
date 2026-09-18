# Release Comercial 4.4 — Waves 2 e 3

**Data:** 2026-09-17 (preparação)  
**GO produção:** 18/09/2026 — `docs/reports/comercial-4.4-production-go.md`  
**Worktree:** `InsureFlow-wt-sprint44`  
**Branch:** `feature/sprint-comercial-4.4`  
**HEAD git (à época desta preparação):** `446a472` (`feat(comercial): wave1 reactivation foundation`) — Wave 1 **já em produção**  
**Escopo desta release:** Fila de Reativação (Wave 2) + Campanhas de Reativação (Wave 3)  
**Fora de escopo:** Portal, Governança, WhatsApp, scheduler, envio automático, Dashboard Executivo, SaaS, novas regras/UX

---

## Veredito

Este documento é a **preparação** (2026-09-17). Superado pelo GO em produção em **18/09/2026**.

# GO (produção — 18/09/2026)

Ver `docs/reports/comercial-4.4-production-go.md` e `docs/reports/release-commercial-4.4-production-validation.md`.

Preparação original (histórico):

# NO GO (produção) — 2026-09-17

O pacote de código está **pronto para versionar**. Produção permanece bloqueada até commit + `migrate deploy` + deploy API/WEB + smoke E2E em HML.

| Camada | Situação |
|--------|----------|
| Wave 1 | GO em produção (SHA `446a472`) |
| Wave 2 | Código + lint + types + build verdes; **não commitado, não publicado** |
| Wave 3 | Código + migration SQL + lint + types + build verdes; **não commitado, migration não aplicada, não publicado** |

---

## 1. Escopo

### Wave 2 — Fila de Reativação

- Tela `/crm/reativacoes` (Hoje / Atrasadas / Próximos 7 dias)
- Ações manuais: **Reativar** e **Adiar** (7/15/30 ou data)
- KPIs da Agenda Comercial apontam para a fila (`?window=`)
- Eventos: `lead_reactivated`, `lead_reactivation_postponed`
- ACL de unidade de negócio via `BusinessUnitAccessService.leadWhere`

### Wave 3 — Campanhas de Reativação

- Tela `/crm/campaigns/reactivation` (lista + detalhe)
- CRUD de campanha, iniciar, encerrar
- Preview / adicionar / remover leads perdidos
- Status de contato + reativar lead da campanha
- Sem disparo automático
- Eventos: `campaign_created`, `campaign_started`, `campaign_finished`, `campaign_lead_added`, `campaign_lead_removed`, `lead_reactivated_campaign`
- ACL via `resolveIds` (campanha) + `leadWhere` (leads)

### O que esta preparação **não** fez

- Não criou funcionalidade nova
- Não alterou regra de negócio nem UX
- Ajustes apenas de lint/prettier/tipos em testes e DTOs, necessários para publicação

---

## 2. Migrations

### Arquivo

`packages/database/prisma/migrations/20260917120000_reactivation_campaigns/migration.sql`

### Objetos

| Tipo | Nome |
|------|------|
| Enum | `ReactivationCampaignStatus` (`DRAFT`, `IN_PROGRESS`, `FINISHED`) |
| Enum | `CampaignLeadContactStatus` (`NOT_STARTED`, `IN_PROGRESS`, `NO_RESPONSE`, `INTERESTED`, `REACTIVATED`, `CLOSED`) |
| Tabela | `reactivation_campaigns` |
| Tabela | `campaign_leads` (unique `campaign_id + lead_id`) |

FKs: `tenants`, `users` (owner / createdBy / addedBy), `business_units` (SET NULL), `leads` (CASCADE). Índices por tenant, status, owner, BU, campaign, lead, contact_status.

Wave 2 **não** tem migration — usa colunas Wave 1 (`nextReactivationAt`, `reactivationEnabled`, `lossReasonId`).

### Relatório Prisma (2026-09-17)

| Comando | Resultado |
|---------|-----------|
| `prisma validate` | **PASS** (schema válido; `DATABASE_URL` dummy para o CLI) |
| `prisma migrate status` | **BLOQUEADO** — datasource local `localhost:5432` / db `insureflow` inacessível; Docker Desktop parado |
| Produção (esperado) | migration **pendente** — tabelas Wave 3 ainda não existem no runtime |

Aplicar somente em deploy da API: `npx prisma migrate deploy` (script `start:release` da API).

---

## 3. Rotas WEB

| Rota | Permissão nav | Wave |
|------|---------------|------|
| `/crm/reativacoes` | `crm:view` | 2 |
| `/crm/campaigns/reactivation` | `crm:view` | 3 |
| `/crm/campaigns/reactivation/[id]` | `crm:view` | 3 |
| `/crm/agenda` (links KPI → fila) | `crm:view` | 1+2 |

Build Next (webpack) registrou as rotas acima e os BFF listados na §4.

---

## 4. Endpoints

Prefixo API: `/api/v1`  
Prefixo BFF: `/api` (proxy Next → API)

### Wave 2 — `commercial-reactivations`

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/commercial-reactivations` | `crm:view` |
| POST | `/commercial-reactivations/:leadId/reactivate` | `leads:manage` |
| POST | `/commercial-reactivations/:leadId/postpone` | `leads:manage` |

BFF: `apps/web/app/api/commercial-reactivations/` (`route.ts`, `[leadId]/reactivate`, `[leadId]/postpone`).

### Wave 3 — `commercial-reactivation-campaigns`

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/commercial-reactivation-campaigns` | `crm:view` |
| POST | `/commercial-reactivation-campaigns` | `crm:manage` |
| GET | `/commercial-reactivation-campaigns/:id` | `crm:view` |
| PATCH | `/commercial-reactivation-campaigns/:id` | `crm:manage` |
| POST | `/commercial-reactivation-campaigns/:id/start` | `crm:manage` |
| POST | `/commercial-reactivation-campaigns/:id/finish` | `crm:manage` |
| POST | `/commercial-reactivation-campaigns/:id/preview-leads` | `crm:view` |
| POST | `/commercial-reactivation-campaigns/:id/add-leads` | `crm:manage` |
| PATCH | `/commercial-reactivation-campaigns/:id/leads/:campaignLeadId` | `leads:manage` |
| DELETE | `/commercial-reactivation-campaigns/:id/leads/:campaignLeadId` | `crm:manage` |
| POST | `/commercial-reactivation-campaigns/:id/leads/:campaignLeadId/reactivate` | `leads:manage` |

BFF completo (GET/POST lista, GET/PATCH id, start, finish, preview-leads, add-leads, PATCH/DELETE lead, reactivate).

---

## 5. Deploy readiness

| Superfície | Status | Notas |
|------------|--------|--------|
| **API** | PRONTO | Módulos registrados em `app.module.ts`; `nest build` 0; `tsc --noEmit` 0 |
| **BFF** | PRONTO | Proxy 1:1 dos endpoints Wave 2/3 |
| **WEB** | PRONTO | Workspaces + nav + labels; `next build --webpack` 0; `tsc --noEmit` 0 |
| **ACL** | PRONTO | Fila: `leadWhere`. Campanha: `resolveIds` + `leadWhere` nos leads. Testes cobrem 404 fora da ACL |
| **Timeline / Activity** | PRONTO | `ActivityEngineService.publish` → tabela `activities` + `operationalEventKind` |
| **Audit** | PRONTO (via Activity) | Mesmo canal da Wave 1; kinds no catálogo API e WEB (`ACTIVITY_EVENT_LABELS`) |
| **KPIs Agenda** | PRONTO | Links `/crm/reativacoes?window=today\|overdue\|next7` |

### Lint / types / build

| Check | Resultado |
|-------|-----------|
| ESLint API (arquivos Wave 2/3) | **0** (`--max-warnings 0`) |
| ESLint WEB (arquivos Wave 2/3) | **0** (`--max-warnings 0`) |
| `tsc --noEmit` API | **0** |
| `tsc --noEmit` WEB | **0** |
| `nest build` | **0** |
| `next build --webpack` | **0** |
| Jest (fila + campanhas + utils) | **25/25** (4 suites) |

Temporários: nenhum (`_gate*`, scripts avulsos). Apenas código e docs de sprint.

---

## 6. Smoke

### 6.1 Serviço (executado)

Fluxo coberto por testes de serviço (sem UI, sem banco real):

Lead perdido → fila (ACL + métricas) → adiar (`lead_reactivation_postponed`) → reativar (`lead_reactivated`, status ativo, `nextReactivationAt` null, follow-up) → campanha (`campaign_created`) → preview/add (`campaign_lead_added`) → reativar campanha (`lead_reactivated_campaign`, pipeline `contacted`) → 404 ACL.

**Resultado: PASS 25/25.**

### 6.2 Homologação E2E (não executado)

Bloqueadores:

- API local (`:3001`) e WEB local (`:3000`) **fora do ar**
- PostgreSQL `localhost:5432` **inacessível**
- Docker Desktop **parado**
- Waves 2/3 **não commitadas / não implantadas** em HML ou produção

Fluxo UI pedido (Lead → Perdido → Fila → Adiar → Fila → Reativar → Perdido → Campanha → Reativar → Pipeline) **não rodou** ponta a ponta nesta preparação.

### 6.3 Produção (baseline anterior)

Wave 1: PATCH lost sem motivo → 400.  
Wave 2/3: endpoints **404** (código ainda não publicado).

---

## 7. Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Deploy WEB sem API (ou o inverso) | 404 na fila/campanhas | Publicar API **antes** da WEB; health-check dos endpoints autenticados |
| `migrate deploy` esquecido | API sobe e quebra em `reactivationCampaign` | Usar `start:release` da API; confirmar `_prisma_migrations` |
| Deploy com worktree sujo / WIP Portal | Features fora de escopo em prod | Commit **somente** arquivos da lista §9; SHA isolado |
| `next build` default (Turbopack) | Falha em junction `node_modules` de worktree | Build de produção com `--webpack` (já validado) |
| Smoke E2E ainda não feito | Regressão de UX/timeline só aparece após go-live | HML obrigatório antes de prod |
| Rollback Wave 3 incompleto | Tabelas órfãs | Script de rollback SQL abaixo; Wave 2 não precisa de DB rollback |

---

## 8. Rollback

### Wave 2 (sem migration)

1. Reverter deploy API/WEB para SHA `446a472` (Wave 1).
2. Rotas `/crm/reativacoes` e `/api/v1/commercial-reactivations` deixam de existir.
3. Leads já reativados/adiados **permanecem** no estado atual (irreversível de dados; aceitável).

### Wave 3 (com migration)

1. Reverter código para `446a472`.
2. Se a migration já rodou, aplicar rollback SQL **somente** se não houver dados críticos:

```sql
DROP TABLE IF EXISTS "campaign_leads";
DROP TABLE IF EXISTS "reactivation_campaigns";
DROP TYPE IF EXISTS "CampaignLeadContactStatus";
DROP TYPE IF EXISTS "ReactivationCampaignStatus";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260917120000_reactivation_campaigns';
```

3. Atividades `campaign_*` / `lead_reactivated_campaign` já gravadas na timeline **não** são apagadas.

---

## 9. Lista final de arquivos

### Modificados (sobre Wave 1)

- `apps/api/src/app.module.ts`
- `apps/api/src/common/utils/activity-event-kinds.spec.ts`
- `apps/api/src/common/utils/activity-event-kinds.util.ts`
- `apps/api/src/common/utils/lead-reactivation.util.spec.ts`
- `apps/api/src/common/utils/lead-reactivation.util.ts`
- `apps/web/components/crm/commercial-agenda-workspace.tsx`
- `apps/web/lib/crm/activity-event-kinds.ts`
- `apps/web/lib/data-access/query-keys.ts`
- `apps/web/lib/navigation.spec.ts`
- `apps/web/lib/navigation.ts`
- `packages/database/prisma/schema.prisma`

### Novos — Wave 2

- `apps/api/src/modules/commercial-reactivations/**`
- `apps/web/app/(dashboard)/crm/reativacoes/page.tsx`
- `apps/web/app/api/commercial-reactivations/**`
- `apps/web/components/crm/commercial-reactivations-workspace.tsx`
- `apps/web/lib/data-access/modules/commercial-reactivations/api.ts`
- `docs/reports/comercial-4.3-wave2.md`

### Novos — Wave 3

- `apps/api/src/modules/commercial-reactivation-campaigns/**`
- `apps/web/app/(dashboard)/crm/campaigns/reactivation/**`
- `apps/web/app/api/commercial-reactivation-campaigns/**`
- `apps/web/components/crm/reactivation-campaigns-workspace.tsx`
- `apps/web/components/crm/reactivation-campaign-detail-workspace.tsx`
- `apps/web/lib/data-access/modules/commercial-reactivation-campaigns/api.ts`
- `packages/database/prisma/migrations/20260917120000_reactivation_campaigns/migration.sql`
- `docs/reports/comercial-4.4-wave3.md`

### Docs de preparação (não são runtime)

- `docs/reports/comercial-4.4-go-live.md`
- `docs/reports/release-commercial-4.4.md`

---

## 10. Commits sugeridos

Não executados nesta preparação (aguardam autorização).

```
feat(comercial): wave2 reactivation queue
```

Fila operacional `/crm/reativacoes`, reativar/adiar, BFF, ACL e eventos de activity.

```
feat(comercial): wave3 reactivation campaigns
```

Campanhas manuais, migration `20260917120000_reactivation_campaigns`, BFF completo e timeline.

```
docs(comercial): release commercial 4.4
```

Release notes, go-live e relatórios Wave 2/3.

---

## 11. Checklist produção

Após autorização de commit + deploy:

- [ ] Commit dos arquivos da §9 (sem WIP de Portal/Governança/BU)
- [ ] Push da branch / PR para o SHA isolado
- [ ] API Railway: `prisma migrate deploy` + restart (`20260917120000` em `_prisma_migrations`)
- [ ] Confirmar tabelas `reactivation_campaigns` e `campaign_leads`
- [ ] Deploy WEB Vercel do **mesmo** SHA
- [ ] Smoke autenticado HML, depois produção:

  1. Lead → Perdido (motivo obrigatório)  
  2. Aparece na Fila  
  3. Adiar → volta à fila na nova data  
  4. Reativar → pipeline ativo + follow-up  
  5. Perder de novo  
  6. Incluir em campanha → iniciar  
  7. Reativar pela campanha → pipeline  
  8. Timeline: `lead_lost`, `lead_reactivation_postponed`, `lead_reactivated`, `campaign_*`, `lead_reactivated_campaign`  
  9. KPIs Agenda (hoje / atrasadas / 7 dias)

- [ ] Confirmar ACL (usuário de outra BU não vê o lead)
- [ ] Confirmar 401/403 sem permissão
- [ ] Sem envio automático / WhatsApp / scheduler

**GO produção somente quando este checklist estiver 100% verde.**

# Comercial 4.4 — Wave 3 Campanhas de Reativação

**Data:** 2026-09-17  
**Branch:** `feature/sprint-comercial-4.4`  
**Worktree:** `InsureFlow-wt-sprint44`  
**Base:** Wave 1 (`446a472`) + Wave 2 (fila operacional no working tree)  
**Status:** implementação local — **sem push / merge / deploy**

---

## 1. Arquitetura

Campanhas manuais para agrupar leads perdidos e operar contato humano. **Sem** disparo automático, WhatsApp, e-mail, scheduler ou rules engine.

```
CRM → Campanhas de Reativação
        /crm/campaigns/reactivation
                │
                ├── lista + KPIs agregados
                └── /:id detalhe
                        ├── filtros → preview count
                        ├── add leads → CampaignLead
                        ├── status contato
                        └── reativar → funil ativo + auditoria
```

| Camada | Responsabilidade |
|--------|------------------|
| `ReactivationCampaign` | Nome, responsável, status, BU, datas |
| `CampaignLead` | Vínculo lead↔campanha + `contactStatus` |
| Activity Engine | Auditoria / timeline |
| BU ACL | `resolveIds` + `leadWhere` na seleção |

---

## 2. Entidades

### Enums

- `ReactivationCampaignStatus`: `DRAFT` \| `IN_PROGRESS` \| `FINISHED`
- `CampaignLeadContactStatus`: `NOT_STARTED` \| `IN_PROGRESS` \| `NO_RESPONSE` \| `INTERESTED` \| `REACTIVATED` \| `CLOSED`

### Models (Prisma)

**`ReactivationCampaign`** → `reactivation_campaigns`  
`name`, `description`, `ownerUserId`, `createdById`, `status`, `businessUnitId?`, `startedAt?`, `finishedAt?`

**`CampaignLead`** → `campaign_leads`  
`campaignId`, `leadId`, `contactStatus`, `addedById?`, `addedAt`, `contactedAt?`, `reactivatedAt?`, `notes?`  
`@@unique([campaignId, leadId])`

**Migration:** `packages/database/prisma/migrations/20260917120000_reactivation_campaigns/migration.sql`

---

## 3. Endpoints

Base: `/api/v1/commercial-reactivation-campaigns`

| Método | Path | Permissão | Função |
|--------|------|-----------|--------|
| GET | `/` | `crm:view` | Listar + KPIs |
| POST | `/` | `crm:manage` | Criar (`campaign_created`) |
| GET | `/:id` | `crm:view` | Detalhe + leads |
| PATCH | `/:id` | `crm:manage` | Editar metadados |
| POST | `/:id/start` | `crm:manage` | Iniciar (`campaign_started`) |
| POST | `/:id/finish` | `crm:manage` | Encerrar (`campaign_finished`) |
| POST | `/:id/preview-leads` | `crm:view` | Contagem por filtros |
| POST | `/:id/add-leads` | `crm:manage` | Vincular (`campaign_lead_added`) |
| DELETE | `/:id/leads/:campaignLeadId` | `crm:manage` | Remover (`campaign_lead_removed`) |
| PATCH | `/:id/leads/:campaignLeadId` | `leads:manage` | Status contato |
| POST | `/:id/leads/:campaignLeadId/reactivate` | `leads:manage` | Reabrir funil (`lead_reactivated_campaign`) |

### Filtros de seleção

`lossReasonId`, `source`, `ownerUserId`, `company` (texto), `businessUnitId`, `lostDays` ∈ {30,60,90,180}

### KPIs

`totalLeads`, `contacted`, `reactivated`, `conversionRate = reactivated / totalLeads * 100`

---

## 4. Arquivos alterados / criados

### Database

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260917120000_reactivation_campaigns/migration.sql`

### API

- `apps/api/src/modules/commercial-reactivation-campaigns/**`
- `apps/api/src/app.module.ts`
- `apps/api/src/common/utils/activity-event-kinds.util.ts` (+ labels/spec)

### Web

- `apps/web/app/(dashboard)/crm/campaigns/reactivation/page.tsx`
- `apps/web/app/(dashboard)/crm/campaigns/reactivation/[id]/page.tsx`
- `apps/web/components/crm/reactivation-campaigns-workspace.tsx`
- `apps/web/components/crm/reactivation-campaign-detail-workspace.tsx`
- `apps/web/app/api/commercial-reactivation-campaigns/**`
- `apps/web/lib/data-access/modules/commercial-reactivation-campaigns/api.ts`
- `apps/web/lib/data-access/query-keys.ts`
- `apps/web/lib/navigation.ts` + `navigation.spec.ts`
- `apps/web/lib/crm/activity-event-kinds.ts`

### Docs

- `docs/reports/comercial-4.4-wave3.md` (este arquivo)

*(Worktree também contém artefatos Wave 2: fila `/crm/reativacoes`.)*

---

## 5. Testes executados

| Suite | Resultado |
|-------|-----------|
| `commercial-reactivation-campaigns.service` | ✅ 6 passed (create, preview, add, start gate, reactivate+audit, ACL 404) |
| `activity-event-kinds` | ✅ 3 passed |
| `commercial-reactivations.service` (Wave 2) | ✅ 5 passed |
| `navigation.spec` (tsx) | ✅ 9 passed |

---

## 6. Builds

| Build | Resultado |
|-------|-----------|
| `npx prisma generate` | ✅ |
| `npx nest build` | ✅ exit 0 |
| `npx next build --webpack` | ✅ exit 0 · rotas `/crm/campaigns/reactivation` e `/[id]` |

Nota: `next build` (Turbopack) falha neste worktree por junction `node_modules` apontando para outro worktree; webpack build valida o artefato.

---

## 7. Smoke test (checklist — não executado em produção)

1. Menu CRM → **Campanhas de Reativação**
2. Criar campanha (nome + descrição) → status Rascunho
3. Filtros (motivo / origem / empresa / 30–180 dias) → “N leads encontrados”
4. Adicionar leads → grid com status “Não iniciado”
5. Iniciar campanha → Em andamento + activity `campaign_started`
6. Registrar contato / Interessado
7. Marcar Reativado → lead `contacted`, some da lógica lost, timeline `lead_reactivated_campaign`
8. Encerrar → `campaign_finished`; KPIs coerentes
9. Trocar BU → lista respeita ACL

---

## 8. Riscos

| Risco | Mitigação / backlog |
|-------|---------------------|
| Migration ainda não aplicada em prod | Deploy futuro com `prisma migrate deploy` |
| Filtro responsável por ID cru na UI | Suficiente Wave 3; evoluir para select de usuários |
| ACL campanha permite `businessUnitId=null` | Necessário para campanhas transversais; revisar se operação exigir BU obrigatória |
| Sem envio automático | Intencional — Master Plan |

---

## 9. Backlog restante

- Templates de mensagem / integração canal (fora Wave 3)
- Dashboard taxa de campanhas no comercial
- Export CSV da lista
- Atribuição em massa de responsável na campanha
- Commit/merge Wave 2 + Wave 3 e go-live

---

## 10. Entrega

1. **Arquivos:** §4  
2. **Entidades:** `ReactivationCampaign`, `CampaignLead` + enums  
3. **Endpoints:** §3  
4. **Testes:** 6 + 3 + 5 API · 9 navigation — verdes  
5. **Build:** nest ✅ · next (webpack) ✅  
6. **Relatório:** este arquivo  
7. **Evidências:** Jest/tsx exit 0; builds exit 0  

**Sem push. Sem merge. Sem deploy.**

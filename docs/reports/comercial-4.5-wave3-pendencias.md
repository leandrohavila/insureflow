# Sprint Comercial 4.5 — Fechamento das Pendências da Wave 3

**Data:** 2026-09-21  
**Branch local:** `cursor/comercial-45-wave3-5c07`  
**Base:** Sprint Comercial 4.4 (Wave 3 publicada)  
**Escopo:** workspace atual — **sem push / merge / deploy**

---

## 1. Arquivos alterados

### Backend / banco

| Arquivo | Mudança |
|---|---|
| `packages/database/prisma/schema.prisma` | `LeadFollowUp.campaignId` + unique `(campaignId, leadId)` |
| `packages/database/prisma/migrations/20260921120000_campaign_followups/migration.sql` | Migration da FK e índice único |
| `apps/api/src/modules/commercial-reactivation-campaigns/commercial-reactivation-campaigns.service.ts` | Follow-ups no `start`, PATCH só em DRAFT, `audit_logs` |
| `apps/api/src/modules/commercial-reactivation-campaigns/commercial-reactivation-campaigns.module.ts` | Importa `LeadFollowUpsModule` + `AuditLogsModule` |
| `apps/api/src/modules/lead-follow-ups/lead-follow-ups.service.ts` | `scheduleForCampaign()` no LeadFollowUp existente |
| `apps/api/src/modules/activities/activity-engine.service.ts` | `campaign_updated` sem entidade obrigatória |
| `apps/api/src/common/utils/activity-event-kinds.util.ts` | `campaign_updated`, `campaign_followup_created` |

### Frontend

| Arquivo | Mudança |
|---|---|
| `apps/web/lib/crm/reactivation-campaigns.ts` | Regras de edição, alias PT, path canônico |
| `apps/web/lib/crm/commercial-auto-refresh.ts` | Intervalo 30s compartilhado com a Agenda |
| `apps/web/lib/crm/activity-event-kinds.ts` | Espelho dos novos kinds |
| `apps/web/lib/data-access/modules/commercial-reactivation-campaigns/api.ts` | `updateReactivationCampaign` (PATCH existente) |
| `apps/web/components/crm/reactivation-campaign-edit-form.tsx` | Edição de nome / descrição / responsável |
| `apps/web/components/crm/reactivation-campaigns-workspace.tsx` | Edição na grid + auto-refresh |
| `apps/web/components/crm/reactivation-campaign-detail-workspace.tsx` | Edição DRAFT + auto-refresh de KPIs |
| `apps/web/components/crm/commercial-agenda-workspace.tsx` | `refetchInterval` 30s (padrão da Agenda) |
| `apps/web/app/(dashboard)/crm/campanhas-reativacao/page.tsx` | Redirect da lista |
| `apps/web/app/(dashboard)/crm/campanhas-reativacao/[id]/page.tsx` | Redirect de deep link |

### Testes

| Arquivo | Cobertura |
|---|---|
| `apps/api/src/modules/commercial-reactivation-campaigns/commercial-reactivation-campaigns.service.spec.ts` | create / update / add / start / follow-ups / finish |
| `apps/api/src/modules/lead-follow-ups/lead-follow-ups.service.spec.ts` | `scheduleForCampaign` + idempotência |
| `apps/api/src/common/utils/activity-event-kinds.spec.ts` | Novos kinds e labels |
| `apps/web/lib/crm/reactivation-campaigns.spec.ts` | edição, auto-refresh, alias PT |

---

## 2. Endpoints impactados

Contrato HTTP **inalterado** (compatível com 4.4). Comportamento interno:

| Método | Rota | Impacto 4.5 |
|---|---|---|
| `POST` | `/api/v1/commercial-reactivation-campaigns` | Activity + `audit_logs.campaign_created` |
| `PATCH` | `/api/v1/commercial-reactivation-campaigns/:id` | Somente `DRAFT`; activity + `campaign_updated` |
| `POST` | `/api/v1/commercial-reactivation-campaigns/:id/start` | Cria `LeadFollowUp` por lead; activity `campaign_followup_created`; não duplica |
| `POST` | `/api/v1/commercial-reactivation-campaigns/:id/finish` | `audit_logs.campaign_finished` |
| `POST` | `/api/v1/commercial-reactivation-campaigns/:id/add-leads` | `audit_logs.campaign_lead_added` |
| `DELETE` | `/api/v1/commercial-reactivation-campaigns/:id/leads/:campaignLeadId` | `audit_logs.campaign_lead_removed` |

BFF web `PATCH /api/commercial-reactivation-campaigns/:id` já existia e passou a ser usado pela UI.

**Não criado:** disparo automático de WhatsApp ou e-mail. O follow-up é apenas `LeadFollowUp` `PENDING` na Agenda Comercial.

---

## 3. Migrations

**Necessária:** `20260921120000_campaign_followups`

```sql
ALTER TABLE "lead_follow_ups" ADD COLUMN "campaign_id" TEXT;
CREATE INDEX "lead_follow_ups_tenantId_campaign_id_idx" ...
CREATE UNIQUE INDEX "lead_follow_ups_campaign_id_lead_id_key"
  ON "lead_follow_ups"("campaign_id", "leadId");
ALTER TABLE ... FOREIGN KEY ("campaign_id")
  REFERENCES "reactivation_campaigns"("id") ON DELETE SET NULL;
```

Aplicada no workspace local (`prisma migrate deploy`). Ambiente de publicação precisa rodar a mesma migration **antes** do start que gera follow-ups.

---

## 4. Evidência dos testes

### Backend (`npx jest` em `apps/api`)

```
Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
```

Arquivos:

- `commercial-reactivation-campaigns.service.spec.ts`
- `lead-follow-ups.service.spec.ts`
- `activity-event-kinds.spec.ts`

Cenários verdes:

- create campaign + `campaign_created` (activity + audit)
- update campaign DRAFT + `campaign_updated`
- bloqueio de edição em `IN_PROGRESS` / `FINISHED`
- add leads + `campaign_lead_added`
- start sem leads → 400
- start com 3 leads → 3 follow-ups + 3 `campaign_followup_created`
- reexecução do start → nenhum follow-up extra / sem novo `campaign_started`
- finish + `campaign_finished`

### Frontend (`npx tsx --test`)

```
# tests 14
# pass 14
# fail 0
```

- `reactivation-campaigns.spec.ts` — edição DRAFT, payload PATCH, intervalo 30s, alias PT + deep link
- `navigation.spec.ts` — menu continua em `/crm/campaigns/reactivation` (página não duplicada)

---

## 5. Fluxo completo

```
Criar campanha (DRAFT)
  → activity + audit campaign_created
Adicionar leads
  → CampaignLead + audit campaign_lead_added
Executar campanha (POST .../start)
  → status IN_PROGRESS
  → 1 LeadFollowUp por lead (WHATSAPP / PENDING / agora+1d)
  → responsável = owner da campanha
  → nota: "Follow-up gerado automaticamente pela campanha de reativação."
  → activity campaign_followup_created (por lead)
  → audit campaign_started + campaign_followup_created
Reativar lead
  → funil ativo + lead_reactivated_campaign (já 4.4)
Atualizar KPIs
  → lista e detalhe refetch a cada 30s (sem reload)
Encerrar campanha
  → FINISHED + campaign_finished
```

Regras de UI:

- Metadados (nome, descrição, responsável) editáveis só em DRAFT via PATCH.
- `IN_PROGRESS` / `FINISHED` somente leitura.
- Após salvar, a grid invalida o query cache e reflete na hora.
- `/crm/campanhas-reativacao` e `/crm/campanhas-reativacao/:id` redirecionam para a rota canônica.

---

## 6. Plano de testes de homologação

1. Criar campanha com 3 leads perdidos e executar.
2. Conferir 3 `lead_follow_ups` (`WHATSAPP`, `PENDING`, `campaign_id` preenchido, `assigned_user_id` = owner).
3. Executar `start` de novo — continuar com 3 follow-ups.
4. Timeline: `campaign_followup_created` por lead.
5. `audit_logs`: `campaign_created`, `campaign_started`, `campaign_followup_created`.
6. Editar nome em DRAFT na lista — grid atualiza sem reload.
7. Iniciar campanha e tentar editar — formulário ausente / API 400.
8. Deixar lista e detalhe abertos 30s+ — KPIs (total, contatados, reativados, taxa) atualizam sozinhos.
9. Abrir `/crm/campanhas-reativacao` e `/crm/campanhas-reativacao/:id` — redirect 307/308 para a rota EN.
10. Reativar um lead, conferir KPI de reativados no próximo tick de 30s, encerrar campanha.

---

## 7. GO / NO GO

**GO para publicação da Wave 3**, condicionado a:

1. Aplicar a migration `20260921120000_campaign_followups` no ambiente-alvo.
2. Rodar o roteiro de homologação acima no ambiente (este workspace **não** fez deploy).

Pendências da homologação 4.4 (follow-ups no start, edição DRAFT, auto-refresh, alias PT, `audit_logs`) foram implementadas no contrato existente, sem automações de disparo e sem quebrar a Sprint 4.4.

**Fora do GO (aceitáveis):**

- Campo de responsável na UI é o `ownerUserId` (mesmo padrão dos filtros de lead). `GET /users` continua exigindo `users:manage`.
- Auto-refresh usa `refetchInterval` do TanStack Query (30s), o mesmo intervalo de `staleTime` da Agenda — sem reload de página.

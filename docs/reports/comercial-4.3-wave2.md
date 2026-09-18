# Comercial 4.3 — Wave 2 Fila de Reativação

**Data:** 2026-09-16  
**Branch:** `feature/sprint-comercial-4.3`  
**Worktree:** `InsureFlow-wt-sprint40`  
**Base:** `446a472` (Wave 1 em produção)  
**Status:** implementação local — **sem push / merge / deploy**

---

## 1. Arquitetura

Operação humana sobre a fundação Wave 1 (`lost` + `nextReactivationAt` + motivo).

```
Agenda KPI (Reativações hoje/atrasadas)
        │
        ▼ deep-link
/crm/reativacoes  ← fila operacional (padrão visual Agenda)
        │
        ├── GET  /api/v1/commercial-reactivations
        ├── POST /api/v1/commercial-reactivations/:leadId/reactivate
        └── POST /api/v1/commercial-reactivations/:leadId/postpone
                │
                ├── Prisma Lead (status / nextReactivationAt)
                ├── Activity Engine (lead_reactivated | lead_reactivation_postponed)
                ├── LeadFollowUp (próximo contato pós-reativar)
                └── BU ACL (BusinessUnitAccessService.leadWhere)
```

**Não inclui:** SaaS, Rules Engine, Scheduler novo, automações complexas, Portal, Imobiliária, WhatsApp, Dashboard Executivo.

**Auditoria:** Activity + metadata (sem migration / sem `LeadReactivationEvent`).

| Ação | Efeito |
|------|--------|
| **Reativar** | `lost` → `contacted` (default); `nextReactivationAt=null`; `lastReactivatedAt=now`; follow-up +1d; activity `lead_reactivated` |
| **Adiar** | `nextReactivationAt = now+7/15/30` ou data custom; activity `lead_reactivation_postponed` (motivo obrigatório) |
| **Abrir Lead** | `/leads?lead=` |

---

## 2. Arquivos alterados / criados

### API

| Arquivo | Papel |
|---------|-------|
| `apps/api/src/modules/commercial-reactivations/*` | Módulo fila (controller/service/dto/spec) |
| `apps/api/src/app.module.ts` | Registra módulo |
| `apps/api/src/common/utils/lead-reactivation.util.ts` | `buildManualReactivatePatch`, `buildPostponeReactivationAt`, `daysOverdue` |
| `apps/api/src/common/utils/lead-reactivation.util.spec.ts` | Testes util Wave 2 |
| `apps/api/src/common/utils/activity-event-kinds.util.ts` | Kind `lead_reactivation_postponed` |
| `apps/api/src/common/utils/activity-event-kinds.spec.ts` | Cobertura do kind |

### Web

| Arquivo | Papel |
|---------|-------|
| `apps/web/app/(dashboard)/crm/reativacoes/page.tsx` | Rota `/crm/reativacoes` |
| `apps/web/components/crm/commercial-reactivations-workspace.tsx` | UI fila + filtros + ações |
| `apps/web/app/api/commercial-reactivations/**` | BFF proxy |
| `apps/web/lib/data-access/modules/commercial-reactivations/api.ts` | Client |
| `apps/web/lib/data-access/query-keys.ts` | Query keys |
| `apps/web/lib/navigation.ts` | Menu CRM → Reativações |
| `apps/web/lib/navigation.spec.ts` | Expectativas de menu |
| `apps/web/components/crm/commercial-agenda-workspace.tsx` | KPI → Abrir Reativações; `?lead=` |
| `apps/web/lib/crm/activity-event-kinds.ts` | Kind espelhado |

### Docs

| Arquivo | Papel |
|---------|-------|
| `docs/reports/comercial-4.3-wave2.md` | Este relatório |

---

## 3. Testes executados

| Suite | Resultado |
|-------|-----------|
| `lead-reactivation.util` | ✅ 11 passed |
| `commercial-reactivations.service` | ✅ 5 passed (list/ACL, reactivate, postpone, validation, 404) |
| `activity-event-kinds` | ✅ 3 passed |
| `navigation.spec` (tsx) | ✅ 9 passed |

Cobertura Wave 2: reativação, adiamento, auditoria kinds, ACL (BU where mock), filtros window na service.

---

## 4. Builds

| Build | Resultado |
|-------|-----------|
| `npx nest build` (api) | ✅ exit 0 |
| `npx next build` (web) | ✅ exit 0 · rota `/crm/reativacoes` gerada |

---

## 5. Smoke (local / checklist pós-deploy futuro)

Não executado em produção (autorização: sem deploy).

Checklist sugerido:

1. Login → menu CRM → **Reativações**
2. Filtros Hoje / Atrasadas / Próx. 7 dias / Responsável / Motivo / Origem
3. Adiar sem motivo → bloqueio UI; com motivo → data atualiza + timeline
4. Reativar → some da fila; status `contacted`; activity `lead_reactivated`; follow-up criado
5. Agenda KPI **Reativações hoje** → `/crm/reativacoes?window=today`
6. Trocar BU → fila respeita ACL

---

## 6. Riscos

| Risco | Mitigação |
|-------|-----------|
| Automações de canal também usam `lead_reactivated` | Metadata `action: manual_reopen` distingue reopen humano |
| Fila vazia se Wave 1 motivos sem `reactivationDays`/leads lost sem `nextReactivationAt` | Depende do catálogo Wave 1 já publicado |
| Owner filter limitado aos owners da página atual | Suficiente Wave 2; backlog: lista completa de usuários |
| Sem migration de Event store | Activity cobre auditoria pedida; Event dedicado fica no backlog |

---

## 7. Backlog restante (fora desta Wave)

- Dashboard comercial de reativação (taxa / funil)
- Presets de adiamento configuráveis por tenant
- `LeadReactivationEvent` persistido (além de Activity)
- Ações Reativar/Adiar embutidas na Agenda (hoje deep-link)
- Wave 2+ fila “esgotados” (maxAttempts)
- Deploy / merge em `release/crm-operacao-avila`

---

## 8. Entrega

1. **Arquivos:** módulo `commercial-reactivations` + UI `/crm/reativacoes` + nav/Agenda (lista §2)  
2. **Testes:** 11 + 5 + 3 API + 9 navigation — todos verdes  
3. **Build:** nest ✅ · next ✅  
4. **Relatório:** este arquivo  
5. **Evidências:** suites Jest/tsx exit 0; builds exit 0  

**Sem push. Sem merge. Sem deploy. Wave 2 pronta para revisão.**

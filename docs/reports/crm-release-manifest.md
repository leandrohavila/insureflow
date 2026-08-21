# CRM-RELEASE-001 — Manifesto do working tree

**Data:** 21 de agosto de 2026  
**Branch atual:** `feature/rbac-ownership-foundations` (`0c8385ba`)  
**Working tree:** 157 modificados + 722 untracked = **879 paths** (nada foi apagado nesta preparação)  
**Método:** classificação por path. Nenhum `git add`, commit, push, reset ou clean foi executado.

---

## Como ler este manifesto

| Destino | Significado |
|---------|-------------|
| **INCLUIR no release** | Entra no commit da branch `release/crm-operacao-avila` |
| **NÃO incluir** | Permanece no disco; não entra no `git add` |
| **Opcional / fora do pacote HML** | Docs de sprint antiga, ADRs, UI kit — não bloqueiam HML |

CRM-003 até CRM-006.4 **não estão isolados em commits**. O working tree é um lote único. O release HML precisa do lote (schema + migrations 202607/202608 + API/web), não só dos arquivos com “006.4” no nome.

---

## Totais

| Categoria | Paths |
|-----------|------:|
| Working tree total | 879 |
| **INCLUIR no release** | **695** (inclui `README.md`) |
| NÃO incluir (logs, artifacts, screenshots, dist) | 131 |
| Opcional (docs históricas, ADRs, UI) | 57 |
| Deleções tracked a preservar no commit | 8 |

---

## 1. Arquivos CRM-003 → CRM-006.4 (incluir)

O pacote operacional da Ávila depende de:

| Epic | Conteúdo no working tree |
|------|--------------------------|
| CRM-003 / forms | `packages/forms-engine`, `packages/forms-library`, questionários, cotações, propostas |
| CRM-004 | Evolution / `communications` |
| RBAC + BU | access, business-units, ownership, lead-shares |
| CRM-006 | pipeline, SLA, metas/comissões, 360, reativação, cross-sell |
| **CRM-006.4** | importador, agenda, carteira de renovação, templates XLSX |
| HOTFIX-001 | ajustes em leads/deals/customers já misturados nos mesmos arquivos |

Deleções tracked que **devem ir no commit** (código morto substituído):

- `apps/web/components/crm/crm-page.tsx`
- `apps/web/components/crm/deal-detail-sheet.tsx`
- `apps/web/components/dashboard/performance-chart.tsx`
- `apps/web/components/dashboard/recent-leads-table.tsx`
- `apps/web/components/dashboard/stats-cards.tsx`
- `apps/web/lib/crm/crm-deal-timeline-preview.ts`
- `apps/web/lib/dashboard-mock.ts`
- `scripts/railway-hml-bootstrap.cjs` (bootstrap HML antigo; HML será recriado — ver checklist)

---

## 2. Temporários (não incluir)

Nenhum destes deve ser commitado. **Não foram apagados.**

- `apps/api/tsc.log`
- `packages/forms-engine/tsconfig.build.tsbuildinfo`
- `packages/forms-library/tsconfig.build.tsbuildinfo`

---

## 3. Logs (não incluir)

- `apps/api/tsc.log`
- `railway-diagnose-out.txt`

---

## 4. Artifacts (não incluir)

- `packages/forms-engine/dist-test/**` (build de teste)
- `docs/sprint-5.*-screenshots/**`
- `docs/sprint-notes/sprint-4.6-screenshots/**`
- `docs/reports/avila-production-readiness.evidence.json`

---

## 5. Arquivos de teste (incluir)

Specs e e2e do CRM **entram** no release (não são logs). Exemplos:

- `apps/api/src/**/*.spec.ts`
- `apps/api/test/*.e2e-spec.ts`
- `apps/api/scripts/homolog-crm-006-4.cjs`
- `apps/api/scripts/audit-crm-006-4-production.cjs` (uso em HML/local; **nunca** apontar para produção)

---

## 6. Arquivos que NÃO devem entrar no release

| Path | Motivo |
|------|--------|
| `apps/api/tsc.log` | log local |
| `railway-diagnose-out.txt` | diagnóstico pontual |
| `vercel.json` (raiz) | `experimentalServices`; produção/HML web usa `apps/web/vercel.json` |
| `docs/sprint-*-screenshots/**` | PNGs de sprints antigas |
| `packages/forms-engine/dist-test/**` | artifact de compilação |
| `*.tsbuildinfo` | cache TypeScript |
| `.evidence.json` | dump de auditoria local |
| `docs/infra/prod-clean-*` | tooling de limpeza de **produção** — não misturar no pacote HML |
| `scripts/dns-propagation-watch.cjs` | go-live prod |
| ADRs / docs/ui / audits sprint 6–7 | opcional; não bloqueiam homologação |

**Nunca commitar:** `.env`, `.env.local`, `.env.development`, `.env.production` (já gitignored). Só `.env.example` e `apps/api/.env.example`.

---

## Lista completa — INCLUIR (695 paths)


### `.env.example` (1)

- `.env.example`

### `README.md` (1)

- `README.md`

### `apps/api` (13)

- `apps/api/.env.example`
- `apps/api/package.json`
- `apps/api/scripts/audit-crm-006-4-production.cjs`
- `apps/api/scripts/ensure-prisma-client.cjs`
- `apps/api/scripts/homolog-crm-006-4.cjs`
- `apps/api/test/business-unit-detail-acl.e2e-spec.ts`
- `apps/api/test/business-units.e2e-spec.ts`
- `apps/api/test/communications.e2e-spec.ts`
- `apps/api/test/customer-360.e2e-spec.ts`
- `apps/api/test/lead-loss-reasons.e2e-spec.ts`
- `apps/api/test/leads-create.e2e-spec.ts`
- `apps/api/test/sales-performance.e2e-spec.ts`
- `apps/api/test/sales-pipeline.e2e-spec.ts`

### `apps/api/src/app.module.ts` (1)

- `apps/api/src/app.module.ts`

### `apps/api/src/common` (34)

- `apps/api/src/common/constants/interest-categories.ts`
- `apps/api/src/common/dto/optional-value.util.ts`
- `apps/api/src/common/interfaces/jwt-payload.interface.ts`
- `apps/api/src/common/utils/activity-event-kinds.spec.ts`
- `apps/api/src/common/utils/activity-event-kinds.util.ts`
- `apps/api/src/common/utils/business-unit-acl.util.spec.ts`
- `apps/api/src/common/utils/business-unit-acl.util.ts`
- `apps/api/src/common/utils/business-unit-membership.util.ts`
- `apps/api/src/common/utils/commercial-recovery.util.spec.ts`
- `apps/api/src/common/utils/commercial-recovery.util.ts`
- `apps/api/src/common/utils/crm-stage-labels.util.ts`
- `apps/api/src/common/utils/cross-sell-rules.util.spec.ts`
- `apps/api/src/common/utils/cross-sell-rules.util.ts`
- `apps/api/src/common/utils/customer-lifecycle.util.ts`
- `apps/api/src/common/utils/deal-pipeline.util.spec.ts`
- `apps/api/src/common/utils/deal-pipeline.util.ts`
- `apps/api/src/common/utils/deal-score.util.spec.ts`
- `apps/api/src/common/utils/deal-score.util.ts`
- `apps/api/src/common/utils/lead-reactivation.util.spec.ts`
- `apps/api/src/common/utils/lead-reactivation.util.ts`
- `apps/api/src/common/utils/message-template-render.util.spec.ts`
- `apps/api/src/common/utils/message-template-render.util.ts`
- `apps/api/src/common/utils/opportunity-engine.util.spec.ts`
- `apps/api/src/common/utils/opportunity-engine.util.ts`
- `apps/api/src/common/utils/owner-assignment.util.spec.ts`
- `apps/api/src/common/utils/owner-assignment.util.ts`
- `apps/api/src/common/utils/runtime-info.util.ts`
- `apps/api/src/common/utils/sales-commission.util.spec.ts`
- `apps/api/src/common/utils/sales-commission.util.ts`
- `apps/api/src/common/utils/sales-sla.util.spec.ts`
- `apps/api/src/common/utils/sales-sla.util.ts`
- `apps/api/src/common/utils/slugify.util.ts`
- `apps/api/src/common/utils/timeline-aggregator.util.spec.ts`
- `apps/api/src/common/utils/timeline-aggregator.util.ts`

### `apps/api/src/infrastructure` (2)

- `apps/api/src/infrastructure/prisma/prisma.service.ts`
- `apps/api/src/infrastructure/redis/redis-bootstrap.service.ts`

### `apps/api/src/main.ts` (1)

- `apps/api/src/main.ts`

### `apps/api/src/modules/access` (8)

- `apps/api/src/modules/access/access.module.ts`
- `apps/api/src/modules/access/business-unit-access.service.spec.ts`
- `apps/api/src/modules/access/business-unit-access.service.ts`
- `apps/api/src/modules/access/data-scope.util.ts`
- `apps/api/src/modules/access/ownership-scope.spec.ts`
- `apps/api/src/modules/access/ownership.service.ts`
- `apps/api/src/modules/access/ownership.types.ts`
- `apps/api/src/modules/access/tenant-settings.util.ts`

### `apps/api/src/modules/activities` (10)

- `apps/api/src/modules/activities/activities.controller.ts`
- `apps/api/src/modules/activities/activities.module.ts`
- `apps/api/src/modules/activities/activities.service.ts`
- `apps/api/src/modules/activities/activity-engine.service.ts`
- `apps/api/src/modules/activities/activity-engine.types.ts`
- `apps/api/src/modules/activities/activity-event-metadata.util.spec.ts`
- `apps/api/src/modules/activities/activity-event-metadata.util.ts`
- `apps/api/src/modules/activities/activity-event-publisher.interface.ts`
- `apps/api/src/modules/activities/activity-write.util.spec.ts`
- `apps/api/src/modules/activities/activity-write.util.ts`

### `apps/api/src/modules/auth` (1)

- `apps/api/src/modules/auth/auth.service.ts`

### `apps/api/src/modules/business-units` (5)

- `apps/api/src/modules/business-units/business-units.controller.ts`
- `apps/api/src/modules/business-units/business-units.module.ts`
- `apps/api/src/modules/business-units/business-units.service.spec.ts`
- `apps/api/src/modules/business-units/business-units.service.ts`
- `apps/api/src/modules/business-units/dto/business-unit.dto.ts`

### `apps/api/src/modules/commercial-agenda` (4)

- `apps/api/src/modules/commercial-agenda/commercial-agenda.controller.ts`
- `apps/api/src/modules/commercial-agenda/commercial-agenda.dto.ts`
- `apps/api/src/modules/commercial-agenda/commercial-agenda.module.ts`
- `apps/api/src/modules/commercial-agenda/commercial-agenda.service.ts`

### `apps/api/src/modules/commercial-automation` (10)

- `apps/api/src/modules/commercial-automation/commercial-automation.constants.ts`
- `apps/api/src/modules/commercial-automation/commercial-automation.controller.ts`
- `apps/api/src/modules/commercial-automation/commercial-automation.module.ts`
- `apps/api/src/modules/commercial-automation/commercial-automation.processor.ts`
- `apps/api/src/modules/commercial-automation/commercial-automation.scheduler.ts`
- `apps/api/src/modules/commercial-automation/commercial-automation.service.spec.ts`
- `apps/api/src/modules/commercial-automation/commercial-automation.service.ts`
- `apps/api/src/modules/commercial-automation/dto/commercial-dashboard.dto.ts`
- `apps/api/src/modules/commercial-automation/sales-sla-engine.service.spec.ts`
- `apps/api/src/modules/commercial-automation/sales-sla-engine.service.ts`

### `apps/api/src/modules/commercial-import` (7)

- `apps/api/src/modules/commercial-import/commercial-import.columns.ts`
- `apps/api/src/modules/commercial-import/commercial-import.controller.ts`
- `apps/api/src/modules/commercial-import/commercial-import.mapping.spec.ts`
- `apps/api/src/modules/commercial-import/commercial-import.mapping.ts`
- `apps/api/src/modules/commercial-import/commercial-import.module.ts`
- `apps/api/src/modules/commercial-import/commercial-import.service.ts`
- `apps/api/src/modules/commercial-import/commercial-import.xlsx.ts`

### `apps/api/src/modules/communications` (16)

- `apps/api/src/modules/communications/communications.controller.ts`
- `apps/api/src/modules/communications/communications.module.ts`
- `apps/api/src/modules/communications/communications.service.spec.ts`
- `apps/api/src/modules/communications/communications.service.ts`
- `apps/api/src/modules/communications/dto/communication.dto.ts`
- `apps/api/src/modules/communications/providers/communication-provider.registry.ts`
- `apps/api/src/modules/communications/providers/communication-provider.spec.ts`
- `apps/api/src/modules/communications/providers/communication-provider.ts`
- `apps/api/src/modules/communications/providers/evolution-http.client.ts`
- `apps/api/src/modules/communications/providers/evolution-settings.util.ts`
- `apps/api/src/modules/communications/providers/evolution-webhook.util.spec.ts`
- `apps/api/src/modules/communications/providers/evolution-webhook.util.ts`
- `apps/api/src/modules/communications/providers/evolution.provider.spec.ts`
- `apps/api/src/modules/communications/providers/evolution.provider.ts`
- `apps/api/src/modules/communications/providers/internal.provider.ts`
- `apps/api/src/modules/communications/providers/unconfigured.provider.ts`

### `apps/api/src/modules/crm` (12)

- `apps/api/src/modules/crm/crm-insights.controller.ts`
- `apps/api/src/modules/crm/crm.controller.ts`
- `apps/api/src/modules/crm/crm.module.ts`
- `apps/api/src/modules/crm/crm.service.ts`
- `apps/api/src/modules/crm/dto/deal.dto.spec.ts`
- `apps/api/src/modules/crm/dto/deal.dto.ts`
- `apps/api/src/modules/crm/executive-dashboard.service.spec.ts`
- `apps/api/src/modules/crm/executive-dashboard.service.ts`
- `apps/api/src/modules/crm/pipelines.service.spec.ts`
- `apps/api/src/modules/crm/pipelines.service.ts`
- `apps/api/src/modules/crm/sla-dashboard.service.spec.ts`
- `apps/api/src/modules/crm/sla-dashboard.service.ts`

### `apps/api/src/modules/cross-sell` (5)

- `apps/api/src/modules/cross-sell/cross-sell.controller.ts`
- `apps/api/src/modules/cross-sell/cross-sell.module.ts`
- `apps/api/src/modules/cross-sell/cross-sell.service.spec.ts`
- `apps/api/src/modules/cross-sell/cross-sell.service.ts`
- `apps/api/src/modules/cross-sell/dto/cross-sell.dto.ts`

### `apps/api/src/modules/customers` (10)

- `apps/api/src/modules/customers/customer-360.service.spec.ts`
- `apps/api/src/modules/customers/customer-360.service.ts`
- `apps/api/src/modules/customers/customer-activation.service.ts`
- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.module.ts`
- `apps/api/src/modules/customers/customers.service.spec.ts`
- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/customers/dashboard-360.service.spec.ts`
- `apps/api/src/modules/customers/dashboard-360.service.ts`
- `apps/api/src/modules/customers/dto/customer.dto.ts`

### `apps/api/src/modules/health` (1)

- `apps/api/src/modules/health/health.controller.ts`

### `apps/api/src/modules/lead-follow-ups` (5)

- `apps/api/src/modules/lead-follow-ups/dto/lead-follow-up.dto.ts`
- `apps/api/src/modules/lead-follow-ups/lead-follow-ups.controller.ts`
- `apps/api/src/modules/lead-follow-ups/lead-follow-ups.module.ts`
- `apps/api/src/modules/lead-follow-ups/lead-follow-ups.service.spec.ts`
- `apps/api/src/modules/lead-follow-ups/lead-follow-ups.service.ts`

### `apps/api/src/modules/lead-loss-reasons` (5)

- `apps/api/src/modules/lead-loss-reasons/dto/lead-loss-reason.dto.ts`
- `apps/api/src/modules/lead-loss-reasons/lead-loss-reasons.controller.ts`
- `apps/api/src/modules/lead-loss-reasons/lead-loss-reasons.module.ts`
- `apps/api/src/modules/lead-loss-reasons/lead-loss-reasons.service.spec.ts`
- `apps/api/src/modules/lead-loss-reasons/lead-loss-reasons.service.ts`

### `apps/api/src/modules/lead-reactivation` (8)

- `apps/api/src/modules/lead-reactivation/dto/lead-reactivation-settings.dto.ts`
- `apps/api/src/modules/lead-reactivation/lead-reactivation.constants.ts`
- `apps/api/src/modules/lead-reactivation/lead-reactivation.controller.ts`
- `apps/api/src/modules/lead-reactivation/lead-reactivation.module.ts`
- `apps/api/src/modules/lead-reactivation/lead-reactivation.processor.ts`
- `apps/api/src/modules/lead-reactivation/lead-reactivation.scheduler.ts`
- `apps/api/src/modules/lead-reactivation/lead-reactivation.service.spec.ts`
- `apps/api/src/modules/lead-reactivation/lead-reactivation.service.ts`

### `apps/api/src/modules/leads` (11)

- `apps/api/src/modules/leads/dto/lead-share.dto.ts`
- `apps/api/src/modules/leads/dto/lead.dto.spec.ts`
- `apps/api/src/modules/leads/dto/lead.dto.ts`
- `apps/api/src/modules/leads/lead-last-interaction.util.ts`
- `apps/api/src/modules/leads/lead-shares.service.spec.ts`
- `apps/api/src/modules/leads/lead-shares.service.ts`
- `apps/api/src/modules/leads/leads-permissions.spec.ts`
- `apps/api/src/modules/leads/leads.controller.ts`
- `apps/api/src/modules/leads/leads.module.ts`
- `apps/api/src/modules/leads/leads.service.spec.ts`
- `apps/api/src/modules/leads/leads.service.ts`

### `apps/api/src/modules/message-templates` (5)

- `apps/api/src/modules/message-templates/dto/message-template.dto.ts`
- `apps/api/src/modules/message-templates/message-templates.controller.ts`
- `apps/api/src/modules/message-templates/message-templates.module.ts`
- `apps/api/src/modules/message-templates/message-templates.service.spec.ts`
- `apps/api/src/modules/message-templates/message-templates.service.ts`

### `apps/api/src/modules/opportunities` (5)

- `apps/api/src/modules/opportunities/dto/opportunity.dto.ts`
- `apps/api/src/modules/opportunities/opportunities.controller.ts`
- `apps/api/src/modules/opportunities/opportunities.module.ts`
- `apps/api/src/modules/opportunities/opportunities.service.spec.ts`
- `apps/api/src/modules/opportunities/opportunities.service.ts`

### `apps/api/src/modules/policies` (2)

- `apps/api/src/modules/policies/policies.module.ts`
- `apps/api/src/modules/policies/policies.service.ts`

### `apps/api/src/modules/policy-renewals` (5)

- `apps/api/src/modules/policy-renewals/dto/policy-renewal.dto.ts`
- `apps/api/src/modules/policy-renewals/policy-renewals.controller.ts`
- `apps/api/src/modules/policy-renewals/policy-renewals.module.ts`
- `apps/api/src/modules/policy-renewals/policy-renewals.service.spec.ts`
- `apps/api/src/modules/policy-renewals/policy-renewals.service.ts`

### `apps/api/src/modules/questionnaires` (7)

- `apps/api/src/modules/questionnaires/dto/questionnaire-submissions-query.dto.spec.ts`
- `apps/api/src/modules/questionnaires/dto/questionnaire.dto.ts`
- `apps/api/src/modules/questionnaires/questionnaire-answer-audit.util.spec.ts`
- `apps/api/src/modules/questionnaires/questionnaire-answer-audit.util.ts`
- `apps/api/src/modules/questionnaires/questionnaires.controller.ts`
- `apps/api/src/modules/questionnaires/questionnaires.module.ts`
- `apps/api/src/modules/questionnaires/questionnaires.service.ts`

### `apps/api/src/modules/quotes` (9)

- `apps/api/src/modules/quotes/dto/quote.dto.spec.ts`
- `apps/api/src/modules/quotes/dto/quote.dto.ts`
- `apps/api/src/modules/quotes/proposal-pdf.service.ts`
- `apps/api/src/modules/quotes/quote-serialize.util.ts`
- `apps/api/src/modules/quotes/quotes-metrics.util.spec.ts`
- `apps/api/src/modules/quotes/quotes-metrics.util.ts`
- `apps/api/src/modules/quotes/quotes.controller.ts`
- `apps/api/src/modules/quotes/quotes.module.ts`
- `apps/api/src/modules/quotes/quotes.service.ts`

### `apps/api/src/modules/sales-performance` (9)

- `apps/api/src/modules/sales-performance/commission-rules.service.ts`
- `apps/api/src/modules/sales-performance/commissions.service.spec.ts`
- `apps/api/src/modules/sales-performance/commissions.service.ts`
- `apps/api/src/modules/sales-performance/dto/sales-performance.dto.ts`
- `apps/api/src/modules/sales-performance/performance.service.spec.ts`
- `apps/api/src/modules/sales-performance/performance.service.ts`
- `apps/api/src/modules/sales-performance/sales-performance.controller.ts`
- `apps/api/src/modules/sales-performance/sales-performance.module.ts`
- `apps/api/src/modules/sales-performance/sales-targets.service.ts`

### `apps/web` (2)

- `apps/web/next.config.js`
- `apps/web/package.json`

### `apps/web/app` (115)

- `apps/web/app/(auth)/layout.tsx`
- `apps/web/app/(dashboard)/automacao/comunicacao/page.tsx`
- `apps/web/app/(dashboard)/automacao/cross-sell/page.tsx`
- `apps/web/app/(dashboard)/automacao/page.tsx`
- `apps/web/app/(dashboard)/automacao/reativacao/page.tsx`
- `apps/web/app/(dashboard)/automacao/templates/page.tsx`
- `apps/web/app/(dashboard)/configuracoes/comunicacao/page.tsx`
- `apps/web/app/(dashboard)/configuracoes/crm/motivos-perda/page.tsx`
- `apps/web/app/(dashboard)/configuracoes/page.tsx`
- `apps/web/app/(dashboard)/configuracoes/unidades/page.tsx`
- `apps/web/app/(dashboard)/cotacoes/page.tsx`
- `apps/web/app/(dashboard)/crm/agenda/page.tsx`
- `apps/web/app/(dashboard)/crm/customer-360/[id]/page.tsx`
- `apps/web/app/(dashboard)/crm/dashboard-360/page.tsx`
- `apps/web/app/(dashboard)/crm/dashboard-comercial/page.tsx`
- `apps/web/app/(dashboard)/crm/dashboard-executivo/page.tsx`
- `apps/web/app/(dashboard)/crm/dashboard-sla/page.tsx`
- `apps/web/app/(dashboard)/crm/follow-ups/page.tsx`
- `apps/web/app/(dashboard)/crm/importacoes/clientes/page.tsx`
- `apps/web/app/(dashboard)/crm/importacoes/leads/page.tsx`
- `apps/web/app/(dashboard)/crm/importacoes/page.tsx`
- `apps/web/app/(dashboard)/crm/performance/page.tsx`
- `apps/web/app/(dashboard)/crm/renovacoes-carteira/page.tsx`
- `apps/web/app/(dashboard)/crm/renovacoes/page.tsx`
- `apps/web/app/(dashboard)/propostas/page.tsx`
- `apps/web/app/(dashboard)/ui-kit/page.tsx`
- `apps/web/app/api/auth/login/route.ts`
- `apps/web/app/api/auth/me/route.ts`
- `apps/web/app/api/automation/commercial/run/route.ts`
- `apps/web/app/api/automation/reactivation/metrics/route.ts`
- `apps/web/app/api/automation/reactivation/run/route.ts`
- `apps/web/app/api/automation/reactivation/settings/route.ts`
- `apps/web/app/api/business-units/[id]/route.ts`
- `apps/web/app/api/business-units/context/route.ts`
- `apps/web/app/api/business-units/route.ts`
- `apps/web/app/api/commercial-agenda/route.ts`
- `apps/web/app/api/commercial-import/clientes/commit/route.ts`
- `apps/web/app/api/commercial-import/clientes/preview/route.ts`
- `apps/web/app/api/commercial-import/clientes/template/route.ts`
- `apps/web/app/api/commercial-import/leads/commit/route.ts`
- `apps/web/app/api/commercial-import/leads/preview/route.ts`
- `apps/web/app/api/commercial-import/leads/template/route.ts`
- `apps/web/app/api/commercial/dashboard/route.ts`
- `apps/web/app/api/commission-rules/[id]/route.ts`
- `apps/web/app/api/commission-rules/route.ts`
- `apps/web/app/api/commissions/[id]/route.ts`
- `apps/web/app/api/commissions/route.ts`
- `apps/web/app/api/communications/[id]/reply/route.ts`
- `apps/web/app/api/communications/[id]/route.ts`
- `apps/web/app/api/communications/dashboard/route.ts`
- `apps/web/app/api/communications/evolution/connect/route.ts`
- `apps/web/app/api/communications/evolution/disconnect/route.ts`
- `apps/web/app/api/communications/evolution/health/route.ts`
- `apps/web/app/api/communications/evolution/qrcode/route.ts`
- `apps/web/app/api/communications/evolution/reconnect/route.ts`
- `apps/web/app/api/communications/inbound/route.ts`
- `apps/web/app/api/communications/provider/route.ts`
- `apps/web/app/api/communications/route.ts`
- `apps/web/app/api/communications/send/route.ts`
- `apps/web/app/api/crm/dashboard-executivo/route.ts`
- `apps/web/app/api/crm/dashboard-sla/route.ts`
- `apps/web/app/api/crm/deals/[id]/route.ts`
- `apps/web/app/api/crm/pipelines/route.ts`
- `apps/web/app/api/cross-sell/generate/route.ts`
- `apps/web/app/api/cross-sell/metrics/route.ts`
- `apps/web/app/api/cross-sell/opportunities/[id]/route.ts`
- `apps/web/app/api/cross-sell/opportunities/route.ts`
- `apps/web/app/api/customers/[id]/360/generate/route.ts`
- `apps/web/app/api/customers/[id]/360/route.ts`
- `apps/web/app/api/customers/dashboard-360/route.ts`
- `apps/web/app/api/lead-follow-ups/[id]/route.ts`
- `apps/web/app/api/lead-follow-ups/route.ts`
- `apps/web/app/api/lead-loss-reasons/[id]/route.ts`
- `apps/web/app/api/lead-loss-reasons/route.ts`
- `apps/web/app/api/leads/[id]/business-units/[businessUnitId]/route.ts`
- `apps/web/app/api/leads/[id]/business-units/route.ts`
- `apps/web/app/api/leads/route.ts`
- `apps/web/app/api/message-templates/[id]/route.ts`
- `apps/web/app/api/message-templates/route.ts`
- `apps/web/app/api/opportunities/[id]/route.ts`
- `apps/web/app/api/opportunities/generate/[customerId]/route.ts`
- `apps/web/app/api/opportunities/generate/route.ts`
- `apps/web/app/api/opportunities/route.ts`
- `apps/web/app/api/performance/ranking/route.ts`
- `apps/web/app/api/performance/route.ts`
- `apps/web/app/api/policy-renewals/[id]/activity/route.ts`
- `apps/web/app/api/policy-renewals/[id]/deal/route.ts`
- `apps/web/app/api/policy-renewals/[id]/route.ts`
- `apps/web/app/api/policy-renewals/route.ts`
- `apps/web/app/api/questionnaires/submissions/route.ts`
- `apps/web/app/api/questionnaires/templates/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/proposals/[proposalId]/expire/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/proposals/[proposalId]/generate-pdf/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/proposals/[proposalId]/pdf/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/proposals/[proposalId]/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/proposals/[proposalId]/send/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/proposals/[proposalId]/viewed/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/proposals/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/quotes/[quoteId]/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/quotes/[quoteId]/select/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/quotes/bulk/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/quotes/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/send/route.ts`
- `apps/web/app/api/quotes/comparisons/[comparisonId]/viewed/route.ts`
- `apps/web/app/api/quotes/comparisons/route.ts`
- `apps/web/app/api/quotes/metrics/route.ts`
- `apps/web/app/api/quotes/proposals/[proposalId]/route.ts`
- `apps/web/app/api/quotes/proposals/route.ts`
- `apps/web/app/api/quotes/route.ts`
- `apps/web/app/api/sales-targets/[id]/route.ts`
- `apps/web/app/api/sales-targets/route.ts`
- `apps/web/app/crm-operational.css`
- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`

### `apps/web/components` (146)

- `apps/web/components/activities/activity-timeline.tsx`
- `apps/web/components/activities/timeline-entry.tsx`
- `apps/web/components/auth/login-form.tsx`
- `apps/web/components/auth/permissions-panel.tsx`
- `apps/web/components/auth/role-badge.tsx`
- `apps/web/components/automation/communication-dashboard-workspace.tsx`
- `apps/web/components/automation/cross-sell-workspace.tsx`
- `apps/web/components/automation/lead-reactivation-workspace.tsx`
- `apps/web/components/automation/message-templates-manager.tsx`
- `apps/web/components/crm/commercial-agenda-workspace.tsx`
- `apps/web/components/crm/commercial-dashboard-workspace.tsx`
- `apps/web/components/crm/commercial-import-hub.tsx`
- `apps/web/components/crm/commercial-import-workspace.tsx`
- `apps/web/components/crm/commercial-intelligence/commercial-checklist.tsx`
- `apps/web/components/crm/commercial-intelligence/commercial-intelligence-panel.tsx`
- `apps/web/components/crm/commercial-intelligence/commercial-journey.tsx`
- `apps/web/components/crm/commercial-intelligence/commercial-recommendations.tsx`
- `apps/web/components/crm/commercial-intelligence/commercial-score-card.tsx`
- `apps/web/components/crm/commercial-intelligence/index.ts`
- `apps/web/components/crm/crm-activity-feed.tsx`
- `apps/web/components/crm/crm-deals-list.tsx`
- `apps/web/components/crm/crm-metrics.tsx`
- `apps/web/components/crm/crm-overview.tsx`
- `apps/web/components/crm/crm-page-header-actions.tsx`
- `apps/web/components/crm/crm-page.tsx`
- `apps/web/components/crm/crm-right-sidebar.tsx`
- `apps/web/components/crm/crm-shell.tsx`
- `apps/web/components/crm/crm-upcoming-actions.tsx`
- `apps/web/components/crm/customer-360-workspace.tsx`
- `apps/web/components/crm/customer-sheet-v2.tsx`
- `apps/web/components/crm/customers-portfolio-page.tsx`
- `apps/web/components/crm/dashboard-360-workspace.tsx`
- `apps/web/components/crm/deal-card.tsx`
- `apps/web/components/crm/deal-detail-sheet.tsx`
- `apps/web/components/crm/deal-form-dialog.tsx`
- `apps/web/components/crm/deal-sheet-v2.tsx`
- `apps/web/components/crm/deals-page.tsx`
- `apps/web/components/crm/draggable-deal-card.tsx`
- `apps/web/components/crm/executive-dashboard-workspace.tsx`
- `apps/web/components/crm/follow-ups-workspace.tsx`
- `apps/web/components/crm/interaction/crm-density-toggle.tsx`
- `apps/web/components/crm/performance-dashboard-workspace.tsx`
- `apps/web/components/crm/pipeline-board.tsx`
- `apps/web/components/crm/pipeline-column.tsx`
- `apps/web/components/crm/renewal-portfolio-workspace.tsx`
- `apps/web/components/crm/renewals-workspace.tsx`
- `apps/web/components/crm/sheet-sections/deal-shared.tsx`
- `apps/web/components/crm/sheet-sections/timeline-lane.tsx`
- `apps/web/components/crm/sla-dashboard-workspace.tsx`
- `apps/web/components/customers/customer-dialog.tsx`
- `apps/web/components/customers/customers-page.tsx`
- `apps/web/components/dashboard/app-topbar.tsx`
- `apps/web/components/dashboard/business-unit-switcher.tsx`
- `apps/web/components/dashboard/dashboard-agenda-preview.tsx`
- `apps/web/components/dashboard/dashboard-commercial-funnel.tsx`
- `apps/web/components/dashboard/dashboard-compact-metric.tsx`
- `apps/web/components/dashboard/dashboard-customers.tsx`
- `apps/web/components/dashboard/dashboard-financial-production.tsx`
- `apps/web/components/dashboard/dashboard-home.tsx`
- `apps/web/components/dashboard/dashboard-insurance-indicators.tsx`
- `apps/web/components/dashboard/dashboard-kpi-tile.tsx`
- `apps/web/components/dashboard/dashboard-pipeline-hero.tsx`
- `apps/web/components/dashboard/dashboard-pipeline-metrics.ts`
- `apps/web/components/dashboard/dashboard-pipeline-stage-bar.tsx`
- `apps/web/components/dashboard/dashboard-priorities.tsx`
- `apps/web/components/dashboard/dashboard-priority-item.tsx`
- `apps/web/components/dashboard/dashboard-quotes-proposals.tsx`
- `apps/web/components/dashboard/dashboard-section.tsx`
- `apps/web/components/dashboard/dashboard-summary.tsx`
- `apps/web/components/dashboard/dashboard-trend-indicator.tsx`
- `apps/web/components/dashboard/dashboard-utils.ts`
- `apps/web/components/dashboard/performance-chart.tsx`
- `apps/web/components/dashboard/recent-leads-table.tsx`
- `apps/web/components/dashboard/section-placeholder.tsx`
- `apps/web/components/dashboard/stats-cards.tsx`
- `apps/web/components/design-system/cards.tsx`
- `apps/web/components/design-system/data-table.ts`
- `apps/web/components/design-system/forms.tsx`
- `apps/web/components/design-system/index.ts`
- `apps/web/components/design-system/layout.tsx`
- `apps/web/components/design-system/navigation.tsx`
- `apps/web/components/design-system/operational-workspace.tsx`
- `apps/web/components/design-system/states.tsx`
- `apps/web/components/leads/lead-sheet-v2.tsx`
- `apps/web/components/leads/leads-page.tsx`
- `apps/web/components/leads/sheet-sections/lead-commercial-section.tsx`
- `apps/web/components/leads/sheet-sections/lead-conversion-section.tsx`
- `apps/web/components/leads/sheet-sections/lead-data-section.tsx`
- `apps/web/components/leads/sheet-sections/lead-overview-section.tsx`
- `apps/web/components/leads/sheet-sections/lead-units-section.tsx`
- `apps/web/components/questionnaires/questionnaire-answer-field.shared.ts`
- `apps/web/components/questionnaires/questionnaire-answer-field.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/autosave-indicator.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/block-library-drawer.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/builder-canvas.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/builder-confirm-dialog.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/builder-header.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/builder-skeleton.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/builder-surfaces.ts`
- `apps/web/components/questionnaires/questionnaire-builder/builder-workspace.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/canvas-empty-state.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/canvas-structure-minimap.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/constants.ts`
- `apps/web/components/questionnaires/questionnaire-builder/field-dialog.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/field-form.ts`
- `apps/web/components/questionnaires/questionnaire-builder/field-library-drawer.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/field-library-panel.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/field-library.ts`
- `apps/web/components/questionnaires/questionnaire-builder/field-properties-panel.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/form-preview.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/forms-library-icons.ts`
- `apps/web/components/questionnaires/questionnaire-builder/preview-control.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/preview-section-nav.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/quick-add-menu.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/rule-tester-dialog.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/rules-constants.ts`
- `apps/web/components/questionnaires/questionnaire-builder/rules-editor-panel.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/template-dialog.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/template-list.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/template-wizard-dialog.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/template-wizard-onboarding.tsx`
- `apps/web/components/questionnaires/questionnaire-builder/template-wizard.config.spec.ts`
- `apps/web/components/questionnaires/questionnaire-builder/template-wizard.config.ts`
- `apps/web/components/questionnaires/questionnaire-builder/types.ts`
- `apps/web/components/questionnaires/questionnaire-builder/utils.ts`
- `apps/web/components/questionnaires/questionnaire-builder/versions-menu.tsx`
- `apps/web/components/questionnaires/questionnaire-submission-detail-sheet.tsx`
- `apps/web/components/questionnaires/questionnaire-submission-dialog.tsx`
- `apps/web/components/questionnaires/questionnaire-submissions-page.tsx`
- `apps/web/components/questionnaires/questionnaire-templates-page.tsx`
- `apps/web/components/quotes/deal-quotes-hub.tsx`
- `apps/web/components/quotes/deal-quotes-section.tsx`
- `apps/web/components/quotes/entity-proposals-section.tsx`
- `apps/web/components/quotes/entity-quotes-section.tsx`
- `apps/web/components/quotes/proposals-page.tsx`
- `apps/web/components/quotes/quote-comparison-drawer.tsx`
- `apps/web/components/quotes/quote-comparison-table.tsx`
- `apps/web/components/quotes/quote-line-drawer.tsx`
- `apps/web/components/quotes/quote-status-labels.ts`
- `apps/web/components/quotes/quotes-page.tsx`
- `apps/web/components/settings/business-units-manager.tsx`
- `apps/web/components/settings/lead-loss-reasons-manager.tsx`
- `apps/web/components/settings/settings-subnav.tsx`
- `apps/web/components/settings/whatsapp-business-settings.tsx`
- `apps/web/components/shared/data-table.tsx`
- `apps/web/components/ui/button.tsx`

### `apps/web/lib` (131)

- `apps/web/lib/api/backend.ts`
- `apps/web/lib/auth/session.ts`
- `apps/web/lib/business-units/constants.ts`
- `apps/web/lib/crm-nav.ts`
- `apps/web/lib/crm/activity-event-kinds.ts`
- `apps/web/lib/crm/business-unit-badge.ts`
- `apps/web/lib/crm/commercial-journey/commercial-journey.service.spec.ts`
- `apps/web/lib/crm/commercial-journey/commercial-journey.service.ts`
- `apps/web/lib/crm/commercial-journey/field-resolvers.ts`
- `apps/web/lib/crm/commercial-journey/index.ts`
- `apps/web/lib/crm/commercial-journey/types.ts`
- `apps/web/lib/crm/commercial-timeline.spec.ts`
- `apps/web/lib/crm/commercial-timeline.ts`
- `apps/web/lib/crm/crm-deal-timeline-preview.ts`
- `apps/web/lib/crm/crm-layout-classes.ts`
- `apps/web/lib/crm/deal-accents.ts`
- `apps/web/lib/crm/deal-pipeline.ts`
- `apps/web/lib/crm/entity-sheet-navigation.ts`
- `apps/web/lib/crm/operational-timeline.ts`
- `apps/web/lib/crm/opportunity.ts`
- `apps/web/lib/crm/relationship/hooks.ts`
- `apps/web/lib/crm/relationship/search.ts`
- `apps/web/lib/dashboard-mock.ts`
- `apps/web/lib/data-access/api-client.ts`
- `apps/web/lib/data-access/invalidation.ts`
- `apps/web/lib/data-access/modules/activities/hooks.ts`
- `apps/web/lib/data-access/modules/automation/api.ts`
- `apps/web/lib/data-access/modules/automation/hooks.ts`
- `apps/web/lib/data-access/modules/automation/index.ts`
- `apps/web/lib/data-access/modules/automation/types.ts`
- `apps/web/lib/data-access/modules/business-units/api.ts`
- `apps/web/lib/data-access/modules/business-units/hooks.ts`
- `apps/web/lib/data-access/modules/business-units/index.ts`
- `apps/web/lib/data-access/modules/business-units/types.ts`
- `apps/web/lib/data-access/modules/commercial-agenda/api.ts`
- `apps/web/lib/data-access/modules/commercial-dashboard/api.ts`
- `apps/web/lib/data-access/modules/commercial-dashboard/hooks.ts`
- `apps/web/lib/data-access/modules/commercial-dashboard/index.ts`
- `apps/web/lib/data-access/modules/commercial-dashboard/types.ts`
- `apps/web/lib/data-access/modules/commercial-import/api.ts`
- `apps/web/lib/data-access/modules/commercial-intelligence/hooks.ts`
- `apps/web/lib/data-access/modules/commercial-intelligence/index.ts`
- `apps/web/lib/data-access/modules/communications/api.ts`
- `apps/web/lib/data-access/modules/communications/hooks.ts`
- `apps/web/lib/data-access/modules/communications/index.ts`
- `apps/web/lib/data-access/modules/communications/types.ts`
- `apps/web/lib/data-access/modules/crm/api.ts`
- `apps/web/lib/data-access/modules/crm/constants.ts`
- `apps/web/lib/data-access/modules/crm/deal-contract.ts`
- `apps/web/lib/data-access/modules/crm/hooks.ts`
- `apps/web/lib/data-access/modules/crm/index.ts`
- `apps/web/lib/data-access/modules/crm/normalizers.ts`
- `apps/web/lib/data-access/modules/crm/performance-api.ts`
- `apps/web/lib/data-access/modules/crm/pipelines-api.ts`
- `apps/web/lib/data-access/modules/crm/types.ts`
- `apps/web/lib/data-access/modules/customer-360/api.ts`
- `apps/web/lib/data-access/modules/customer-360/hooks.ts`
- `apps/web/lib/data-access/modules/customer-360/index.ts`
- `apps/web/lib/data-access/modules/customer-360/types.ts`
- `apps/web/lib/data-access/modules/dashboard/hooks.ts`
- `apps/web/lib/data-access/modules/index.ts`
- `apps/web/lib/data-access/modules/lead-follow-ups/api.ts`
- `apps/web/lib/data-access/modules/lead-follow-ups/hooks.ts`
- `apps/web/lib/data-access/modules/lead-follow-ups/index.ts`
- `apps/web/lib/data-access/modules/lead-follow-ups/types.ts`
- `apps/web/lib/data-access/modules/lead-loss-reasons/api.ts`
- `apps/web/lib/data-access/modules/lead-loss-reasons/hooks.ts`
- `apps/web/lib/data-access/modules/lead-loss-reasons/index.ts`
- `apps/web/lib/data-access/modules/lead-loss-reasons/types.ts`
- `apps/web/lib/data-access/modules/leads/api.ts`
- `apps/web/lib/data-access/modules/leads/create-lead-payload.spec.ts`
- `apps/web/lib/data-access/modules/leads/create-lead-payload.ts`
- `apps/web/lib/data-access/modules/leads/hooks.ts`
- `apps/web/lib/data-access/modules/leads/index.ts`
- `apps/web/lib/data-access/modules/leads/lead-dialog-form.spec.ts`
- `apps/web/lib/data-access/modules/leads/lead-dialog-form.ts`
- `apps/web/lib/data-access/modules/leads/lead-dialog-mutations.spec.ts`
- `apps/web/lib/data-access/modules/leads/lead-dialog-mutations.ts`
- `apps/web/lib/data-access/modules/leads/normalizers.ts`
- `apps/web/lib/data-access/modules/leads/types.ts`
- `apps/web/lib/data-access/modules/policy-renewals/api.ts`
- `apps/web/lib/data-access/modules/policy-renewals/hooks.ts`
- `apps/web/lib/data-access/modules/policy-renewals/index.ts`
- `apps/web/lib/data-access/modules/policy-renewals/types.ts`
- `apps/web/lib/data-access/modules/questionnaires/api.ts`
- `apps/web/lib/data-access/modules/questionnaires/hooks.ts`
- `apps/web/lib/data-access/modules/questionnaires/normalizers.ts`
- `apps/web/lib/data-access/modules/questionnaires/types.ts`
- `apps/web/lib/data-access/modules/quotes/api.ts`
- `apps/web/lib/data-access/modules/quotes/constants.ts`
- `apps/web/lib/data-access/modules/quotes/hooks.ts`
- `apps/web/lib/data-access/modules/quotes/index.ts`
- `apps/web/lib/data-access/modules/quotes/normalizers.spec.ts`
- `apps/web/lib/data-access/modules/quotes/normalizers.ts`
- `apps/web/lib/data-access/modules/quotes/types.ts`
- `apps/web/lib/data-access/query-keys.ts`
- `apps/web/lib/design-system/breakpoints.ts`
- `apps/web/lib/design-system/colors.ts`
- `apps/web/lib/design-system/content-layout.ts`
- `apps/web/lib/design-system/density.ts`
- `apps/web/lib/design-system/elevation.ts`
- `apps/web/lib/design-system/foundation.css`
- `apps/web/lib/design-system/icons.ts`
- `apps/web/lib/design-system/index.ts`
- `apps/web/lib/design-system/layout.ts`
- `apps/web/lib/design-system/motion.ts`
- `apps/web/lib/design-system/opacity.ts`
- `apps/web/lib/design-system/operational-pipeline.ts`
- `apps/web/lib/design-system/operational-workspace.ts`
- `apps/web/lib/design-system/providers/theme-provider.tsx`
- `apps/web/lib/design-system/radius.ts`
- `apps/web/lib/design-system/shadows.ts`
- `apps/web/lib/design-system/sizing.ts`
- `apps/web/lib/design-system/spacing.ts`
- `apps/web/lib/design-system/typography.ts`
- `apps/web/lib/design-system/z-index.ts`
- `apps/web/lib/layout/operational-shell.ts`
- `apps/web/lib/leads/lead-owner.ts`
- `apps/web/lib/navigation.ts`
- `apps/web/lib/performance/bug010-drawer-flow.ts`
- `apps/web/lib/performance/bug010-lead-create.ts`
- `apps/web/lib/pipeline-dnd.ts`
- `apps/web/lib/pipeline-order.ts`
- `apps/web/lib/questionnaires/forms-library-adapter.ts`
- `apps/web/lib/questionnaires/forms-library-storage.ts`
- `apps/web/lib/questionnaires/questionnaire-field-validation.ts`
- `apps/web/lib/questionnaires/questionnaire-form-state.spec.ts`
- `apps/web/lib/questionnaires/questionnaire-rules.ts`
- `apps/web/lib/questionnaires/template-settings-autosave.util.spec.ts`
- `apps/web/lib/questionnaires/template-settings-autosave.util.ts`
- `apps/web/lib/questionnaires/use-template-settings-autosave.ts`

### `docker-compose.yml` (1)

- `docker-compose.yml`

### `docs/architecture` (1)

- `docs/architecture/system-inventory.md`

### `docs/reports` (11)

- `docs/reports/avila-production-readiness.md`
- `docs/reports/crm-003-2-final-validation.md`
- `docs/reports/crm-004-evolution-api.md`
- `docs/reports/crm-006-4-operacao-comercial.md`
- `docs/reports/crm-release-manifest.md`
- `docs/reports/crm-release-readiness.md`
- `docs/reports/env-001-dev-environment.md`
- `docs/reports/hml-deployment-checklist.md`
- `docs/reports/hotfix-001-operational-stabilization.md`
- `docs/reports/insureflow-operational-audit.md`
- `docs/reports/production-deploy-readiness.md`

### `docs/sprint-notes` (2)

- `docs/sprint-notes/sprint-2-closure.md`
- `docs/sprint-notes/sprint-3.0-plan.md`

### `docs/templates/importacao` (2)

- `docs/templates/importacao/CLIENTES.xlsx`
- `docs/templates/importacao/LEADS.xlsx`

### `package-lock.json` (1)

- `package-lock.json`

### `package.json` (1)

- `package.json`

### `packages/auth` (3)

- `packages/auth/src/roles.ts`
- `packages/auth/src/routes.ts`
- `packages/auth/src/types.ts`

### `packages/database` (5)

- `packages/database/prisma/prod-clean-demo-data.ts`
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/seed-business-unit-homologation.ts`
- `packages/database/prisma/seed-ownership.ts`
- `packages/database/prisma/seed.ts`

### `packages/database/prisma/migrations` (12)

- `packages/database/prisma/migrations/20260701120000_add_quotes_domain/migration.sql`
- `packages/database/prisma/migrations/20260703120000_proposal_center/migration.sql`
- `packages/database/prisma/migrations/20260708153000_deal_owner_user_id/migration.sql`
- `packages/database/prisma/migrations/20260724170000_questionnaire_submission_updated_by/migration.sql`
- `packages/database/prisma/migrations/20260820120000_multiempresa_reactivation/migration.sql`
- `packages/database/prisma/migrations/20260820180000_commercial_recovery/migration.sql`
- `packages/database/prisma/migrations/20260820190000_commercial_communication/migration.sql`
- `packages/database/prisma/migrations/20260820200000_user_business_units/migration.sql`
- `packages/database/prisma/migrations/20260820220000_evolution_api/migration.sql`
- `packages/database/prisma/migrations/20260820230000_customer_360_opportunities/migration.sql`
- `packages/database/prisma/migrations/20260820240000_sales_pipeline_inteligente/migration.sql`
- `packages/database/prisma/migrations/20260820250000_sales_targets_commissions/migration.sql`

### `packages/forms-engine` (4)

- `packages/forms-engine/jest.config.cjs`
- `packages/forms-engine/package.json`
- `packages/forms-engine/tsconfig.build.json`
- `packages/forms-engine/tsconfig.json`

### `packages/forms-engine/src` (27)

- `packages/forms-engine/src/index.ts`
- `packages/forms-engine/src/rules/action-executor.ts`
- `packages/forms-engine/src/rules/actions/index.ts`
- `packages/forms-engine/src/rules/condition-evaluator.ts`
- `packages/forms-engine/src/rules/conditional-engine.ts`
- `packages/forms-engine/src/rules/index.ts`
- `packages/forms-engine/src/rules/operators/index.ts`
- `packages/forms-engine/src/rules/rule-context.ts`
- `packages/forms-engine/src/rules/rule-engine.spec.ts`
- `packages/forms-engine/src/rules/rule-engine.ts`
- `packages/forms-engine/src/rules/rule-evaluator.ts`
- `packages/forms-engine/src/rules/rule-registry.ts`
- `packages/forms-engine/src/rules/types/index.ts`
- `packages/forms-engine/src/rules/utils/rules.util.ts`
- `packages/forms-engine/src/rules/utils/value.util.ts`
- `packages/forms-engine/src/validation/field-metadata.ts`
- `packages/forms-engine/src/validation/index.ts`
- `packages/forms-engine/src/validation/types/index.ts`
- `packages/forms-engine/src/validation/utils/answer.util.ts`
- `packages/forms-engine/src/validation/utils/context.util.ts`
- `packages/forms-engine/src/validation/utils/field.util.ts`
- `packages/forms-engine/src/validation/utils/masks.util.ts`
- `packages/forms-engine/src/validation/utils/validators.util.ts`
- `packages/forms-engine/src/validation/validation-engine.spec.ts`
- `packages/forms-engine/src/validation/validation-engine.ts`
- `packages/forms-engine/src/validation/validation-registry.ts`
- `packages/forms-engine/src/validation/validators/index.ts`

### `packages/forms-library` (4)

- `packages/forms-library/jest.config.cjs`
- `packages/forms-library/package.json`
- `packages/forms-library/tsconfig.build.json`
- `packages/forms-library/tsconfig.json`

### `packages/forms-library/src` (9)

- `packages/forms-library/src/blocks/index.ts`
- `packages/forms-library/src/fields/index.ts`
- `packages/forms-library/src/forms-library.spec.ts`
- `packages/forms-library/src/index.ts`
- `packages/forms-library/src/metadata/categories.ts`
- `packages/forms-library/src/metadata/types.ts`
- `packages/forms-library/src/utils/favorites.ts`
- `packages/forms-library/src/utils/instantiate.ts`
- `packages/forms-library/src/utils/search.ts`

### `packages/typescript-config` (1)

- `packages/typescript-config/library-build.json`

### `scripts/check-local-runtime.cjs` (1)

- `scripts/check-local-runtime.cjs`

### `scripts/dev-cloud-homologation.cjs` (1)

- `scripts/dev-cloud-homologation.cjs`

### `scripts/ensure-workspace-packages.cjs` (1)

- `scripts/ensure-workspace-packages.cjs`

### `turbo.json` (1)

- `turbo.json`


---

## Lista — NÃO incluir / deixar no disco

- `apps/api/tsc.log`
- `docs/adr/ADR-001-design-tokens.md`
- `docs/adr/ADR-002-compact-density.md`
- `docs/adr/ADR-003-theme-provider.md`
- `docs/adr/ADR-004-app-card.md`
- `docs/adr/ADR-005-tailwind.md`
- `docs/adr/ADR-006-shadcn-ui.md`
- `docs/adr/ADR-007-motion.md`
- `docs/architecture/questionnaire-domain-v2.md`
- `docs/architecture/questionnaire-roadmap.md`
- `docs/architecture/smart-forms-engine.md`
- `docs/architecture/sprint-3-plan.md`
- `docs/audits/crm-final-audit.md`
- `docs/audits/crm-sprint6-audit.md`
- `docs/infra/README.md`
- `docs/infra/prod-clean-demo-data.md`
- `docs/infra/prod-clean-pre-execute-checklist.md`
- `docs/infra/prod-dry-run-report-template.md`
- `docs/reports/avila-production-readiness.evidence.json`
- `docs/reports/bug-003-questionnaire-submissions-400.md`
- `docs/reports/bug-005-lead-dialog-error-state.md`
- `docs/reports/bug-006-lead-create-flow-audit.md`
- `docs/reports/bug-007-create-lead-dto-audit.md`
- `docs/reports/bug-008-execution-environment-audit.md`
- `docs/reports/bug-009-double-submit-protection.md`
- `docs/reports/bug-010-1-frontend-bottleneck.md`
- `docs/reports/bug-010-2-leads-listing-audit.md`
- `docs/reports/bug-010-4-drawer-loading.md`
- `docs/reports/bug-010-5-drawer-state-audit.md`
- `docs/reports/bug-010-7-drawer-fix.md`
- `docs/reports/bug-010-lead-create-performance-audit.md`
- `docs/reports/bug-011-1-login-bff.md`
- `docs/reports/hotfix-autosave-loop.md`
- `docs/reports/lead-create-contract-audit.md`
- `docs/reports/sprint6-phase1-5.md`
- `docs/reports/sprint6-phase1.md`
- `docs/reports/sprint6-phase2.md`
- `docs/reports/sprint6-phase3.md`
- `docs/reports/sprint6-phase5-questionnaire-redesign.md`
- `docs/reports/sprint6-phase6-form-builder-pro.md`
- `docs/reports/sprint6-phase7-ux-simplification.md`
- `docs/reports/sprint7-epic1-validation-engine.md`
- `docs/reports/sprint7-epic2-rules-engine.md`
- `docs/reports/sprint7-epic3-field-library.md`
- `docs/reports/sprint7-epic3-ux-wizard.md`
- `docs/reports/sprint7-monorepo-runtime-stability.md`
- `docs/sprint-5.1a-screenshots/dashboard-1366x768.png`
- `docs/sprint-5.1a-screenshots/dashboard-1600x900.png`
- `docs/sprint-5.1a-screenshots/dashboard-1920x1080.png`
- `docs/sprint-5.1a-screenshots/dashboard-2560x1440.png`
- `docs/sprint-5.1b-screenshots/dashboard-1366x768.png`
- `docs/sprint-5.1b-screenshots/dashboard-1600x900.png`
- `docs/sprint-5.1b-screenshots/dashboard-1920x1080.png`
- `docs/sprint-5.1b-screenshots/dashboard-2560x1440.png`
- `docs/sprint-5.2-screenshots/dashboard-1366.png`
- `docs/sprint-5.2-screenshots/dashboard-1366x768.png`
- `docs/sprint-5.2-screenshots/dashboard-1600.png`
- `docs/sprint-5.2-screenshots/dashboard-1600x900.png`
- `docs/sprint-5.2-screenshots/dashboard-1920.png`
- `docs/sprint-5.2-screenshots/dashboard-1920x1080.png`
- `docs/sprint-5.2-screenshots/dashboard-2560x1440.png`
- `docs/sprint-5.3-screenshots/dashboard-1366.png`
- `docs/sprint-5.3-screenshots/dashboard-1366x768.png`
- `docs/sprint-5.3-screenshots/dashboard-1600.png`
- `docs/sprint-5.3-screenshots/dashboard-1600x900.png`
- `docs/sprint-5.3-screenshots/dashboard-1920.png`
- `docs/sprint-5.3-screenshots/dashboard-1920x1080.png`
- `docs/sprint-5.3-screenshots/dashboard-2560.png`
- `docs/sprint-5.3-screenshots/dashboard-2560x1440.png`
- `docs/sprint-5.4-screenshots/dashboard-1366.png`
- `docs/sprint-5.4-screenshots/dashboard-1366x768.png`
- `docs/sprint-5.4-screenshots/dashboard-1600.png`
- `docs/sprint-5.4-screenshots/dashboard-1600x900.png`
- `docs/sprint-5.4-screenshots/dashboard-1920.png`
- `docs/sprint-5.4-screenshots/dashboard-1920x1080.png`
- `docs/sprint-5.4-screenshots/dashboard-2560.png`
- `docs/sprint-5.4-screenshots/dashboard-2560x1440.png`
- `docs/sprint-5.5-screenshots/sprint-5.5-dashboard-1366.png`
- `docs/sprint-5.5-screenshots/sprint-5.5-dashboard-1600.png`
- `docs/sprint-5.5-screenshots/sprint-5.5-dashboard-1920.png`
- `docs/sprint-5.5-screenshots/sprint-5.5-dashboard-2560.png`
- `docs/sprint-notes/sprint-4.6-screenshots/crm-negocios-1366x768.png`
- `docs/sprint-notes/sprint-4.6-screenshots/crm-negocios-1920x1080-after.png`
- `docs/sprint-notes/sprint-4.6-screenshots/crm-negocios-1920x1080.png`
- `docs/sprint-notes/sprint-4.6-screenshots/crm-overview-1920x1080.png`
- `docs/sprint-notes/sprint-4.6-screenshots/dashboard-1920x1080.png`
- `docs/sprint-notes/sprint-4.6-screenshots/leads-1920x1080.png`
- `docs/technical-debt/README.md`
- `docs/technical-debt/data-table.md`
- `docs/ui/accessibility.md`
- `docs/ui/components.md`
- `docs/ui/forms.md`
- `docs/ui/foundation.md`
- `docs/ui/icons.md`
- `docs/ui/kanban.md`
- `docs/ui/layout.md`
- `docs/ui/motion.md`
- `docs/ui/patterns.md`
- `docs/ui/spacing.md`
- `docs/ui/tables.md`
- `docs/ui/tokens.md`
- `packages/forms-engine/dist-test/index.d.ts`
- `packages/forms-engine/dist-test/index.d.ts.map`
- `packages/forms-engine/dist-test/index.js`
- `packages/forms-engine/dist-test/rules/action-executor.d.ts`
- `packages/forms-engine/dist-test/rules/action-executor.d.ts.map`
- `packages/forms-engine/dist-test/rules/action-executor.js`
- `packages/forms-engine/dist-test/rules/actions/index.d.ts`
- `packages/forms-engine/dist-test/rules/actions/index.d.ts.map`
- `packages/forms-engine/dist-test/rules/actions/index.js`
- `packages/forms-engine/dist-test/rules/condition-evaluator.d.ts`
- `packages/forms-engine/dist-test/rules/condition-evaluator.d.ts.map`
- `packages/forms-engine/dist-test/rules/condition-evaluator.js`
- `packages/forms-engine/dist-test/rules/conditional-engine.d.ts`
- `packages/forms-engine/dist-test/rules/conditional-engine.d.ts.map`
- `packages/forms-engine/dist-test/rules/conditional-engine.js`
- `packages/forms-engine/dist-test/rules/index.d.ts`
- `packages/forms-engine/dist-test/rules/index.d.ts.map`
- `packages/forms-engine/dist-test/rules/index.js`
- `packages/forms-engine/dist-test/rules/operators/index.d.ts`
- `packages/forms-engine/dist-test/rules/operators/index.d.ts.map`
- `packages/forms-engine/dist-test/rules/operators/index.js`
- `packages/forms-engine/dist-test/rules/rule-context.d.ts`
- `packages/forms-engine/dist-test/rules/rule-context.d.ts.map`
- `packages/forms-engine/dist-test/rules/rule-context.js`
- `packages/forms-engine/dist-test/rules/rule-engine.d.ts`
- `packages/forms-engine/dist-test/rules/rule-engine.d.ts.map`
- `packages/forms-engine/dist-test/rules/rule-engine.js`
- `packages/forms-engine/dist-test/rules/rule-engine.spec.d.ts`
- `packages/forms-engine/dist-test/rules/rule-engine.spec.d.ts.map`
- `packages/forms-engine/dist-test/rules/rule-engine.spec.js`
- `packages/forms-engine/dist-test/rules/rule-evaluator.d.ts`
- `packages/forms-engine/dist-test/rules/rule-evaluator.d.ts.map`
- `packages/forms-engine/dist-test/rules/rule-evaluator.js`
- `packages/forms-engine/dist-test/rules/rule-registry.d.ts`
- `packages/forms-engine/dist-test/rules/rule-registry.d.ts.map`
- `packages/forms-engine/dist-test/rules/rule-registry.js`
- `packages/forms-engine/dist-test/rules/types/index.d.ts`
- `packages/forms-engine/dist-test/rules/types/index.d.ts.map`
- `packages/forms-engine/dist-test/rules/types/index.js`
- `packages/forms-engine/dist-test/rules/utils/rules.util.d.ts`
- `packages/forms-engine/dist-test/rules/utils/rules.util.d.ts.map`
- `packages/forms-engine/dist-test/rules/utils/rules.util.js`
- `packages/forms-engine/dist-test/rules/utils/value.util.d.ts`
- `packages/forms-engine/dist-test/rules/utils/value.util.d.ts.map`
- `packages/forms-engine/dist-test/rules/utils/value.util.js`
- `packages/forms-engine/dist-test/validation/field-metadata.d.ts`
- `packages/forms-engine/dist-test/validation/field-metadata.d.ts.map`
- `packages/forms-engine/dist-test/validation/field-metadata.js`
- `packages/forms-engine/dist-test/validation/index.d.ts`
- `packages/forms-engine/dist-test/validation/index.d.ts.map`
- `packages/forms-engine/dist-test/validation/index.js`
- `packages/forms-engine/dist-test/validation/types/index.d.ts`
- `packages/forms-engine/dist-test/validation/types/index.d.ts.map`
- `packages/forms-engine/dist-test/validation/types/index.js`
- `packages/forms-engine/dist-test/validation/utils/answer.util.d.ts`
- `packages/forms-engine/dist-test/validation/utils/answer.util.d.ts.map`
- `packages/forms-engine/dist-test/validation/utils/answer.util.js`
- `packages/forms-engine/dist-test/validation/utils/context.util.d.ts`
- `packages/forms-engine/dist-test/validation/utils/context.util.d.ts.map`
- `packages/forms-engine/dist-test/validation/utils/context.util.js`
- `packages/forms-engine/dist-test/validation/utils/field.util.d.ts`
- `packages/forms-engine/dist-test/validation/utils/field.util.d.ts.map`
- `packages/forms-engine/dist-test/validation/utils/field.util.js`
- `packages/forms-engine/dist-test/validation/utils/masks.util.d.ts`
- `packages/forms-engine/dist-test/validation/utils/masks.util.d.ts.map`
- `packages/forms-engine/dist-test/validation/utils/masks.util.js`
- `packages/forms-engine/dist-test/validation/utils/validators.util.d.ts`
- `packages/forms-engine/dist-test/validation/utils/validators.util.d.ts.map`
- `packages/forms-engine/dist-test/validation/utils/validators.util.js`
- `packages/forms-engine/dist-test/validation/validation-engine.d.ts`
- `packages/forms-engine/dist-test/validation/validation-engine.d.ts.map`
- `packages/forms-engine/dist-test/validation/validation-engine.js`
- `packages/forms-engine/dist-test/validation/validation-engine.spec.d.ts`
- `packages/forms-engine/dist-test/validation/validation-engine.spec.d.ts.map`
- `packages/forms-engine/dist-test/validation/validation-engine.spec.js`
- `packages/forms-engine/dist-test/validation/validation-registry.d.ts`
- `packages/forms-engine/dist-test/validation/validation-registry.d.ts.map`
- `packages/forms-engine/dist-test/validation/validation-registry.js`
- `packages/forms-engine/dist-test/validation/validators/index.d.ts`
- `packages/forms-engine/dist-test/validation/validators/index.d.ts.map`
- `packages/forms-engine/dist-test/validation/validators/index.js`
- `packages/forms-engine/tsconfig.build.tsbuildinfo`
- `packages/forms-library/tsconfig.build.tsbuildinfo`
- `railway-diagnose-out.txt`
- `scripts/dns-propagation-watch.cjs`
- `scripts/railway-hml-bootstrap.cjs`
- `vercel.json`

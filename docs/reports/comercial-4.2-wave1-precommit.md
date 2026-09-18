# Comercial 4.2 — Wave 1 Pre-commit Audit

**Data:** 2026-09-16  
**Worktree:** `InsureFlow-wt-sprint40`  
**Branch:** `feature/sprint-comercial-4.2`  
**Base HEAD:** `3c9b9a7`  
**Escopo:** validar os 14 arquivos modificados antes do commit liberável

---

## 1. Inventário (14 arquivos)

| # | Arquivo | Papel Wave 1 |
|---|---------|--------------|
| 1 | `apps/api/src/common/utils/lead-reactivation.util.ts` | `nextReactivationAt` via motivo |
| 2 | `apps/api/src/common/utils/lead-reactivation.util.spec.ts` | Testes util |
| 3 | `apps/api/src/modules/leads/leads.service.ts` | Enforce `lossReasonId` + audit |
| 4 | `apps/api/src/modules/lead-loss-reasons/dto/lead-loss-reason.dto.ts` | `reactivationDays` obrigatório |
| 5 | `apps/api/src/modules/lead-loss-reasons/lead-loss-reasons.service.ts` | Assert dias |
| 6 | `apps/api/src/modules/lead-loss-reasons/lead-loss-reasons.service.spec.ts` | Testes service |
| 7 | `apps/api/src/modules/commercial-agenda/commercial-agenda.service.ts` | KPIs + BU ACL |
| 8 | `apps/web/components/crm/commercial-agenda-workspace.tsx` | UI KPIs |
| 9 | `apps/web/lib/data-access/modules/commercial-agenda/api.ts` | Tipos metrics |
| 10 | `apps/web/components/leads/leads-page.tsx` | Bloqueia status→lost direto |
| 11 | `apps/web/components/leads/sheet-sections/lead-data-section.tsx` | Remove lost do select |
| 12 | `apps/web/components/leads/sheet-sections/lead-conversion-section.tsx` | Motivo + preview dias |
| 13 | `apps/web/components/settings/lead-loss-reasons-manager.tsx` | Create exige dias |
| 14 | `apps/web/lib/data-access/modules/lead-loss-reasons/types.ts` | Tipo create |

**Diff:** +238 / −50 linhas.

---

## 2. Exclusões (scan)

| Área proibida | Presente nos 14? |
|---------------|------------------|
| Portal (`portal-imobiliario`) | ❌ Não |
| Imobiliária (rotas/real-estate WIP) | ❌ Não |
| Governance | ❌ Não |
| BU WIP (memberships / ensure-grupo) | ❌ Não — só `buAccess.leadWhere` já existente na Agenda |
| UX experimental fora Wave 1 | ❌ Não |

Conclusão: **14/14 pertencem exclusivamente à Wave 1**.

---

## 3. Fora do commit (deixar untracked)

- `docs/reports/comercial-4.0-*.md`, `comercial-4.1-*.md` (auditorias anteriores)
- `docs/reports/comercial-go-live-*.md` (plano go-live; não é código Wave 1)

Incluir no commit: código 14 arquivos + `comercial-4.2-wave1.md` + este precommit + release (após SHA).

---

## 4. Critério para seguir

- [x] Escopo limpo  
- [ ] Gate testes/builds (FASE 2)  
- [ ] Commit único se verde  

**Veredito pré-commit:** 🟢 apto a gate.

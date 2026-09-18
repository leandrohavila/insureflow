# Sprint 2 — Ownership + RBAC (leads only)

## Entregue

- Migration additive: `Team`, `TeamMember`, `LeadShare`, `ownerUserId`, `ownerTeamId`, `Role.defaultDataScope`
- `OwnershipService`: `resolveContext`, `buildLeadAccessWhere`, `assertCanAccessLead`, shadow logging
- Feature flag `ownershipEnforcement`: `off` | `shadow` | `on`
- Integração API em leads (list, detail, update, delete, create)
- Seed `seed-ownership.ts` + backfill script
- Frontend: `dataScope` na sessão, filtro "Meus leads" condicional, `PermissionGate` existente
- Docs: [HML checklist](../architecture/sprint-2-hml-checklist.md), [rollout/riscos](../architecture/sprint-2-rollout-risks.md)

## Fora de escopo

Deals, customers, policies, financeiro, enforcement global em produção.

## Próximo passo operacional

Local/HML: migrate → seed → backfill dry-run → `OWNERSHIP_ENFORCEMENT=shadow` → checklist V1–V4 → `on`.

# Sprint 3.0 — Hardening operacional

Escopo aprovado: credibilidade dos dados e preparação para Usuários/Parceiros (Sprint 3.1).

## PRs

| PR | Conteúdo |
|----|----------|
| PR-1 | Merge Sprint 2 (`feature/rbac-ownership-foundations` → `main`) |
| PR-2 | Typecheck RBAC, login personas, owner real leads, smoke tests |
| PR-3 | Dashboard MVP (dados reais), remoção de mocks |
| PR-4 | Guard exclusão lead convertido |

## Adiado para Sprint 3.1

### S3-08 — Feed CRM via Activities API

**Status:** adiado.

**Motivo:** auditoria confirmou que a Activities API ainda não aplica `ownership` nem `dataScope`. A Sprint 3.1 implementará ownership em Deals, Customers e Activities — introduzir o feed agora criaria UX sobre regras de acesso que serão alteradas em seguida.

**Reavaliação:** após ownership/dataScope em Activities (Sprint 3.1), substituir `buildDealTimelinePreview` em `crm-activity-feed.tsx` por `useActivities`.

## Critérios de aceite (resumo)

- `npm run check-types` e `npm run ci` verdes
- Smoke local + `hml:sprint2:validate` OK
- Dashboard: KPIs reais, gated por permissão; parceiro vê só Leads ativos
- Lead convertido não excluível (API 409 + UI)
- Owner real visível na lista e detalhe de leads

## Referências

- Fechamento Sprint 2: `docs/sprint-notes/sprint-2-closure.md`
- Plano Sprint 3.1 (Usuários/RBAC): `docs/architecture/sprint-3-plan.md`

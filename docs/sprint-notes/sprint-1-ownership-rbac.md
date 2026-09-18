# Sprint 1 — Ownership + RBAC Foundations

**Status:** Modelagem concluída (sem implementação de código)  
**Data:** 2026-05-27

## Objetivo

Separar **permissão** (o que pode fazer) de **ownership** (quais registros vê), suportando parceiro, comercial, gerência e admin — validável em local/HML antes de produção.

## Entregáveis

| Item | Documento |
|------|-----------|
| Arquitetura ownership | [ownership-architecture.md](../architecture/ownership-architecture.md) |
| Proposta Prisma | [ownership-schema-proposal.prisma](../architecture/ownership-schema-proposal.prisma) |
| RBAC (contexto) | [rbac-architecture.md](../architecture/rbac-architecture.md) |
| ADR | [ADR-006](../decisions/ADR-006-rbac-and-ownership.md) |

## Decisões-chave

1. FKs `ownerUserId` + `ownerTeamId` em Lead, Deal, Customer; manter `assignedTo` até backfill.
2. Parceiros: tabela `LeadShare`, escopo `shared` — sem pipeline/financeiro.
3. Escopos: `own` | `team` | `tenant` | `shared` via `Role.defaultDataScope`.
4. `OwnershipService` + `build*AccessWhere` nos services — não só no guard.
5. Rollout: feature flag `ownershipEnforcement` → local → HML → prod com backup.

## Fora de escopo

WhatsApp, IA, automações, financeiro, dashboards avançados.

## Fase 2 (matriz — concluída em doc)

Ver [sprint-1b-phase-2-matrix.md](./sprint-1b-phase-2-matrix.md) e pasta `docs/architecture/rbac-*.md`.

## Próxima sprint (implementação)

1. Aprovar matriz de permissões com negócio.
2. Migration 1 additive (`teams`, `lead_shares`, colunas owner).
3. `OwnershipService` + leads list/detail com flag `shadow`.
4. Seed personas: admin, comercial, gerencia, parceiro em HML.
5. Testes e2e checklist V1–V13.

## Validação manual (quando implementar)

- [ ] Parceiro: só leads compartilhados; sem `/crm` pipeline
- [ ] Comercial: só carteira própria
- [ ] Gerente: equipe
- [ ] Admin: tenant inteiro
- [ ] DevTools: listagens não retornam IDs alheios (404 no detail)

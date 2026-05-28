# InsureFlow — Documentação oficial

Documentação viva do monorepo InsureFlow (Turbo · NestJS · Next.js · Prisma · PostgreSQL).

## Propósito

- Consolidar decisões de domínio, arquitetura e UX operacional
- Evitar perda de contexto entre sprints
- Diferenciar claramente **implementado** vs **planejado**
- Não substituir código-fonte: em caso de divergência, o código prevalece até a doc ser atualizada

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| [architecture/](architecture/) | Padrões técnicos frontend e backend; [RBAC e ownership](architecture/rbac-architecture.md) |
| [domain/](domain/) | Modelo de domínio comercial (leads, negócios, questionários) |
| [workflows/](workflows/) | Fluxos operacionais do corretor |
| [decisions/](decisions/) | ADRs — Architecture Decision Records |
| [roadmap/](roadmap/) | Evolução incremental do CRM |
| [ux/](ux/) | Princípios de experiência operacional |
| [technical-debt/](technical-debt/) | Dívida técnica conhecida |
| [sprint-notes/](sprint-notes/) | Notas por sprint |
| [infra/](infra/) | Git, ambientes, CI/CD, deploy, checklists |

## Documentos principais

1. [Ciclo de vida do lead](domain/lead-lifecycle.md)
2. [Padrões frontend](architecture/frontend-patterns.md)
3. [Padrões backend](architecture/backend-patterns.md)
4. [Arquitetura RBAC](architecture/rbac-architecture.md) — usuários, perfis, permissões (planejado)
5. [Arquitetura Ownership](architecture/ownership-architecture.md) — escopos, parceiros, migrations (Sprint 1)
6. [RBAC — papéis e escopos](architecture/rbac-roles-and-scopes.md) · [Matriz permissões](architecture/rbac-phase-2-matrix.md) · [Matriz ownership](architecture/rbac-ownership-matrix.md) (Sprint 1b)
7. [Fluxo comercial](workflows/commercial-flow.md)
8. [ADRs](decisions/README.md) — incl. [ADR-006 RBAC + ownership](decisions/ADR-006-rbac-and-ownership.md)
9. [Roadmap CRM](roadmap/crm-evolution.md)
10. [Princípios UX operacional](ux/operational-principles.md)
11. [Sprint 1 Ownership](sprint-notes/sprint-1-ownership-rbac.md) · [Sprint 1b Fase 2](sprint-notes/sprint-1b-phase-2-matrix.md)
12. [Sprint 2 — HML checklist](architecture/sprint-2-hml-checklist.md) · [Deploy HML](architecture/sprint-2-hml-deploy-guide.md) · [Browser UI](architecture/sprint-2-browser-validation-checklist.md) · [Relatório](architecture/sprint-2-hml-validation-report.md)

## Convenções

- **Implementado**: comportamento presente em produção/código atual
- **Planejado**: decisão aprovada ou discutida, ainda sem implementação
- **Parcial**: parte implementada, com lacunas documentadas

## Manutenção

Atualizar a documentação quando:

- Novos status, permissões ou endpoints forem adicionados
- Regras de validação (draft vs submit) mudarem
- ADRs forem superseded por novos registros

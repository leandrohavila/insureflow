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
| [architecture/](architecture/) | Padrões técnicos frontend e backend |
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
4. [Fluxo comercial](workflows/commercial-flow.md)
5. [ADRs](decisions/README.md)
6. [Roadmap CRM](roadmap/crm-evolution.md)
7. [Princípios UX operacional](ux/operational-principles.md)

## Convenções

- **Implementado**: comportamento presente em produção/código atual
- **Planejado**: decisão aprovada ou discutida, ainda sem implementação
- **Parcial**: parte implementada, com lacunas documentadas

## Manutenção

Atualizar a documentação quando:

- Novos status, permissões ou endpoints forem adicionados
- Regras de validação (draft vs submit) mudarem
- ADRs forem superseded por novos registros

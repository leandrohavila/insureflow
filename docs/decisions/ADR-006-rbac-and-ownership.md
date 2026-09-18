# ADR-006: RBAC, perfis e ownership de registros

**Status:** Proposto  
**Data:** 2026-05-27  
**Relacionado:** [rbac-architecture.md](../architecture/rbac-architecture.md), [ownership-architecture.md](../architecture/ownership-architecture.md), [ADR-001](ADR-001-multi-tenant-architecture.md)

## Contexto

O InsureFlow já possui tabelas `users`, `roles`, `permissions`, `user_roles`, `role_permissions` e guards JWT + permissões no NestJS. Porém:

- permissões existem em **dois lugares** (DB e `@repo/auth` estático);
- a sessão Web trata **um único papel**;
- **ownership** não é aplicado de forma consistente (`assignedTo` é texto livre; só leads têm `?mine=true`);
- não há UI/API completa para administrar usuários e perfis.

A corretora precisa crescer para multiusuário com comercial, operacional, financeiro e parceiros, sem vazamento de carteira entre executivos.

## Decisão

1. **Manter** modelo RBAC relacional existente (Permission global, Role por tenant, N:N).
2. **Unificar** catálogo de permissões no banco como fonte de verdade em runtime; sincronizar tipos TS via script na implementação.
3. **Separar** autorização em duas camadas: **permissão** (ação no módulo) e **ownership** (escopo de registros: `own` | `team` | `tenant`).
4. **Introduzir** FKs `ownerUserId` em entidades comerciais principais (leads, deals, customers) e deprecar `assignedTo` texto após migração.
5. **Papéis sistema** padronizados: `admin`, `comercial`, `operacional`, `financeiro`, `parceiro`, `leitura` (+ `super_admin` plataforma).
6. **Expandir** permissões além de `crm:*` agregado (`deals:*`, `roles:*`, `records.scope.*` ou `Role.defaultDataScope`).
7. **Não implementar** nesta decisão: equipes (`Team`), CRUD admin, interceptor global — planejados em fases no documento de arquitetura.

## Consequências

- Migrações de schema e de dados para ownership.
- Refatoração gradual de listagens e agenda para respeitar escopo.
- JWT continuará carregando permissões até refresh; endpoint de re-sync de sessão para admin UX.
- Testes E2E de isolamento por usuário dentro do mesmo tenant.

## Alternativas consideradas

| Alternativa | Motivo de rejeição |
|-------------|-------------------|
| RBAC só no frontend | Inseguro; API expõe dados. |
| Um role fixo por usuário no DB | Já suportamos N:N; desperdiça flexibilidade. |
| Row-Level Security só no Postgres | Complexidade operacional; Prisma + services são padrão atual do projeto. |
| Permissões apenas por rota HTTP | Granularidade insuficiente para ownership e ações em recursos. |

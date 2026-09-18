# Sprint 1b — Fase 2: Matriz de permissões + escopos

**Status:** Documentação consolidada  
**Data:** 2026-05-27  
**Sem implementação:** migrations, enforcement, código.

## Objetivo

Definir **quem acessa o quê**, **quais ações executa** e **quais registros visualiza** — validação funcional da corretora antes da Sprint 2.

## Entregáveis

| # | Entregável | Documento |
|---|------------|-----------|
| 1 | Papéis oficiais + escopos | [rbac-roles-and-scopes.md](../architecture/rbac-roles-and-scopes.md) |
| 2 | Matriz módulo × ação × role | [rbac-phase-2-matrix.md](../architecture/rbac-phase-2-matrix.md) |
| 3 | Matriz ownership por entidade | [rbac-ownership-matrix.md](../architecture/rbac-ownership-matrix.md) |
| 4 | Plano enforcement backend/frontend | [rbac-enforcement-plan.md](../architecture/rbac-enforcement-plan.md) |
| 5 | Plano auditoria | [rbac-audit-plan.md](../architecture/rbac-audit-plan.md) |
| 6 | Plano rollout local/HML/prod | [rbac-rollout-plan.md](../architecture/rbac-rollout-plan.md) |

## Decisões consolidadas

1. **8 papéis:** super_admin, admin, gerencia, comercial, operacional, financeiro, parceiro, leitura.
2. **4 escopos:** own, team, shared, tenant — precedência até `tenant`.
3. **Permissões alvo:** `{módulo}.{ação}` com migração desde `módulo:ação`.
4. **Parceiro:** escopo `shared` + `LeadShare`; sem pipeline/financeiro/clientes.
5. **Ownership:** `ownerUserId` + `ownerTeamId`; activities derivadas dos pais.

## Próximo passo (Sprint 2)

1. Aprovação formal da matriz pelo produto/negócio.
2. Migration additive + seed roles.
3. `OwnershipService` + flag `shadow` em HML.
4. Executar checklist V1–V13.

## Índice rápido — cenários

| Persona | Doc |
|---------|-----|
| Parceiro | [rbac-phase-2-matrix § 5.1](../architecture/rbac-phase-2-matrix.md#51-parceiro--indicador-premium) |
| Comercial | [§ 5.2](../architecture/rbac-phase-2-matrix.md#52-comercial--ana-corretora) |
| Gerência | [§ 5.3](../architecture/rbac-phase-2-matrix.md#53-gerência--carlos-supervisor) |
| Admin | [§ 5.4](../architecture/rbac-phase-2-matrix.md#54-admin--patricia-admin) |

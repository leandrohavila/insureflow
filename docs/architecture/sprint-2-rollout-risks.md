# Sprint 2 — Rollout, feature flags e riscos (Leads only)

## Feature flag

| Valor    | Comportamento |
|----------|----------------|
| `off`    | Apenas filtros legados (`assignedTo`, `mine`). Colunas ownership ignoradas na listagem. |
| `shadow` | API calcula escopo ownership, **loga** divergências, **não bloqueia**. Padrão recomendado em HML após seed. |
| `on`     | Listagem/detalhe/update/delete de leads respeitam `buildLeadAccessWhere`. |

**Precedência:** variável de ambiente `OWNERSHIP_ENFORCEMENT` > `Tenant.settings.ownershipEnforcement` > `off`.

## Ordem de rollout

1. **Local:** migration + seed + backfill dry-run → `shadow` → validar logs → `on` com personas V1–V4.
2. **HML:** repetir checklist em [sprint-2-hml-checklist.md](./sprint-2-hml-checklist.md).
3. **Produção:** somente após sign-off; iniciar em `shadow` por ≥ 1 semana; depois `on` por tenant piloto.

## Scripts

```bash
# Seed (roles, equipes, usuários teste)
pnpm --filter @repo/database db:seed

# Backfill assignedTo → ownerUserId (dry-run)
pnpm --filter @repo/database db:backfill:lead-ownership

# Aplicar backfill (HML apenas, com revisão)
pnpm --filter @repo/database db:backfill:lead-ownership -- --execute
```

## Riscos conhecidos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| `assignedTo` texto inconsistente | Backfill não resolve owner | Dry-run + correção manual; manter `assignedTo` |
| Leads sem `ownerUserId` em modo `on` | Comercial não vê lead antigo | Executar backfill antes de `on` |
| Gerência sem `TeamMember` | Lista vazia em `team` | Seed equipe + membership |
| Parceiro sem `LeadShare` | Lista vazia (esperado) | Fluxo de compartilhamento (fase posterior) |
| Shadow com muito warn | Ruído em logs | Ajustar backfill; amostrar por usuário |
| JWT sem `dataScope` | UI mostra filtro errado | Re-login após deploy web+api |

## Breaking changes

Nenhum nesta sprint: colunas nullable, `assignedTo` preservado, enforcement desligado por default em produção.

## Fora de escopo (Sprint 2)

- Deals, customers, policies, financeiro
- Enforcement global ou remoção de `assignedTo`
- Auditoria completa (ver [rbac-audit-plan.md](./rbac-audit-plan.md))

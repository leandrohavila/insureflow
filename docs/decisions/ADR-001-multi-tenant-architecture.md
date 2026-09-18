# ADR-001: Arquitetura multi-tenant

**Status:** Aceito  
**Data:** 2026-02 (enterprise init migration)

## Contexto

InsureFlow é SaaS para corretoras de seguros. Cada corretora (tenant) deve ter dados isolados, usuários próprios e configurações independentes, sem deploy separado por cliente.

## Decisão

- Modelo **tenant por linha**: todas as entidades comerciais carregam `tenantId` com FK para `Tenant`.
- Autenticação JWT inclui `tenantId` e `tenantSlug`; resolução de tenant no login via slug.
- Isolamento aplicado na **camada de service** (queries sempre filtradas por `tenantId` do token).
- Unicidade de negócio escopada ao tenant (ex.: `@@unique([tenantId, document])` em Customer).
- Cascade delete do tenant para dados filhos.

## Consequências

- Simplicidade operacional (um banco, um deploy).
- Impossível vazar dados entre tenants sem bug grave em `where`.
- Migrations e backups únicos para toda a base.
- Configuração por tenant via `Tenant.settings` (JSON) para evoluções sem schema.

## Tradeoffs

| Prós | Contras |
|------|---------|
| Custo infra baixo | “Noisy neighbor” em tenants muito grandes |
| Onboarding rápido | Customização extrema por tenant exige feature flags/settings |
| Auditoria centralizada | Compliance pode exigir silos físicos no futuro (shard por tenant) |

**Não escolhido:** database-per-tenant, schema-per-tenant.

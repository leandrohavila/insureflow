# Deploy prep — Admin Master Navigation

**Data:** 2026-08-27  
**Branch de produção:** `release/crm-operacao-avila`  
**Commit enviado:** `d9d9a3144d349a4525e78a1a4ba21eb67c05fad0`

---

## Objetivo

Publicar **somente** a correção já implementada:

- Menu Admin Master (`admin` / `super_admin` em qualquer posição de `roles[]`)
- Sem filtro de ACL no menu master (páginas/APIs continuam protegidas)
- Backfill `properties:view` e `properties:manage` no papel admin

Não entrou neste commit: portal público, GTM, property-lead attribution, business-unit members, `schema.prisma` de leads genéricos.

---

## 1. Arquivos da correção (commit)

| Arquivo | Papel |
|---------|--------|
| `apps/web/lib/navigation.ts` | `isAdminMaster`, `adminNavGroups`, `resolveOperationalNav` |
| `apps/web/lib/navigation/use-operational-nav.ts` | Usa `resolveOperationalNav` |
| `apps/web/lib/navigation.spec.ts` | 9 testes do menu |
| `apps/web/lib/auth/session.ts` | Persiste `roles[]`; primário prefere admin |
| `apps/web/app/api/auth/me/route.ts` | Expõe `roles` |
| `apps/web/app/api/business-units/context/route.ts` | Regrava cookie com `roles` |
| `apps/web/middleware.ts` | Hidrata `roles[]` em cookie antigo |
| `apps/web/components/dashboard/app-sidebar.tsx` | Renderiza grupos CRM / Seguros / Imobiliário / Governança |
| `apps/web/components/dashboard/use-dashboard-breadcrumbs.ts` | Crumbs alinhados ao menu |
| `packages/auth/src/types.ts` | `SessionPayload.roles?` |
| `packages/auth/src/rbac.ts` | `buildSessionPayload` preenche `roles` |
| `packages/database/prisma/seed.ts` | `ensureAdminHasPropertyPermissions` |
| `packages/database/prisma/seed-ownership.ts` | Upsert `properties:*` no admin |
| `packages/database/prisma/seed-prod-admin.ts` | Concede `properties:*` ao admin de prod |
| `packages/database/prisma/migrations/20260827214500_admin_properties_view/migration.sql` | Backfill de produção |

---

## 2. Git diff (staged / commit)

```
15 files changed, 677 insertions(+), 349 deletions(-)
 create mode 100644 apps/web/lib/navigation.spec.ts
 create mode 100644 packages/database/prisma/migrations/20260827214500_admin_properties_view/migration.sql
```

Fora do commit (working tree permanece sujo de propósito): portal, GTM, property leads, BU memberships, `package.json` de clean scripts, `schema.prisma` de attribution.

---

## 3. Testes do menu

```
npx tsx --test apps/web/lib/navigation.spec.ts
```

**9 passed / 0 failed**

Inclui: `isAdminMaster` em qualquer posição; Admin Master sem ACL; operador em Ávila Imóveis ainda filtrado.

---

## 4. check-types

```
npx turbo run check-types --filter=web --filter=api --filter=@repo/auth
```

**OK** — 10 tasks successful.

---

## 5. Build web e api

```
npx turbo run build --filter=web --filter=api
```

**OK** — 5 tasks successful (exit 0).

- web: Next.js 16.2.0 compile + rotas `/real-estate/*` e `/configuracoes/governanca/*` presentes
- api: `nest build` OK

---

## 6–8. Commit e push

| Campo | Valor |
|-------|--------|
| Mensagem | `feat: admin master navigation and real estate permissions` |
| Branch | `release/crm-operacao-avila` |
| Commit curto | `d9d9a31` |
| Commit completo | `d9d9a3144d349a4525e78a1a4ba21eb67c05fad0` |
| Remote | `origin/release/crm-operacao-avila` |
| Push | `c7673fd..1cf5c38` → `origin/release/crm-operacao-avila` |
| Tip do branch | `1cf5c38` (relatório de deploy) |

---

## 9. Migration

**Existe:** `packages/database/prisma/migrations/20260827214500_admin_properties_view/migration.sql`

Incluída neste commit (`create mode 100644`).

Aplica em produção com `npm run db:deploy` (ou migrate no boot da API). Idempotente:

- cria `properties:view` / `properties:manage` se faltarem
- liga as duas chaves a roles `admin` e `super_admin`

**Não** inclui `20260826180000_property_lead_attribution` (outra feature).

---

## Pós-deploy (produção)

1. Deploy Vercel do **web**.
2. Deploy Railway da **API** (para rodar a migration, se o boot faz `migrate deploy`).
3. Confirmar `_prisma_migrations` contém `20260827214500_admin_properties_view`.
4. **Logout / login** dos admins (cookie com `roles[]`).
5. Conferir menu em Todas / Corretora Ávila / Ávila Imóveis: CRM, Seguros, Imobiliário, Governança.

JWT de produção **antes** desta migration: 27 permissões, sem `properties:*`. Depois do migrate + re-login: deve incluir as duas chaves. O menu master **não** depende delas; as **páginas** `/real-estate/*` sim.

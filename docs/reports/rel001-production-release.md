# REL-001 — Preparar Release Produção

**Data:** 2026-08-24  
**Ticket:** REL-001  
**Base:** GIT-002 Release 1  
**Branch:** `release/crm-operacao-avila`  
**Base hash (pré-R1):** `88049114c8b5f8c4da38d9c284bdd1163d7f54ba`

---

## Classificação final

# READY FOR DEPLOY

Release 1 consolidada em commits organizados, com escopo limitado aos arquivos classificados em GIT-002 R1. Artefatos R2/R3 e exclusões (logs, dist-test, `vercel.json` experimental) permaneceram fora do staging.

**Gates operacionais de deploy (fora deste ticket):** autenticação Vercel / `VERCEL_TOKEN`; aplicação das migrations já versionadas em produção (`prisma migrate deploy` — nenhuma migration nova criada neste ticket).

---

## Resumo

| Campo | Valor |
|-------|-------|
| **Branch** | `release/crm-operacao-avila` |
| **Commits R1** | 9 |
| **Arquivos no range R1** | ~130 (código + docs) |
| **Portal público (R2)** | Não incluído |
| **Docs históricos (R3)** | Não incluídos |
| **Novas migrations** | Nenhuma (apenas arquivos já existentes versionados) |
| **Alteração de banco runtime** | Nenhuma |

---

## Commits gerados

| # | Hash | Mensagem |
|---|------|----------|
| 1 | `23f6c3a` | `feat(web): apply Grupo Avila branding (UX-002)` |
| 2 | `0366210` | `feat(auth): add properties permissions for real-estate CRM` |
| 3 | `6bc53ee` | `feat(web): add real-estate navigation and BU context` |
| 4 | `6cc9281` | `feat(web): add properties BFF routes and data-access layer` |
| 5 | `2bc9712` | `feat(web): ship real-estate CRM pages and components (CRM-IMOB-001)` |
| 6 | `0f39960` | `feat(api): add real-estate properties module and public catalog` |
| 7 | `156cf3e` | `feat(db): include real-estate schema and inventory migrations` |
| 8 | `b1e9abe` | `chore(monorepo): wire real-estate workspace scripts and ignore rules` |
| 9 | *(este commit docs)* | `docs(rel001): production release consolidation report` |

**Hash final:** ver rodapé após push (HEAD da branch).

---

## Arquivos incluídos (Release 1)

### 1. Frontend — branding UX-002

- `apps/web/app/avila-brand.css`
- `apps/web/app/(auth)/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/components/auth/login-form.tsx`
- `apps/web/components/branding/grupo-avila-logo.tsx`
- `apps/web/components/branding/powered-by-insureflow.tsx`
- `apps/web/public/branding/grupo-avila-logo.png`
- `apps/web/components/dashboard/app-topbar.tsx`
- `apps/web/components/dashboard/dashboard-shell.tsx`
- `apps/web/lib/auth/session.ts`
- `apps/web/lib/layout/operational-shell.ts`

### 2. Auth / permissões

- `packages/auth/src/roles.ts`
- `packages/auth/src/types.ts`
- `apps/web/components/auth/permissions-panel.tsx`

### 3. Navegação + BU + dashboard entry

- `apps/web/lib/navigation.ts`
- `apps/web/lib/navigation/use-operational-nav.ts`
- `apps/web/lib/business-units/nav-context.ts`
- `apps/web/lib/auth/nav-access.ts`
- `apps/web/components/dashboard/app-sidebar.tsx`
- `apps/web/components/dashboard/business-unit-switcher.tsx`
- `apps/web/components/dashboard/use-dashboard-breadcrumbs.ts`
- `apps/web/app/(dashboard)/[[...slug]]/page.tsx`

### 4. BFF + data-access

- `apps/web/app/api/properties/**` (12 rotas)
- `apps/web/app/api/persons/route.ts`
- `apps/web/lib/data-access/modules/properties/**`
- `apps/web/lib/data-access/modules/index.ts`
- `apps/web/lib/data-access/query-keys.ts`

### 5. CRM Imobiliário UI

- `apps/web/app/(dashboard)/real-estate/**` (7 páginas)
- `apps/web/components/real-estate/**` (9 componentes)
- `apps/web/lib/real-estate/**`
- `apps/web/components/crm/workspace-search.tsx`
- `apps/web/components/dashboard/dashboard-summary.tsx`

### 6. API Nest — módulo properties

- `apps/api/src/modules/properties/**`
- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/src/modules/access/business-unit-access.service.ts`
- `apps/api/scripts/ensure-prisma-client.cjs`
- `apps/api/.env.example`
- `apps/api/.gitignore`
- `apps/api/uploads/.gitkeep`

### 7. Banco (schema/seed/migrations já existentes — sem criar migration)

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/seed.ts`
- `packages/database/prisma/seed-ownership.ts`
- `packages/database/prisma/migrations/20260824140000_real_estate_inventory/migration.sql`
- `packages/database/prisma/migrations/20260824180000_re004_property_production/migration.sql`

### 8. Monorepo

- `package.json`
- `package-lock.json`
- `turbo.json`
- `.env.example`
- `.env.local.example`
- `.gitignore`
- `scripts/railway-hml-bootstrap.cjs` (removido)

### 9. Documentação mínima R1

- `docs/reports/ux002-implementation.md`
- `docs/reports/ux002-screenshots/` (opcional — evidência visual)
- `docs/reports/crm-imob-001.md`
- `docs/reports/hml001-crm-imobiliario.md`
- `docs/reports/web001-vercel-redeploy.md`
- `docs/reports/web002-production-alignment.md`
- `docs/reports/git001-consolidacao.md`
- `docs/reports/git002-release-plan.md`
- `docs/reports/rel001-production-release.md`
- `docs/architecture/real-estate-inventory.md`
- `docs/reports/crm-release-deployment.md`
- `docs/README.md`
- `docs/infra/README.md`

---

## Explicitamente fora da Release 1

| Path | Motivo |
|------|--------|
| `apps/portal-imobiliario-publico/` | Release 2 |
| `docs/architecture/portal-imobiliario-*.md` | Release 2 |
| `docs/architecture/re004-portal-producao.md` | Release 2 |
| `docs/reports/bug-*`, `sprint*`, `infra-00*` | Release 3 |
| `docs/ux/**`, `docs/ui/**`, `docs/adr/`, `docs/audits/` | Release 3 |
| `docs/infra/prod-clean-*.md`, `docs/technical-debt/**` | Release 3 |
| `vercel.json` (raiz) | Experimental / R3 |
| `apps/api/tsc.log` | Excluir |
| `packages/forms-engine/dist-test/` | Excluir |
| `*.tsbuildinfo` | Excluir |
| `railway-diagnose-out.txt` | Excluir |

---

## Próximo passo (deploy)

1. Push da branch `release/crm-operacao-avila` (este ticket).
2. Railway API: deploy no hash final + `prisma migrate deploy` (migrations já no repo).
3. Vercel web: deploy `apps/web` no mesmo hash (`corretoraavila.com.br`).
4. Smoke HML-001 em produção.

---

## Assinatura

| Campo | Valor |
|-------|-------|
| **Ticket** | REL-001 |
| **Classificação** | **READY FOR DEPLOY** |
| **Branch** | `release/crm-operacao-avila` |
| **Hash final** | _preenchido após commit docs_ |

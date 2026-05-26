# Infraestrutura — Fase 1

Fundação de entrega do InsureFlow: Git, ambientes, PostgreSQL remoto, deploy (Vercel + Railway), CI/CD, seeds e checklists.

| Documento | Conteúdo |
|-----------|----------|
| [git-strategy.md](git-strategy.md) | Branches, PRs, squash merge, política de migrations |
| [environments.md](environments.md) | Variáveis por ambiente (DATABASE, JWT, AUTH, STORAGE, CORS) |
| [custom-domain.md](custom-domain.md) | Domínio .br, DNS Vercel/Railway, SSL e smoke produção |
| [migrations.md](migrations.md) | Política Prisma migrate deploy |
| [postgres-neon.md](postgres-neon.md) | Neon/Supabase/Railway, pooling, backup |
| [ci-cd.md](ci-cd.md) | Pipeline GitHub Actions |
| [release-checklists.md](release-checklists.md) | Migration, deploy e rollback |
| [first-dev-deploy.md](first-dev-deploy.md) | Runbook primeiro deploy DEV (Neon/Railway/Vercel) |
| [github-branch-protection.md](github-branch-protection.md) | Proteção de branches + criar `develop` |

## Quick start (local)

```bash
cp .env.local.example .env.local
docker compose up -d
npm ci
npm run db:deploy
npm run db:seed
npm run db:seed:dev
npm run dev
```

## Quick start (dev cloud)

1. Criar projeto Neon → copiar URLs para `.env.development`
2. `npm run dev:cloud:migrate` (usa `DATABASE_URL_DIRECT` do arquivo)
3. Deploy API no Railway → `DATABASE_URL`, `DATABASE_URL_DIRECT`, `JWT_SECRET`, `CORS_ORIGIN`, `REDIS_URL` (opcional)
4. Deploy Web na Vercel → `AUTH_SECRET`, `API_INTERNAL_URL`
5. Fechar loop CORS na Railway com URL Vercel
6. `npm run dev:cloud:smoke` com `API_URL` + `WEB_URL`

Runbook completo: [first-dev-deploy.md](first-dev-deploy.md). Checklist operacional: [release-checklists.md](release-checklists.md).

## Scripts de homologação

| Script | Uso |
|--------|-----|
| `npm run dev:local:check` | Env vars + health local antes do login |
| `npm run dev:local:smoke` | Auth + health API (e rotas web com `WEB_URL`) |
| `npm run dev:cloud:migrate` | `prisma migrate deploy` contra Neon (`.env.development`) |
| `npm run dev:cloud:smoke` | Health + login + rotas web pós-deploy |

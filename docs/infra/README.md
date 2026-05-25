# Infraestrutura — Fase 1

Fundação de entrega do InsureFlow: Git, ambientes, PostgreSQL remoto, deploy (Vercel + Railway), CI/CD, seeds e checklists.

| Documento | Conteúdo |
|-----------|----------|
| [git-strategy.md](git-strategy.md) | Branches, PRs, squash merge, política de migrations |
| [environments.md](environments.md) | Variáveis por ambiente (DATABASE, JWT, AUTH, STORAGE, CORS) |
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
2. Deploy API no Railway → `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`
3. Deploy Web na Vercel → `AUTH_SECRET`, `API_INTERNAL_URL`
4. Rodar `prisma migrate deploy` no release da API
5. Rodar seed apenas em ambientes não-produtivos

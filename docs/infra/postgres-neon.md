# PostgreSQL remoto

Provider preferencial: **Neon** (alternativas: Supabase, Railway Postgres).

## Neon — setup

1. Criar projeto em [neon.tech](https://neon.tech)
2. Criar branch `main` (prod) e branches `dev` / `staging` (opcional)
3. Copiar duas connection strings:
   - **Pooled** (host `-pooler`) → `DATABASE_URL` na API
   - **Direct** (sem pooler) → migrations / CI

```env
# API runtime (pooled)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/insureflow?sslmode=require

# Migrations only (direct) — CI / release command
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/insureflow?sslmode=require
```

## Connection pooling

| Contexto | URL |
|----------|-----|
| NestJS / Prisma Client (runtime) | Pooled (`-pooler`) |
| `prisma migrate deploy` | Direct (sem pooler) |
| `prisma migrate dev` (local) | Direct ou localhost |

Neon usa PgBouncer em modo transaction. Evite prepared statements long-lived — Prisma 6 lida bem com pooled URLs.

## Prisma migrate deploy

```bash
# Local contra Neon dev
APP_ENV=development DATABASE_URL="$DATABASE_URL_DIRECT" npm run db:deploy

# Railway produção (Docker): `prisma migrate deploy` roda no boot via
# `apps/api/scripts/start-release.cjs` (CMD da imagem — ver `apps/api/Dockerfile`).
# Não depende de `npm run start:release -w api` no painel.

# Local após build (opcional, paridade com release script):
npm run start:release -w api
```

**Nunca** rodar `prisma migrate dev` contra Neon prod/staging.

## Backup strategy

| Provider | Backup | Retenção sugerida |
|----------|--------|-------------------|
| Neon (Free/Pro) | Point-in-time restore (Pro) / snapshots | 7–30 dias |
| Supabase | Daily backups (plan-dependent) | 7 dias |
| Railway | Volume snapshots | Manual semanal |

### Runbook mínimo

1. Antes de migration destrutiva: export manual (`pg_dump`) ou snapshot Neon
2. Documentar horário e autor no PR
3. Testar restore em branch Neon isolada antes de prod

## Supabase / Railway (alternativa)

Mesma estratégia:

- URL pooled para runtime
- URL direct para migrations
- `sslmode=require` em cloud

Railway Postgres expõe `DATABASE_URL` automaticamente — usar como direct; habilitar connection pooling no plugin se disponível.

## Health check

API expõe:

- `GET /api/v1/health` — liveness
- `GET /api/v1/health/db` — conectividade PostgreSQL

Railway usa `/api/v1/health` como healthcheck path.

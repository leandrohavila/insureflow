# InsureFlow

Monorepo enterprise para corretoras de seguros — Turbo · NestJS · Next.js · Prisma · PostgreSQL.

## Apps

| App | Stack | Porta |
|-----|-------|-------|
| `apps/web` | Next.js 16 | 3000 |
| `apps/api` | NestJS 11 | 4000 |
| `packages/database` | Prisma 6 | — |

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

Login demo: `admin@insureflow.com` / `Admin@2026!`

## Infraestrutura (Fase 1)

Documentação completa em [`docs/infra/`](docs/infra/README.md):

- [Git strategy](docs/infra/git-strategy.md) — `main` / `develop`, squash merge, migrations
- [Environments](docs/infra/environments.md) — DATABASE, JWT, AUTH, CORS, STORAGE
- [PostgreSQL / Neon](docs/infra/postgres-neon.md) — pooling, backup, migrate deploy
- [CI/CD](docs/infra/ci-cd.md) — GitHub Actions
- [Release checklists](docs/infra/release-checklists.md)
- [QA deploy](docs/infra/qa-deploy.md)

## Scripts

```bash
npm run dev              # web + api (turbo)
npm run ci               # paridade com GitHub Actions
npm run db:migrate       # prisma migrate dev
npm run db:deploy        # prisma migrate deploy
npm run db:seed          # tenant + users
npm run db:seed:dev      # + CRM demo (leads, deals, customers, policies)
npm run db:validate      # validar schema Prisma
```

## Deploy

| Serviço | Plataforma | Config |
|---------|------------|--------|
| Web | Vercel | `apps/web/vercel.json` |
| API | Railway | `apps/api/railway.toml` + `Dockerfile` |
| DB | Neon | ver `docs/infra/postgres-neon.md` |

## Documentação de produto

[`docs/README.md`](docs/README.md) — domínio, ADRs, UX operacional.

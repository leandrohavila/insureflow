# CI/CD — GitHub Actions

Workflow: `.github/workflows/ci.yml`

## Triggers

- Push em `main` e `develop`
- Pull requests para `main` e `develop`

## Jobs

| Step | Comando | Objetivo |
|------|---------|----------|
| Checkout | `actions/checkout@v4` | Código |
| Node 22 | `actions/setup-node@v4` | Runtime + cache npm |
| Install | `npm ci` | Dependências + postinstall (prisma generate) |
| Lint | `npm run lint` | ESLint monorepo |
| Typecheck | `npm run check-types` | TypeScript |
| Prisma validate | `npm run db:validate` | Schema + migrations íntegros |
| Build web | `npx turbo run build --filter=web` | Next.js production build |
| Build api | `npx turbo run build --filter=api` | NestJS dist |

## Secrets (futuro — deploy workflow)

Não necessários para CI de build. Para deploy automatizado (Fase 2):

| Secret | Uso |
|--------|-----|
| `NEON_DATABASE_URL_DIRECT` | migrate deploy em release |
| `RAILWAY_TOKEN` | Deploy API |
| `VERCEL_TOKEN` | Deploy web |

## Branch protection

Associar check `CI / ci` como required status check em `main` e `develop`.

## Local parity

Reproduzir CI antes de abrir PR:

```bash
npm ci
npm run lint
npm run check-types
npm run db:validate
npx turbo run build --filter=web --filter=api
```

# First DEV cloud deploy

Runbook para o primeiro deploy remoto (Neon + Railway + Vercel).

## Pré-requisitos

- [ ] `npm run ci` verde localmente
- [ ] Conta [Neon](https://neon.tech), [Railway](https://railway.app), [Vercel](https://vercel.com)
- [ ] GitHub repo: `leandrohavila/insureflow`
- [ ] Branches `main` e `develop` criadas

## 1. Neon (PostgreSQL)

1. Criar projeto `insureflow-dev`
2. Database: `insureflow`
3. Copiar connection strings:
   - **Pooled** → `DATABASE_URL` (Railway runtime)
   - **Direct** → `DATABASE_URL_DIRECT` (migrations)

```bash
# Testar migrations (local, com URL direct)
APP_ENV=development DATABASE_URL="<DIRECT_URL>" npm run db:deploy
APP_ENV=development DATABASE_URL="<DIRECT_URL>" npm run db:seed
APP_ENV=development SEED_DEV_DATA=1 DATABASE_URL="<DIRECT_URL>" npm run db:seed:dev
```

## 2. Railway (API)

1. New Project → Deploy from GitHub repo
2. Service: Dockerfile path `apps/api/Dockerfile`, root = monorepo root
3. Variables:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled URL |
| `DATABASE_URL_DIRECT` | Neon direct URL |
| `JWT_SECRET` | 32+ chars random |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_DAYS` | `7` |
| `CORS_ORIGIN` | URL Vercel (atualizar após step 3) |
| `PORT` | `4000` |
| `REDIS_URL` | Railway Redis plugin (opcional dev) |

4. Healthcheck: `/api/v1/health` (configurado em `railway.toml`)
5. Start: `node scripts/start-release.cjs` (migrate + boot)

Validar:

```bash
curl https://<railway-api>.up.railway.app/api/v1/health
curl https://<railway-api>.up.railway.app/api/v1/health/db
```

## 3. Vercel (Web)

1. Import GitHub repo
2. **Root Directory**: `apps/web`
3. Framework: Next.js (auto)
4. Environment variables:

| Variable | Valor |
|----------|-------|
| `AUTH_SECRET` | 32+ chars random |
| `API_INTERNAL_URL` | Railway API URL |
| `NODE_ENV` | `production` |

5. `vercel.json` já define install/build monorepo

Validar build preview antes de promote.

## 4. Fechar loop CORS

Após obter URL Vercel preview/production:

```
CORS_ORIGIN=https://<vercel-app>.vercel.app
```

Redeploy Railway API.

## 5. Smoke test pós-deploy

| Check | URL / ação |
|-------|------------|
| Health | `GET /api/v1/health` → 200 |
| DB | `GET /api/v1/health/db` → 200 |
| Login | `admin@insureflow.com` / `Admin@2026!` |
| CRM deals | `/crm/negocios` — pipeline com seed |
| Leads | `/leads` |
| Customers | `/crm/clientes` |
| Activities | `/crm/atividades` |
| BFF | Network tab — `/api/crm/deals` → 200 |

## URLs DEV (Fase Infra 1.2 — preencher após deploy)

| Serviço | URL | Status |
|---------|-----|--------|
| Web (Vercel) | `https://_____________.vercel.app` | pendente |
| API (Railway) | `https://_____________.up.railway.app` | pendente |
| Neon branch | `insureflow-dev` | pendente |
| Redis | Railway plugin / Upstash | pendente |

Smoke test automatizado (após deploy):

```bash
API_URL=https://<railway-api>.up.railway.app WEB_URL=https://<vercel-app>.vercel.app node scripts/dev-cloud-smoke.cjs
```

## Logs a monitorar

**Railway**

```
[start-release] Running prisma migrate deploy...
[start-release] Starting API...
HTTP + Swagger ...
```

Erros comuns: `P1001` (DB URL wrong), `JWT_SECRET` missing, CORS blocked.

**Vercel**

- Build: `✓ Compiled successfully`
- Runtime: `AUTH_SECRET must be set` → configurar env

## Staging checklist (próxima fase)

Ver [release-checklists.md](release-checklists.md) — staging exige:

- [ ] Branch Neon dedicada (`staging`)
- [ ] `SEED_DEV_DATA=0`
- [ ] Domínio custom
- [ ] Redis produção
- [ ] Branch protection `main` + required CI
- [ ] Backup Neon PITR habilitado

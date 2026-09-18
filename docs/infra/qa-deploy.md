# QA deploy

## Local

```bash
cp .env.local.example .env.local
docker compose up -d
npm ci
npm run db:deploy
npm run db:seed
npm run db:seed:dev
npm run dev
```

| Check | Como validar | Esperado |
|-------|--------------|----------|
| Prisma generate | `npm run db:generate` | Client em `node_modules/.prisma` |
| Hot reload | Editar controller + salvar | API reinicia (watch) |
| Next dev | Abrir `http://localhost:3000` | Dashboard carrega |
| Auth | Login `admin@insureflow.com` | Sessão + redirect dashboard |
| API health | `curl localhost:4000/api/v1/health` | `{"status":"ok"}` |
| DB health | `curl localhost:4000/api/v1/health/db` | `database: connected` |
| CRM data | Pipeline negócios | Deals seed visíveis |
| Next build | `npx turbo run build --filter=web` | Exit 0 |

## Dev cloud

Pré-requisitos: Neon dev branch, Railway API, Vercel preview.

| Check | Como validar |
|-------|--------------|
| Migrations remotas | `DATABASE_URL=$DIRECT npm run db:deploy` |
| API health | `curl $API_URL/api/v1/health` |
| CORS | Login via Vercel preview sem erro CORS |
| Auth cookies | `secure: true` em HTTPS |
| BFF proxy | Network tab — `/api/crm/deals` → 200 |
| Seed (dev only) | Dados demo após `db:seed:dev` |

## Staging / Production

Mesmos checks de dev cloud, **sem** `SEED_DEV_DATA`.

Adicional:

- [ ] Rate limit não bloqueia uso normal
- [ ] JWT refresh funciona após 15min
- [ ] Logs sem stack traces de Prisma connection
- [ ] Backup Neon verificado na semana do deploy

## Comandos úteis

```bash
# Paridade CI
npm run ci

# Release local simulado
npm run build
npm run start:release -w api

# Validar schema
npm run db:validate
```

# Pré-deploy checklist — RELEASE-001

**Data:** 2026-08-24  
**Ticket:** PRE-DEPLOY REL-001  
**Branch alvo:** `release/crm-operacao-avila`  
**Hash esperado:** `17d1645a7471516eb4b3c7961c96c431a73266d5`  
**Ambientes:** Railway (API) + Vercel (Web)  
**Restrição:** **nenhum deploy executado** nesta validação

---

## Veredicto final

# READY FOR DEPLOY

A release Git está correta (branch, hash, sync remota) e o tip contém o escopo R1 (UX-002 + CRM-IMOB-001 + API properties + migrations). Não há drift de código R1 no working tree.

Há **WARNINGs** operacionais (CLI Railway ausente, Vercel CLI deslogada, working tree sujo com R2/R3/artefatos). Nenhum é **BLOCKER** de conteúdo da release: o deploy pode seguir pelo **dashboard** Railway/Vercel apontando o commit `17d1645`.

---

## Resumo por item

| # | Item | Status |
|---|------|--------|
| 1 | Branch = `release/crm-operacao-avila` | **OK** |
| 2 | HEAD = `17d1645…` | **OK** |
| 3 | Arquivos modificados não commitados | **WARNING** |
| 4 | Sync local ↔ remote | **OK** |
| 5 | `railway.toml` / serviços | **OK** (com WARNING de comentário) |
| 6 | Variáveis de ambiente API | **OK** (checklist documentado) |
| 7 | Migrations Prisma | **WARNING** (verificar no boot) |
| 8 | Comandos de deploy documentados | **OK** |
| 9 | Deploy **não** executado | **OK** |
| — | Credenciais CLI (Railway / Vercel) | **WARNING** |

---

## 1. Branch atual

| Campo | Valor |
|-------|-------|
| **Status** | **OK** |
| Branch | `release/crm-operacao-avila` |
| Evidência | `git branch --show-current` |

---

## 2. Hash HEAD

| Campo | Valor |
|-------|-------|
| **Status** | **OK** |
| HEAD | `17d1645a7471516eb4b3c7961c96c431a73266d5` |
| Short | `17d1645` |
| Esperado | `17d1645a7471516eb4b3c7961c96c431a73266d5` |
| Match | **Sim** |
| Tip message | `docs(rel001): align report hash to release tip` |

---

## 3. Working tree (não commitados)

| Campo | Valor |
|-------|-------|
| **Status** | **WARNING** |
| Entradas `git status` | ~66 (2 modificados + untracked) |
| Drift em paths R1 críticos (`apps/web`, `apps/api` código, `packages/auth`, `packages/database`, `railway.toml`, monorepo) | **Nenhum** (`git diff HEAD --` nesses paths = vazio) |
| Único untracked sob `apps/api` | `apps/api/tsc.log` (**excluir** — não versionar) |

### Modificados (não-R1)

| Path | Nota |
|------|------|
| `docs/infra/prod-clean-demo-data.md` | R3 / ops |
| `docs/technical-debt/README.md` | R3 |

### Untracked relevantes (fora do deploy R1)

| Grupo | Exemplos |
|-------|----------|
| Release 2 | `apps/portal-imobiliario-publico/`, docs portal |
| Release 3 | `docs/reports/bug-*`, `sprint*`, `docs/ux/`, `docs/ui/`, ADRs |
| Exclusões | `packages/forms-engine/dist-test/`, `*.tsbuildinfo`, `railway-diagnose-out.txt`, `vercel.json` (raiz experimental) |

**Impacto no deploy:** nenhum. O tip `17d1645` já contém o artefato publicável. Working tree sujo **não** entra no build Railway/Vercel baseado no commit GitHub.

---

## 4. Sync local ↔ remote

| Campo | Valor |
|-------|-------|
| **Status** | **OK** |
| Local HEAD | `17d1645a7471516eb4b3c7961c96c431a73266d5` |
| `origin/release/crm-operacao-avila` | `17d1645a7471516eb4b3c7961c96c431a73266d5` |
| Ahead / behind | **0 / 0** (após `git fetch`) |
| Tracking | `origin/release/crm-operacao-avila` |

---

## 5. Railway — config e serviços

| Campo | Valor |
|-------|-------|
| **Status** | **OK** (+ WARNING documental) |

### Arquivos

| Path | Papel |
|------|-------|
| `/railway.toml` (raiz) | **Canônico** — Config file no dashboard |
| `/apps/api/railway.toml` | Legado; preferir o da raiz |

### `/railway.toml` (raiz) — validado

| Chave | Valor |
|-------|-------|
| Builder | `DOCKERFILE` |
| Dockerfile | `apps/api/Dockerfile` |
| Watch | `apps/api/**`, `packages/database/**`, `scripts/**`, lockfiles |
| `startCommand` | **ausente** (CMD do Docker → `start-release.cjs`) |
| Healthcheck | `/api/v1/health` (timeout 120s) |
| Restart | `ON_FAILURE` (max 3) |
| Env build-in | `NODE_ENV=production`, `PORT=4000` |

### Serviços documentados (INFRA-004 / INFRA-006)

| Serviço | ID / nome | Papel |
|---------|-----------|-------|
| API | `insureflow-api` (`6c04caad-…`) | Nest + migrate no boot |
| Redis | `Redis` (`3862b7f4-…`) | BullMQ / `REDIS_URL` |
| Projeto | `thorough-spirit` | production |
| Domínio API | `https://api.corretoraavila.com.br` | custom domain |

**WARNING:** comentário no `railway.toml` ainda cita `Branch: develop`. O trigger operacional documentado é `release/crm-operacao-avila` (autodeploy off → deploy explícito). Confirmar no dashboard antes do clique.

### Probe HTTP (somente leitura, agora)

| URL | Resultado |
|-----|-----------|
| `GET https://api.corretoraavila.com.br/api/v1/health` | **200** |
| `GET https://corretoraavila.com.br/login` | **200** |

*(Build em produção ainda pode ser anterior a `17d1645` — este check só prova que os edges estão no ar.)*

---

## 6. Variáveis de ambiente — API (produção)

| Campo | Valor |
|-------|-------|
| **Status** | **OK** (lista obrigatória conhecida; valores secrets **não** lidos nesta tarefa) |

### Obrigatórias

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres Neon (pooled) — runtime Prisma |
| `DATABASE_URL_DIRECT` | Neon direct — `prisma migrate deploy` |
| `REDIS_URL` | Redis Railway (`${{Redis.REDIS_URL}}`) |
| `JWT_SECRET` | Auth API (≥ 32 chars) |
| `CORS_ORIGIN` | `https://corretoraavila.com.br,https://www.corretoraavila.com.br` |
| `API_PUBLIC_URL` | `https://api.corretoraavila.com.br` |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `APP_ENV` | `production` |

### Recomendadas / já usadas em prod (INFRA-004)

| Variável | Valor típico |
|----------|--------------|
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_DAYS` | `7` |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | `60` / `100` |
| `OWNERSHIP_ENFORCEMENT` | `on` (ou política vigente) |
| `SEED_DEV_DATA` | `0` |

### Opcionais R1

| Variável | Nota |
|----------|------|
| `PROPERTY_UPLOADS_DIR` | Upload de fotos de imóveis; default interno se omitido |

### Web (Vercel) — necessárias para o BFF após deploy frontend

| Variável | Valor prod |
|----------|------------|
| `AUTH_SECRET` | ≥ 32 chars |
| `API_INTERNAL_URL` | `https://api.corretoraavila.com.br` |

---

## 7. Migrations Prisma

| Campo | Valor |
|-------|-------|
| **Status** | **WARNING** |

### No tip `17d1645` (repo)

**29** pastas em `packages/database/prisma/migrations/`, incluindo R1:

1. `20260824140000_real_estate_inventory`
2. `20260824180000_re004_property_production`

### Histórico produção (INFRA-005 / INFRA-006)

- INFRA-005 aplicou as 14 pendentes (inclui as 2 R1 acima).
- INFRA-006 boot: `27 migrations found` → `No pending migrations to apply.`

**Expectativa neste redeploy `17d1645`:** `migrate deploy` no boot deve ser **no-op** (0 pendentes), **salvo** se o Neon de produção divergir do estado documentado.

**Não verificado agora:** `_prisma_migrations` live no Neon (sem `railway run` / sem secrets nesta máquina).

### Como a migrate roda no release

Entrypoint Docker: `apps/api/scripts/start-release.cjs`

```text
npm run db:deploy -w @repo/database   # = prisma migrate deploy
node dist/main.js
```

---

## 8. Comandos exatos (NÃO executados)

### A) Deploy da API no Railway

**Opção 1 — Dashboard (recomendado sem CLI local)**

1. Railway → projeto `thorough-spirit` → environment `production` → service `insureflow-api`
2. Confirmar branch GitHub: `release/crm-operacao-avila`
3. Confirmar commit: `17d1645a7471516eb4b3c7961c96c431a73266d5`
4. **Deploy** / **Deploy Latest Commit** (autodeploy está off)

**Opção 2 — CLI** (requer `npm i -g @railway/cli` + `railway login`)

```powershell
cd C:\Projetos\InsureFlow
npx @railway/cli link -p thorough-spirit -e production -s insureflow-api
npx @railway/cli up --detach -m "REL-001: deploy release/crm-operacao-avila 17d1645"
```

Referência histórica INFRA-006 (upload explícito):

```powershell
npx @railway/cli deployment up --detach -y
```

### B) `prisma migrate deploy`

**Automático (preferido):** ocorre no boot do container via `start-release.cjs` após o deploy da API.

**Manual (se precisar forçar sem restart completo da app):**

```powershell
cd C:\Projetos\InsureFlow
npx @railway/cli link -p thorough-spirit -e production -s insureflow-api
npx @railway/cli run -- npm run db:deploy -w @repo/database
```

Equivalente local (somente com `DATABASE_URL` / `DATABASE_URL_DIRECT` de produção injetados — **não** usar DB local):

```powershell
npm run db:deploy -w @repo/database
```

**Proibido em produção:** `prisma migrate dev`, `migrate reset`, `db push`.

### C) Deploy do frontend no Vercel

**Opção 1 — Dashboard (recomendado com CLI deslogada)**

1. Vercel → projeto `web` (Root Directory `apps/web`)
2. Production deploy a partir de `release/crm-operacao-avila` @ `17d1645`
3. Confirmar env: `AUTH_SECRET`, `API_INTERNAL_URL=https://api.corretoraavila.com.br`
4. Redeploy Production

**Opção 2 — CLI** (requer login ou `VERCEL_TOKEN`)

```powershell
cd C:\Projetos\InsureFlow\apps\web
npx vercel login
npx vercel --prod --yes
```

Com token:

```powershell
cd C:\Projetos\InsureFlow\apps\web
npx vercel --prod --yes --token $env:VERCEL_TOKEN
```

Build esperado (`apps/web/vercel.json`): `cd ../.. && npx turbo run build --filter=web`, região `gru1`.

### Ordem sugerida

```text
1. Railway API @ 17d1645  →  boot com migrate deploy
2. Validar GET /api/v1/health (+ /health/db, /health/redis)
3. Vercel Web @ 17d1645
4. Smoke HML-001 em produção (login Grupo Ávila, BU imóveis, /real-estate/*)
```

---

## 9. Deploy executado nesta tarefa?

| Campo | Valor |
|-------|-------|
| **Status** | **OK** |
| Deploy Railway | **Não** |
| `prisma migrate deploy` | **Não** |
| Deploy Vercel | **Não** |

---

## 10. Credenciais CLI (workstation)

| Ferramenta | Estado | Status |
|------------|--------|--------|
| Railway CLI | **Não instalado** (`railway` não encontrado) | **WARNING** |
| Vercel CLI | Presente (59.5.0) mas **Logged out**; sem `VERCEL_TOKEN` | **WARNING** |

Não bloqueiam deploy via **dashboard**. Bloqueiam apenas automação CLI nesta máquina.

---

## Motivos do veredicto

### Por que **READY FOR DEPLOY**

1. Branch e hash corretos e iguais ao remote.
2. Tip R1 completo (web + auth + API + migrations + docs REL-001).
3. Sem alterações não commitadas em paths de runtime R1.
4. `railway.toml` e Dockerfile/start-release alinhados ao fluxo de produção.
5. Edges API/Web respondem 200 (infra base no ar).
6. Comandos de publish documentados e testados em tickets INFRA anteriores.

### WARNINGs (não bloqueiam o clique de deploy)

1. Working tree sujo com R2/R3/artefatos — ignorar no deploy do tip.
2. Railway CLI ausente / Vercel deslogada — usar dashboard ou autenticar antes.
3. Comentário `Branch: develop` no `railway.toml` vs branch real de release.
4. Estado live de `_prisma_migrations` não revalidado agora — confiar no boot `start-release` + logs.

### BLOCKERS

**Nenhum** identificado para conteúdo/Git da RELEASE-001.

---

## Assinatura

| Campo | Valor |
|-------|-------|
| **Classificação** | **READY FOR DEPLOY** |
| **Branch** | `release/crm-operacao-avila` |
| **Hash** | `17d1645a7471516eb4b3c7961c96c431a73266d5` |
| **Deploy nesta tarefa** | **Não executado** |

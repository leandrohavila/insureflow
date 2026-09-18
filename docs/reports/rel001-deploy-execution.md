# REL-001 — Deploy Execution (Produção)

**Ticket:** REL-001 Deploy  
**Branch:** `release/crm-operacao-avila`  
**Hash alvo / implantado (API):** `17d1645a7471516eb4b3c7961c96c431a73266d5`  
**Pré-deploy:** [`pre-deploy-checklist-rel001.md`](pre-deploy-checklist-rel001.md)

---

## Status final (atualizado — auditoria Vercel REL-001)

# DEPLOY FAILED (API OK · Web pendente)

| Camada | Status |
|--------|--------|
| API Railway @ `17d1645` | **RELEASED** (`b9298c04`) |
| Web Vercel @ `17d1645` | **PENDENTE** |
| Veredicto web (esta auditoria) | **WEB DEPLOY BLOCKED** |

**Causa do bloqueio web:** autenticação Vercel ausente nesta workstation (`vercel whoami` → Logged out; `VERCEL_TOKEN` ausente; dashboard redireciona para `/login`). Nenhuma configuração foi alterada automaticamente nesta tarefa.

**Pré-requisitos técnicos para publicar `17d1645`:** atendidos (projeto identificado, root `apps/web`, build monorepo documentado, branch remota no hash, env mínimas funcionando em runtime). Após login Vercel, o caminho recomendado é **CLI deploy** (integração Git no painel aparenta desconectada).

---

## Status final (execução inicial)

# DEPLOY FAILED

| Etapa | Resultado |
|-------|-----------|
| Confirmação hash `17d1645` | **OK** |
| Deploy API Railway | **SUCCESS** |
| Startup / health | **SUCCESS** |
| Banco + Redis | **SUCCESS** |
| `prisma migrate deploy` (boot) | **SUCCESS** (0 pendentes) |
| Deploy frontend Vercel | **FAILED** |
| Build / publicação web | **Não executado** |
| Smoke test produção | **Não executado** (bloqueado pelo Vercel) |

**Motivo da interrupção:** autenticação Vercel ausente nesta workstation (`vercel whoami` → Logged out; `VERCEL_TOKEN` ausente). Dashboard Vercel redirecionou para `/login`. Sem credenciais não foi possível publicar o frontend no hash `17d1645`.

**Estado parcial:** a **API de produção** já está no deployment Railway `b9298c04` com tip `17d1645`, migrations aplicadas (no-op) e health OK. O **frontend** em `corretoraavila.com.br` **não** foi republicado nesta execução.

---

## Linha do tempo

| Marco | Data/hora |
|-------|-----------|
| **Início** | `2026-08-24T21:58:51-03:00` |
| Hash confirmado | `21:58` |
| Railway `up` enviado | `~22:00` |
| Migrations + Nest up | `22:03:30` (−03) / `2026-08-25T01:03:30Z` |
| API Online (`b9298c04`) | `22:04:03-03:00` |
| Health DB/Redis validados | `22:07` |
| Tentativa Vercel CLI | `22:07` → **Logged out** |
| Tentativa dashboard Vercel | `22:08` → **Login required** |
| **Término (interrupção)** | `2026-08-24T22:09:36-03:00` |

---

## 1. Confirmação pré-deploy

| Check | Resultado |
|-------|-----------|
| Branch | `release/crm-operacao-avila` |
| `git rev-parse HEAD` | `17d1645a7471516eb4b3c7961c96c431a73266d5` |
| `origin/release/crm-operacao-avila` | Mesmo hash (sincronizado) |
| Worktree limpa para upload | `C:\Projetos\InsureFlow-rel001-deploy` @ `17d1645` (detached) |

---

## 2. Resultado Railway (API)

| Campo | Valor |
|-------|-------|
| **Resultado** | **SUCCESS** |
| Projeto | `thorough-spirit` |
| Environment | `production` |
| Serviço | `insureflow-api` (`6c04caad-…`) |
| **Deployment ID** | `b9298c04-cb37-4d23-97a7-b5066fef6592` |
| Método | `npx @railway/cli up --detach -m "REL-001: deploy release/crm-operacao-avila 17d1645"` (worktree limpa) |
| Status final | **Online** |
| URL | `https://api.corretoraavila.com.br` |
| Build logs | https://railway.com/project/645fb36c-1714-408c-a927-ffdf838ed780/service/6c04caad-c270-4ab8-91a6-7c47cba59d87?id=b9298c04-cb37-4d23-97a7-b5066fef6592 |

### Startup (trechos relevantes)

```text
[start-release] Running prisma migrate deploy...
29 migrations found in prisma/migrations
No pending migrations to apply.

[RedisBootstrapService] [redis] Configurado redis.railway.internal:6379
[RedisBootstrapService] [redis] Conexão OK (PING PONG) — filas BullMQ podem subir
[NestApplication] Nest application successfully started
```

### Health pós-deploy

| Endpoint | HTTP | Evidência |
|----------|------|-----------|
| `/api/v1/health` | **200** | `status: ok` |
| `/api/v1/health/db` | **200** | `database: connected` |
| `/api/v1/health/redis` | **200** | `redis: connected` @ `redis.railway.internal:6379` |
| `/api/v1/health/runtime` | **200** | `environment: production`, `startedAt: 2026-08-25T01:03:28.605Z`, `commit: unknown` (imagem sem `.git`) |

Redis Railway: **Online**. Postgres Railway volume: Offline (esperado — DB é Neon via `DATABASE_URL`).

---

## 3. Resultado Migrations

| Campo | Valor |
|-------|-------|
| **Resultado** | **SUCCESS** |
| Mecanismo | Automático no boot (`apps/api/scripts/start-release.cjs` → `npm run db:deploy -w @repo/database`) |
| Migrations no container | **29** |
| Pendentes | **0** (`No pending migrations to apply.`) |
| Comando manual extra | **Não necessário** |

Inclui as migrations R1:

- `20260824140000_real_estate_inventory`
- `20260824180000_re004_property_production`

---

## 4. Resultado Vercel (Web)

| Campo | Valor |
|-------|-------|
| **Resultado** | **FAILED** |
| Hash desejado | `17d1645` |
| CLI | `npx vercel whoami` → **Logged out** |
| `VERCEL_TOKEN` | **Ausente** |
| Auth files locais | Nenhum (`~\.vercel\auth.json` etc. missing) |
| Projeto linkado (histórico) | `apps/web/.vercel/project.json` → `prj_FUVhs…` / team `team_ynsUz…` / name `web` |
| Dashboard | Overview abriu parcialmente; `/deployments` redirecionou para **https://vercel.com/login** |
| Deploy executado | **Não** |
| Build produção `17d1645` | **Não** |

### Erro detalhado

```text
Vercel CLI 59.5.0
> Logged out.
> Run `vercel deploy --temporary` … or `vercel login` to log in.

Dashboard: Login – Vercel (session required for Deployments)
```

### Ação necessária para retomar (não executada)

```powershell
# 1) Autenticar
npx vercel login
# ou definir VERCEL_TOKEN no ambiente

# 2) Deploy produção a partir do tip limpo
cd C:\Projetos\InsureFlow-rel001-deploy\apps\web
# (ou main repo apps/web no commit 17d1645)
npx vercel --prod --yes
```

Alternativa dashboard (após login): projeto `web` → Production deploy da branch `release/crm-operacao-avila` @ `17d1645`.

---

## 4b. Auditoria Vercel — finalizar deploy web (2026-08-24)

**Veredicto:** **WEB DEPLOY BLOCKED**  
**Causa:** credenciais Vercel indisponíveis nesta máquina (CLI + browser). Configurações **não** alteradas.

### 1. Projeto Vercel correto (`corretoraavila.com.br`)

| Campo | Valor | Evidência |
|-------|-------|-----------|
| **Projeto** | `web` | `apps/web/.vercel/project.json`, go-live |
| **Project ID** | `prj_FUVhsDXndV1r4H9WxfJM7m3YesDr` | `.vercel/project.json` |
| **Team ID** | `team_ynsUzrapjLaJxTV3ThqzZdUT` | `.vercel/project.json` |
| **Dashboard** | https://vercel.com/team_ynsUzrapjLaJxTV3ThqzZdUT/web | URL direta |
| **Domínio apex** | `corretoraavila.com.br` | `Server: Vercel`, `X-Vercel-Id: gru1::…` |
| **Região edge** | `gru1` | Header + `apps/web/vercel.json` |
| **DNS apex** | `76.76.21.21` (Vercel) | [`go-live-production.md`](../infra/go-live-production.md) |
| **www** | CNAME → `cname.vercel-dns.com`, **308** → apex | `vercel.json` redirects |

### 2. Integração GitHub

| Campo | Valor | Status |
|-------|-------|--------|
| Repositório Git | `leandrohavila/insureflow` | Confirmado (`git remote`) |
| Branch release @ `17d1645` | `origin/release/crm-operacao-avila` | **OK** (push feito em REL-001) |
| Integração Git no Vercel | **Aparenta desconectada** | Overview do projeto exibiu botão **“Connect Git Repository”** (sessão parcial) |
| `/settings/git` | **Login required** | Redirecionou para `vercel.com/login` |
| CI GitHub → Vercel | **Não** | `.github/workflows` sem deploy Vercel |

**Impacto:** deploy via **dashboard Git** exige reconectar o repo antes. Deploy via **CLI** (`vercel --prod`) **não depende** da integração Git.

### 3. Branch Production (Vercel)

| Campo | Valor |
|-------|-------|
| **Confirmada no painel** | **Não** (login required) |
| **Branch desejada REL-001** | `release/crm-operacao-avila` |
| **Commit desejado** | `17d1645a7471516eb4b3c7961c96c431a73266d5` |

Se reconectar Git: configurar Production Branch = `release/crm-operacao-avila` (ou `main` se política do time exigir merge prévio — **não alterado nesta tarefa**).

### 4. Último deployment em produção

| Campo | Valor |
|-------|-------|
| **Commit em produção (inferido)** | **Anterior a `47702a5`** (~29/05/2026) |
| **Hash alvo REL-001** | `17d1645` — **não publicado** |
| **Cache Age `/login`** | ~`2208655` s (**~25,6 dias**) |
| **Branding produção** | InsureFlow mock (AUD-001): KPIs 2.847/186/1.902 |
| **Rotas R1** | `/real-estate/*` → **307** (build antigo) |
| **Overview Vercel (parcial)** | Exibiu **“No Production Deployment”** + CTA Git — possível estado desincronizado do painel vs domínio alias |

### 5. Root Directory

| Fonte | Valor |
|-------|-------|
| Go-live / runbooks | **`apps/web`** |
| `apps/web/.vercel/project.json` | `rootDirectory: null` (link local feito **de dentro** de `apps/web`) |
| `apps/web/vercel.json` | Install/build sobem ao monorepo (`cd ../..`) |
| `vercel.json` (raiz repo) | Experimental — **não usar** para este projeto |

**Confirmado:** o projeto **`web`** deve usar root **`apps/web`** no dashboard Vercel.

### 6. Projeto aponta para `apps/web`?

**Sim** — evidências convergentes:

- Nome do projeto: `web`
- Build: `cd ../.. && npx turbo run build --filter=web`
- Output: `.next` relativo a `apps/web`
- Domínio `corretoraavila.com.br` aliasado a este projeto (go-live 2026-05-27)

### 7. Variáveis de ambiente

#### Obrigatórias (Production)

| Variável | Valor esperado | Runtime atual | Falta? |
|----------|----------------|---------------|--------|
| `AUTH_SECRET` | ≥ 32 chars | Login page **200**; middleware ativo | **Não detectada** (presumida OK) |
| `API_INTERNAL_URL` | `https://api.corretoraavila.com.br` | BFF parcial OK (WEB-001/AUD-001) | **Não detectada** (presumida OK) |

#### Recomendadas

| Variável | Valor | Falta? |
|----------|-------|--------|
| `API_URL` | Igual a `API_INTERNAL_URL` | **Indeterminado** (fallback opcional) |
| `NODE_ENV` | `production` | Implícito Vercel |

#### Opcionais R1 (CRM imobiliário)

| Variável | Uso | Falta? |
|----------|-----|--------|
| `NEXT_PUBLIC_PORTAL_URL` | URL do portal público em `/real-estate/portal` | **Provável** — default `http://localhost:3002` se omitida |

#### Debug (não necessárias em prod)

`BUG003_DEBUG`, `DEAL_CONTRACT_DEBUG`, `RUNTIME_AUDIT`, `NEXT_PUBLIC_*_DEBUG` — omitir.

**Conclusão env:** nenhuma variável **obrigatória** identificada como ausente pelo runtime atual. Painel Vercel **não inspecionado** (sem login) — validar visualmente após autenticar.

### 8. Procedimento exato para publicar frontend @ `17d1645`

**Pré-condição:** API já em produção @ `17d1645` (**OK** — Railway `b9298c04`).

#### Caminho A — CLI (recomendado; não exige Git conectado)

```powershell
# 1) Autenticar (interativo)
npx vercel login

# 2) Worktree limpa no hash exato (evita upload de R2/R3)
cd C:\Projetos\InsureFlow
git worktree add C:\Projetos\InsureFlow-rel001-web 17d1645a7471516eb4b3c7961c96c431a73266d5
cd C:\Projetos\InsureFlow-rel001-web\apps\web

# 3) Link ao projeto existente (se necessário)
npx vercel link
#   → Team: team_ynsUzrapjLaJxTV3ThqzZdUT
#   → Project: web
#   → Link to existing project: Yes

# 4) Deploy produção
npx vercel --prod --yes

# 5) Validar
#    GET https://corretoraavila.com.br/login  (Grupo Ávila branding)
#    GET https://corretoraavila.com.br/real-estate/properties  (após login)
```

Alternativa com token não-interativo:

```powershell
$env:VERCEL_TOKEN = "<token de https://vercel.com/account/tokens>"
cd C:\Projetos\InsureFlow-rel001-web\apps\web
npx vercel --prod --yes --token $env:VERCEL_TOKEN
```

#### Caminho B — Dashboard (requer login + Git)

1. Login em https://vercel.com/login  
2. Projeto **web** → **Settings → Git** → conectar `leandrohavila/insureflow`  
3. **Settings → Git → Production Branch** → `release/crm-operacao-avila`  
4. **Deployments** → Deploy / Redeploy commit `17d1645`  
5. Confirmar domínio `corretoraavila.com.br` em **Settings → Domains**  
6. Confirmar env Production: `AUTH_SECRET`, `API_INTERNAL_URL`

#### Caminho C — Git push trigger (somente se Git reconectado + autodeploy ON)

Push já feito em `origin/release/crm-operacao-avila` @ `17d1645`. Se integração Git + autodeploy estiverem ativos, um redeploy pode disparar automaticamente — **não confirmado** nesta auditoria.

### 9. Alterações automáticas

| Ação | Executada? |
|------|------------|
| Alterar env Vercel | **Não** |
| Conectar Git | **Não** |
| Alterar Production Branch | **Não** |
| Executar deploy web | **Não** |

### 10. Veredicto web

# WEB DEPLOY BLOCKED

| # | Item | Status |
|---|------|--------|
| 1 | Projeto Vercel identificado | **OK** |
| 2 | Integração GitHub | **WARNING** (aparenta desconectada) |
| 3 | Production Branch | **INDETERMINADO** (login required) |
| 4 | Último deploy vs `17d1645` | **DESATUALIZADO** (~25 dias, pré-`47702a5`) |
| 5 | Root Directory `apps/web` | **OK** |
| 6 | Build monorepo turbo | **OK** (documentado) |
| 7 | Env obrigatórias | **OK** (runtime; painel não lido) |
| 8 | Credenciais Vercel | **BLOCKER** |
| 9 | Deploy executado | **Não** |

**Motivos detalhados do bloqueio:**

1. **BLOCKER:** `vercel whoami` → Logged out; `VERCEL_TOKEN` ausente; dashboard exige login.
2. **WARNING:** integração Git aparenta desconectada — caminho dashboard/Git bloqueado até reconectar.
3. **INFO:** produção serve build antigo; publicar `17d1645` exige novo deploy explícito (CLI ou dashboard pós-login).

**Após autenticação Vercel:** seguir **Caminho A (CLI)** — único procedimento confirmável sem alterar configurações do painel.

---

## 5. Resultado Smoke Test

| Campo | Valor |
|-------|-------|
| **Resultado** | **NÃO EXECUTADO** |
| Motivo | Frontend não republicado; smoke completo (login → dashboard → CRM → propriedades → upload → logout) depende do web @ `17d1645` |

### Checagens parciais (somente leitura, pré-smoke)

| Check | Resultado | Nota |
|-------|-----------|------|
| `GET https://corretoraavila.com.br/login` | **200** | HTML responde; **não** prova build R1 |
| `GET /real-estate/properties` | **307** | Comportamento típico de redirect (login/inexistente); **não** valida CRM-IMOB em prod |
| API health suite | **200** | Backend R1 saudável |

Smoke completo **adiado** até Vercel publicar `17d1645`.

---

## 6. O que ficou em produção

| Camada | Estado pós-interrupção |
|--------|------------------------|
| API Railway | **RELEASED** @ deployment `b9298c04` (código tip `17d1645`) |
| Neon migrations | **Alinhadas** (29 / 0 pendentes) |
| Redis | **Connected** |
| Web Vercel | **NÃO atualizado** nesta run (build anterior permanece no edge) |

---

## 7. Próximos passos para chegar a RELEASED TO PRODUCTION

1. Autenticar Vercel (`vercel login` ou `VERCEL_TOKEN`).
2. Deploy web @ `17d1645` (CLI ou dashboard).
3. Validar build Ready + domínio `corretoraavila.com.br`.
4. Executar smoke: Login → Dashboard → CRM → Propriedades → Upload → Logout.
5. Atualizar este relatório (ou ticket de follow-up) para **RELEASED TO PRODUCTION** se o smoke passar.

---

## Assinatura

| Campo | Valor |
|-------|-------|
| **Hash implantado (API)** | `17d1645a7471516eb4b3c7961c96c431a73266d5` |
| **Início** | `2026-08-24T21:58:51-03:00` |
| **Término** | `2026-08-24T22:09:36-03:00` |
| **Resultado Railway** | **SUCCESS** (`b9298c04`) |
| **Resultado Migrations** | **SUCCESS** (29 found, 0 pending) |
| **Resultado Vercel** | **FAILED** (auth) — auditoria §4b: **WEB DEPLOY BLOCKED** |
| **Resultado Smoke Test** | **NÃO EXECUTADO** |
| **Status final** | **DEPLOY FAILED** (API released; web blocked on Vercel auth) |

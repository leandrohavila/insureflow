# INFRA-001 — Recriar ambiente operacional da Ávila

**Data:** 21 de agosto de 2026  
**Branch:** `release/crm-operacao-avila`  
**Commit:** `47702a5`  
**Escopo:** preparar Railway + Redis + variáveis + Vercel para publicar CRM-003 → CRM-006.4.  
**Não executado:** deploy, migrate, seed, reset, push, alteração de código, alteração de `main`, CRM-007.

---

## Classificação

# BLOCKED

O passo a passo do painel está completo. **Não clique em Deploy ainda.** Dois bloqueios impedem um boot 200 nesta rodada:

| # | Bloqueio | Ação (próxima sessão, com autorização) |
|---|----------|----------------------------------------|
| 1 | Branch **não está no `origin`** | `git push -u origin release/crm-operacao-avila` — Railway não vê o commit `47702a5` |
| 2 | `apps/api/Dockerfile` **não copia** `packages/forms-engine` nem `packages/forms-library` | A API depende de `@repo/forms-engine`; o `prebuild` chama `scripts/ensure-workspace-packages.cjs`. O build Docker deste release **tende a falhar**. Corrigir o Dockerfile é mudança de código — **fora desta tarefa** |

Enquanto isso, **pode** criar no painel (sem Deploy): serviço Redis, serviço API vazio, colar variáveis, **sem** conectar o GitHub até o push + Dockerfile.

**Aviso de migrate:** o `CMD` do Dockerfile é `node scripts/start-release.cjs`, que roda `prisma migrate deploy` **antes** de subir a API. O primeiro Deploy bem-sucedido **aplica as 12 migrations** no Neon. Esta tarefa pediu para **não** migrar ainda — por isso o Deploy fica para o próximo passo explícito.

---

## Respostas (1–7)

### 1. O que precisa ser criado no Railway

Serviço **novo** (não reutilizar o deployment 404):

| Campo | Valor |
|-------|--------|
| Nome do serviço | `insureflow-api` |
| Projeto | o mesmo da Ávila (onde o Redis vai viver) |
| Source | GitHub `leandrohavila/insureflow` |
| Branch | `release/crm-operacao-avila` (**depois** do push) |
| Root Directory | **vazio** (`/`) — nunca `apps/api` |
| Config file | `/railway.toml` (raiz do monorepo) |
| Builder | **Dockerfile** → `apps/api/Dockerfile` |
| Build command | **nenhum** (o Dockerfile faz `npm ci` + `build`) |
| Start Command | **vazio** — obrigatório. O boot é o `CMD` do Docker |
| Healthcheck | `GET /api/v1/health` (já no `railway.toml`, timeout 120s) |
| Porta | `4000` (`PORT` no `railway.toml` `[deploy.env]`) |
| Public Networking | ON |
| Custom domain | `api.corretoraavila.com.br` (reconectar CNAME após o novo `*.up.railway.app`) |

Não criar Start Command `npm start` nem `node dist/main.js` na raiz: isso quebra o `WORKDIR apps/api` e gera 503/404 no edge.

### 2. O que precisa ser criado no Redis

**Serviço Redis no mesmo projeto Railway** (plugin Redis). Não usar Redis externo nesta fase. Não usar `127.0.0.1`. Não usar `REDIS_PUBLIC_URL` na API.

A API **usa Redis de verdade**:

| Uso | Onde |
|-----|------|
| BullMQ | `BullModule.forRootAsync` em `app.module.ts` |
| Fila auditoria | `audit-log` + `AuditQueueProcessor` |
| Fila automação comercial / SLA | `commercial-automation` + scheduler + processor |
| Fila reativação de leads | `lead-reactivation` + scheduler + processor |
| Health | `GET /api/v1/health/redis` |

Workers rodam **dentro do mesmo processo Nest** — não há serviço worker separado.

No canvas: Add service → Database → Redis. Nome típico `Redis`. Na API:

```
REDIS_URL=${{Redis.REDIS_URL}}
```

(trocar `Redis` pelo nome exato do serviço no canvas.)

### 3. Quais variáveis precisam ser configuradas

Ver tabelas das Fases 3 e 5. Resumo API: `DATABASE_URL`, `DATABASE_URL_DIRECT`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `API_PUBLIC_URL`, `OWNERSHIP_ENFORCEMENT`, `NODE_ENV`, `APP_ENV`, `PORT`, `JWT_EXPIRES_IN`, `JWT_REFRESH_DAYS`, `THROTTLE_*`, `SEED_DEV_DATA=0`.  
Web (ainda **não** alterar): `AUTH_SECRET`, `API_INTERNAL_URL`, `API_URL`.

### 4. Quais valores devem ser usados

Secrets: **gerar novos** para JWT. Banco: **o mesmo Neon já inspecionado** (copiar as strings de `.env.development` no painel — não colar senha neste relatório). CORS e URLs: ver Fase 6 e “URL da API” abaixo.

### 5. Qual URL deverá ser utilizada pela API

| Momento | URL |
|---------|-----|
| Temporária (logo após Public Networking) | `https://<serviço>.up.railway.app` |
| Operacional (alvo) | `https://api.corretoraavila.com.br` |

Health: `https://<API>/api/v1/health`  
BFF Vercel e `API_PUBLIC_URL` devem usar a URL **que responder 200**, preferencialmente o custom domain depois de Active.

O fallback antigo `insureflow-production-08c5.up.railway.app` está **404** — não reutilizar.

### 6. Qual configuração deverá ser feita no Vercel

**Não alterar agora.** Quando a API estiver 200:

Projeto web (root `apps/web`, região `gru1`):

| Variável | Valor |
|----------|--------|
| `AUTH_SECRET` | Manter o já existente se ≥ 32 chars; senão gerar outro |
| `API_INTERNAL_URL` | `https://api.corretoraavila.com.br` (ou a URL Railway temporária até o CNAME) |
| `API_URL` | o mesmo que `API_INTERNAL_URL` |

Redeploy da web **depois** da API saudável. Domínio apex `corretoraavila.com.br` permanece.

### 7. Ordem exata das ações

1. Autorizar **push** de `release/crm-operacao-avila` (não `main`).  
2. Corrigir Dockerfile (cópia de `forms-engine` / `forms-library`) numa alteração de código **posterior** — não nesta tarefa.  
3. Railway: criar Redis no projeto.  
4. Railway: criar serviço `insureflow-api` **sem** Deploy ainda, se possível.  
5. Colar variáveis da Fase 3 (`REDIS_URL` por referência; Neon pooled + direct; JWT novo; CORS apex+www; `OWNERSHIP_ENFORCEMENT=on`; `SEED_DEV_DATA=0`).  
6. Conferir: Root `/`, config `/railway.toml`, Start Command **vazio**, `PORT=4000`.  
7. Só então conectar GitHub na branch de release e permitir o primeiro Deploy (**isso aplica migrate**).  
8. Validar `/health`, `/health/db`, `/health/redis`.  
9. Custom domain `api.corretoraavila.com.br` + DNS CNAME.  
10. Vercel: `API_INTERNAL_URL` / `API_URL` + redeploy.  
11. `/login` 200 e `/api/auth/me` 401 sem cookie (sessão ok).  
12. Seed e import real: **ainda não**.

---

## Fase 1 — Railway (mapa do repo)

Arquivo canônico: `/railway.toml` (ignorar o legado `apps/api/railway.toml` no dashboard).

| Item | Valor no repo |
|------|----------------|
| Builder | `DOCKERFILE` |
| Dockerfile | `apps/api/Dockerfile` |
| Root Directory | `/` (vazio) |
| Build command extra | nenhum |
| Start command | **nenhum** (comentado de propósito) |
| Healthcheck | `/api/v1/health` |
| Healthcheck timeout | 120 s |
| Restart | `ON_FAILURE`, máx. 3 |
| `NODE_ENV` via config | `production` |
| `PORT` via config | `4000` |
| Watch | `apps/api/**`, `packages/database/**`, `scripts/**`, lockfiles |

`Dockerfile` (comportamento atual):

- Context: raiz do monorepo  
- Image: `node:20-alpine`  
- `EXPOSE 4000`  
- `WORKDIR /app/apps/api`  
- `CMD ["node", "scripts/start-release.cjs"]` → **`prisma migrate deploy` + `node dist/main.js`**

Cópia atual: `packages/database` + `apps/api` + `scripts` + lockfile. **Não copia** `packages/forms-engine` / `packages/forms-library` (bloqueio de build deste release).

### Passo a passo manual (sem CLI)

1. [railway.app](https://railway.app) → projeto InsureFlow (ou criar projeto **novo** só para Ávila, sem misturar outro produto).  
2. **New** → **Database** → **Redis** (Fase 2). Anotar o nome do serviço.  
3. **New** → **GitHub Repo** → `leandrohavila/insureflow` (só depois do push).  
4. Settings do serviço API:  
   - Service name: `insureflow-api`  
   - Branch: `release/crm-operacao-avila`  
   - Root Directory: *(vazio)*  
   - Config as Code: `/railway.toml`  
5. Settings → **Custom Start Command**: apagar se houver qualquer valor.  
6. Settings → Networking → **Generate domain** (obtém `*.up.railway.app`).  
7. Variables: colar a lista da Fase 3. `REDIS_URL` = referência `${{NomeDoServicoRedis.REDIS_URL}}`.  
8. **Não** Deploy até push + Dockerfile ok + aceite de migrate.  
9. Depois do 200 em `*.up.railway.app`: Settings → Networking → Custom domain `api.corretoraavila.com.br`. No Registro.br, CNAME `api` → o hostname Railway **novo** (o antigo `insureflow-production-08c5` está morto). TXT `_railway-verify.api` se o painel pedir.

CLI `railway` **não está instalada** neste workstation — o painel é o caminho.

---

## Fase 2 — Redis

**Decisão:** serviço Redis **no Railway**, mesmo projeto da API. Não criar agora (esta tarefa não cria). Não Redis Upstash/externo nesta fase.

| Variável | Valor |
|----------|--------|
| `REDIS_URL` | `${{Redis.REDIS_URL}}` (interno) |
| Não usar | `127.0.0.1`, `REDIS_PUBLIC_URL`, URL de outro projeto |

Se Redis falhar, a API **ainda pode subir**; filas (SLA 07:00, reativação, auditoria) degradam. `/health/redis` deve ser 200 antes de homologar agenda/SLA.

---

## Fase 3 — Variáveis da API (Railway)

Status = o que o **serviço `insureflow-api` novo** tem hoje (ainda não existe).

| Variável | Status | Valor a usar |
|----------|--------|----------------|
| `DATABASE_URL` | **PRECISA SER GERADA** no Railway (existe no `.env.development` local) | Neon **pooled** do cloud já inspecionado: host `ep-flat-grass-ajh8n0no-pooler.c-3.us-east-2.aws.neon.tech`, db `insureflow`, `sslmode=require`. Copiar a URI completa do `.env.development` — **não** localhost |
| `DATABASE_URL_DIRECT` | **PRECISA SER GERADA** | Neon **direct** `ep-flat-grass-ajh8n0no.c-3.us-east-2.aws.neon.tech` (mesmo arquivo). O `prisma.config.ts` usa direct no `migrate deploy` do boot |
| `REDIS_URL` | **AUSENTE** | Referência Railway Redis (Fase 2) |
| `JWT_SECRET` | **PRECISA SER GERADA** | Novo, ≥ 32 chars. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Não reutilizar o secret local nem “copiar produção antiga” |
| `CORS_ORIGIN` | **PRECISA SER GERADA** | `https://corretoraavila.com.br,https://www.corretoraavila.com.br` — **sem** localhost no operacional |
| `API_PUBLIC_URL` | **AUSENTE** | `https://api.corretoraavila.com.br` (depois do domínio; até lá a URL `*.up.railway.app`) |
| `OWNERSHIP_ENFORCEMENT` | **PRECISA SER GERADA** | `on` |
| `NODE_ENV` | vem do `railway.toml` | `production` (confirmar no painel; não apagar) |
| `APP_ENV` | **PRECISA SER GERADA** | `production` |
| `PORT` | vem do `railway.toml` | `4000` |
| `JWT_EXPIRES_IN` | **PRECISA SER GERADA** | `15m` |
| `JWT_REFRESH_DAYS` | **PRECISA SER GERADA** | `7` |
| `THROTTLE_TTL` | opcional | `60` |
| `THROTTLE_LIMIT` | opcional | `100` |
| `SEED_DEV_DATA` | **PRECISA SER GERADA** | `0` — seed **não** nesta fase |

Não commitar `.env`. Não revelar senhas Neon/JWT neste arquivo.

---

## Fase 4 — Database

A API **deve** usar o Neon já inspecionado (0 leads, 2 customers demo, 6 deals, 2 policies).

- **Não** trocar de banco.  
- **Não** apontar para `localhost`.  
- **Não** `migrate deploy` / `db push` / seed / reset nesta tarefa.  
- `DATABASE_URL` → Neon pooled (`…-pooler…`).  
- `DATABASE_URL_DIRECT` → Neon direct (mesmo projeto/branch).  

Lembrete: o primeiro start da API no Railway **vai** migrar esse Neon. Só Deploy quando isso for aceito.

---

## Fase 5 — Web (Vercel) — não alterar ainda

Web atual: https://corretoraavila.com.br (login 200, build antigo).

| Variável | Status atual (inferido) | Quando for alterar |
|----------|-------------------------|-------------------|
| `AUTH_SECRET` | CONFIGURADA (página de login sobe) | Manter se ≥ 32; não precisa rotacionar para o BFF apontar a API nova |
| `API_INTERNAL_URL` | provavelmente a API 404 | Trocar para a API **viva** |
| `API_URL` | AUSENTE ou legado | Igual a `API_INTERNAL_URL` |

Root directory permanece `apps/web`. `apps/web/vercel.json` já faz install/build turbo e redirect www. **Não** usar o `vercel.json` experimental da raiz do monorepo.

O BFF (`getApiBaseUrl`) lê `API_INTERNAL_URL` e, se vazio, `API_URL`, senão `http://localhost:4000` (inútil na Vercel).

---

## Fase 6 — CORS

Operacional:

```
CORS_ORIGIN=https://corretoraavila.com.br,https://www.corretoraavila.com.br
```

- Apex é o origem real do browser após o 308.  
- `www` entra para não falhar CORS se alguma chamada sair do host www.  
- **Sem** `http://localhost:3000` neste serviço. Dev local continua no `.env.local`.  
- Depois de mudar CORS: **redeploy** da API.

---

## Checklist de deploy (executar no painel — itens ainda abertos)

- [ ] Branch `release/crm-operacao-avila` no `origin` (push autorizado)
- [ ] Dockerfile inclui `forms-engine` / `forms-library` (correção de código futura)
- [ ] Railway API criado (`insureflow-api`)
- [ ] Branch release configurada no serviço
- [ ] Dockerfile validado (build verde)
- [ ] `railway.toml` validado (root `/`, Start Command vazio)
- [ ] Redis criado/configurado (mesmo projeto)
- [ ] `DATABASE_URL` configurada (Neon pooled inspecionado)
- [ ] `DATABASE_URL_DIRECT` configurada (Neon direct)
- [ ] `JWT_SECRET` configurado (novo, ≥ 32)
- [ ] CORS configurado (apex + www, sem localhost)
- [ ] `API_PUBLIC_URL` configurada
- [ ] `OWNERSHIP_ENFORCEMENT=on`
- [ ] `APP_ENV=production` e `SEED_DEV_DATA=0`
- [ ] Aceite explícito: primeiro boot aplica 12 migrations
- [ ] API deployada
- [ ] `/health` = 200
- [ ] `/health/db` = 200
- [ ] `/health/redis` = 200
- [ ] Custom domain `api.corretoraavila.com.br` Active
- [ ] Web apontando para API (`API_INTERNAL_URL` / `API_URL`)
- [ ] `/login` = 200
- [ ] `/api/auth/me` funcionando (401 sem cookie; 200 com sessão)

---

## Fora desta tarefa (proibido agora)

- Alterar código / Dockerfile  
- Merge ou push em `main`  
- `prisma migrate deploy` / `migrate reset` / seed / import real  
- CRM-007 (WhatsApp Inbox / Instagram)  
- Clicar Deploy no Railway até os bloqueios 1 e 2 saírem

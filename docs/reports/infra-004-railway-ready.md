# INFRA-004 — Configuração Railway para o release

**Data:** 21 de agosto de 2026  
**Branch GitHub:** `release/crm-operacao-avila`  
**Commit do release:** `8804911`  
**Projeto Railway:** `thorough-spirit` (`645fb36c-1714-408c-a927-ffdf838ed780`)  
**Ambiente:** `production`  
**Não executado:** Deploy, `prisma migrate deploy`, seed, alteração de Neon, Vercel, `main`.

---

## Classificação

# BLOCKED

A configuração do serviço **foi aplicada** (nome, variáveis, domínio, healthcheck, branch GitHub, autodeploy **desligado**). O **primeiro Deploy ainda não pode ser autorizado**: o workspace Railway está **`INACTIVE`** (trial encerrado, sem plano Hobby/Pro). Criar serviço novo, ligar o Redis e publicar o container falham com:

`Your trial has expired. Please select a plan to continue using Railway.`

Nenhum container novo subiu. O Neon **não** recebeu migrate nesta tarefa.

---

## 1. Serviço criado

Não foi possível criar um serviço **vazio** `insureflow-api` (`railway add` bloqueado pelo trial).

O serviço operacional existente `insureflow` (404 / **FAILED**) foi **renomeado** para:

| Campo | Valor |
|-------|--------|
| Nome | `insureflow-api` |
| Service ID | `6c04caad-c270-4ab8-91a6-7c47cba59d87` |
| Root Directory | vazio (`/`) |
| Config file | `railway.toml` |
| Dockerfile | `apps/api/Dockerfile` |
| Start Command | **vazio** (CMD do Docker: `node scripts/start-release.cjs`) |
| Porta | `4000` |
| Healthcheck | `/api/v1/health` (timeout 120 s) |
| Autodeploy | **desligado** (`enabled: false`) |
| Status atual | **Failed** (último deploy antigo, não este release) |

URL pública: `https://api.corretoraavila.com.br`

---

## 2. Branch

| Item | Valor |
|------|--------|
| Repositório | `leandrohavila/insureflow` |
| Branch de trigger (production) | `release/crm-operacao-avila` |
| Autodeploy | **off** — o próximo boot exige **Deploy Latest Commit** explícito |

Há também um trigger da **mesma** branch no environment `hml` deste serviço. Não dispara enquanto o autodeploy estiver off.

---

## 3. Commit

O GitHub já tem `8804911`. O **último deployment** do serviço continua o antigo:

- status **FAILED**
- branch **`develop`**
- commit `b5f3c490` (maio/2026)

Nenhum deploy de `8804911` foi criado. Lista recente: apenas SKIPPED/REMOVED/FAILED antigos.

---

## 4. Redis

Redis **já existia** no mesmo projeto (`Redis`, `redis:8.2.1`, volume `redis-volume`). Não foi criado um segundo Redis. Não se usou `127.0.0.1` / localhost.

| Item | Estado |
|------|--------|
| Serviço | `Redis` (`3862b7f4-19bb-4d6c-a728-ab498373fc65`) |
| Status | **Offline** (`latestDeployment: null`) |
| `REDIS_URL` na API | referência `${{Redis.REDIS_URL}}` |

Filas BullMQ (mesmo processo Nest, quando a API subir): `audit-log`, `commercial-automation`, `lead-reactivation`.

O Redis **não sobe** enquanto o workspace estiver `INACTIVE`. Sem Redis no ar, `/api/v1/health/redis` não será 200 no primeiro boot.

---

## 5. Variáveis configuradas

Valores **não** são reproduzidos aqui (secrets).

| Variável | Status | Nota |
|----------|--------|------|
| `DATABASE_URL` | configurada | Neon pooled `insureflow` (mesmo banco já inspecionado) |
| `DATABASE_URL_DIRECT` | configurada | Neon direct do mesmo banco |
| `REDIS_URL` | configurada | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | configurada | **novo**, ≥ 32 caracteres (não reutiliza o local) |
| `CORS_ORIGIN` | configurada | `https://corretoraavila.com.br,https://www.corretoraavila.com.br` |
| `API_PUBLIC_URL` | configurada | `https://api.corretoraavila.com.br` |
| `OWNERSHIP_ENFORCEMENT` | configurada | `on` |
| `NODE_ENV` | configurada | `production` |
| `APP_ENV` | configurada | `production` |
| `SEED_DEV_DATA` | configurada | `0` |
| `PORT` | configurada | `4000` |
| `JWT_EXPIRES_IN` | configurada | `15m` |
| `JWT_REFRESH_DAYS` | configurada | `7` |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | configuradas | `60` / `100` |

Todas as alterações de variável usaram `--skip-deploys`.

---

## 6. Domínio

| Campo | Valor |
|-------|--------|
| Domínio | `api.corretoraavila.com.br` |
| Destino CNAME (Railway) | `api` → `k7hgrsi5.up.railway.app` |
| Porta alvo | **4000** (antes estava 8080) |
| Sync | `ACTIVE` |
| Verificado | sim |
| SSL | `CERTIFICATE_STATUS_TYPE_VALID` (válido até ~out/2026) |

DNS **não** foi alterado no Registro.br. No momento do update, o valor observado no DNS (`p3h635d4.up.railway.app`) **divergia** do destino exigido (`k7hgrsi5.up.railway.app`). Conferir o CNAME `api` antes do go-live; só então ajustar DNS se ainda estiver errado.

---

## 7. Healthcheck

Configurado no instance:

- path: `/api/v1/health`
- timeout: 120 s

O endpoint **não** foi chamado em cloud (serviço Failed / sem container deste release). Validação de health fica para o primeiro Deploy autorizado.

---

## 8. Status SSL / DNS

- SSL: **válido**
- DNS: Railway pede CNAME `api` → `k7hgrsi5.up.railway.app`
- DNS: **não modificado** nesta tarefa
- API pública continua 404 até haver um deploy bem-sucedido **e** o CNAME correto

---

## 9. Checklist pré-deploy

- [x] Branch `release/crm-operacao-avila` no origin e no trigger Railway
- [ ] Commit `8804911` **publicado no container** (ainda não — último deploy é outro SHA)
- [x] Dockerfile `apps/api/Dockerfile` + `railway.toml` no serviço
- [ ] Redis **running** (existe, está Offline)
- [x] `DATABASE_URL` (Neon pooled)
- [x] `DATABASE_URL_DIRECT` (Neon direct)
- [x] `REDIS_URL` = `${{Redis.REDIS_URL}}`
- [x] `JWT_SECRET` novo ≥ 32
- [x] CORS apex + www, sem localhost
- [x] `API_PUBLIC_URL=https://api.corretoraavila.com.br`
- [x] `OWNERSHIP_ENFORCEMENT=on`
- [x] `NODE_ENV=production`
- [x] `APP_ENV=production`
- [x] `SEED_DEV_DATA=0`
- [x] Healthcheck `/api/v1/health`
- [x] Porta 4000
- [x] Domínio custom + SSL válido
- [ ] Plano Railway ativo (workspace hoje **INACTIVE**)
- [x] Autodeploy **off** (não dispara migrate sozinho)
- [ ] Aceite explícito: o primeiro boot roda `prisma migrate deploy` (12 migrations no Neon)

---

## Workspace Railway (bloqueio)

| Campo | Valor |
|-------|--------|
| Workspace | Leandro Ávila's Projects |
| `state` | `INACTIVE` |
| Trial | encerrado (`trialDaysRemaining: 0`, `isTrialing: false`) |
| Assinante usage | `false` |
| Créditos restantes | ~US$ 4,47 (não substitui escolher um plano) |

Sem Hobby/Pro: não sobe Redis, não sobe a API, migrate **não** roda.

---

## Migrate (lembrete)

O `CMD` do Docker é `node scripts/start-release.cjs` → `prisma migrate deploy` **depois** `node dist/main.js`.

Quando o Deploy for autorizado (plano ativo + Redis no ar):

1. Build da imagem  
2. `migrate deploy` no Neon inspecionado (12 pendentes)  
3. Nest  
4. `/api/v1/health`

Se a migrate falhar: **parar** e ler o log. Não repetir Deploy no escuro.

---

## Próximo passo

1. No dashboard Railway: escolher plano (Hobby ou Pro) no workspace.  
2. Subir o serviço **Redis** (mesmo projeto).  
3. Conferir CNAME `api` → `k7hgrsi5.up.railway.app`.  
4. Manter autodeploy **off**.  
5. **Autorizar** Deploy Latest Commit em `insureflow-api` (isso aplica as 12 migrations).  
6. Só então validar `/api/v1/health`, `/health/db`, `/health/redis`.  
7. Vercel continua **sem** alteração até a API responder 200.

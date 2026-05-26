# Estabilização produção (cloud) — sem HML

Runbook enquanto o DNS de `corretoraavila.com.br` propaga: Redis Railway, admin prod, healthchecks e diagnóstico.

## 1. Redis no Railway (prioridade)

### Onde copiar a URL

1. Projeto Railway → serviço **Redis** (plugin ou serviço dedicado).
2. Aba **Variables** (ou **Connect**):
   - **`REDIS_URL`** — use esta na API (rede privada do projeto).
   - **`REDIS_PUBLIC_URL`** — só para acesso **externo**; **não** use na API no mesmo projeto.

### Configurar no serviço **insureflow** (API)

1. **Variables** → remover:
   ```env
   REDIS_URL=redis://127.0.0.1:6379
   ```
2. Adicionar **referência** (recomendado):
   ```env
   REDIS_URL=${{Redis.REDIS_URL}}
   ```
   Substitua `Redis` pelo **nome exato** do serviço Redis no canvas.
3. Ou colar o valor completo de `REDIS_URL` do serviço Redis (começa com `redis://` ou `rediss://`).

4. **Redeploy** do serviço API.

### Validar

```bash
API_URL=https://insureflow-production-08c5.up.railway.app node scripts/cloud-prod-stabilize.cjs
```

Esperado: `[OK] Redis / BullMQ` em `GET /api/v1/health/redis`.

Logs do deploy:

- `[redis] Conexão OK (PING PONG)`
- Sem `ECONNREFUSED 127.0.0.1:6379`

Se Redis falhar, a API **ainda sobe**; auditoria em fila pode falhar até corrigir `REDIS_URL`.

---

## 2. Administrador de produção

| Campo | Valor |
|-------|--------|
| Email | `leandro@corretoraavila.com.br` |
| Tenant | `insureflow` |
| Role | `admin` |
| Senha | Gerada automaticamente ou `PROD_ADMIN_PASSWORD` |

### Pré-requisito

Tenant e roles do seed base já existem no Neon prod (`npm run db:seed` com `DATABASE_URL` prod, uma vez).

### Executar

```bash
cp .env.production.example .env.production
# Preencher DATABASE_URL ou DATABASE_URL_DIRECT (Neon prod)

node scripts/seed-prod-admin.cjs
```

Guarde a senha temporária impressa no terminal.

### Validar login

```bash
API_URL=https://insureflow-production-08c5.up.railway.app \
PROD_ADMIN_PASSWORD="<senha>" \
node scripts/cloud-prod-stabilize.cjs
```

BFF/Vercel (quando web estiver no ar):

```bash
WEB_URL=https://corretoraavila.com.br npm run prod:domain:smoke
```

O usuário `admin@insureflow.com` do seed base **permanece** como fallback de teste.

---

## 3. Checklist infraestrutura

| Item | Endpoint / ação |
|------|------------------|
| Liveness | `GET /api/v1/health` → 200 |
| Neon | `GET /api/v1/health/db` → 200 |
| Redis | `GET /api/v1/health/redis` → 200 |
| JWT | Login API com tenant `insureflow` |
| CORS | `CORS_ORIGIN` com apex + www |
| Cookies secure | `NODE_ENV=production` no Vercel |
| Railway Start Command | Vazio (CMD Dockerfile) |
| Public networking | ON |

---

## 4. Observabilidade (logs)

| Área | Log esperado |
|------|----------------|
| Boot | `[bootstrap] CORS origins`, `HTTP + Swagger` |
| Prisma | `[prisma] Conexão Neon/PostgreSQL OK` |
| Redis | `[redis] Configurado`, `[redis] Conexão OK` ou erro explícito |
| Auth | `[auth] Login OK tenant=...` |
| Fila | `[redis] Worker BullMQ...` se ECONNREFUSED |

---

## 5. Diagnóstico consolidado

```bash
npm run prod:cloud:stabilize
# ou
API_URL=https://insureflow-production-08c5.up.railway.app node scripts/cloud-prod-stabilize.cjs
```

Relacionado: [go-live-production.md](go-live-production.md), [custom-domain.md](custom-domain.md).

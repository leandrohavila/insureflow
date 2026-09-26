# Environment strategy

## Arquivos

| Arquivo | Uso | Commitado |
|---------|-----|-----------|
| `.env.local.example` | Template máquina local | Sim |
| `.env.development.example` | Dev cloud (Neon + Railway preview) | Sim |
| `.env.staging.example` | Pré-produção | Sim |
| `.env.production.example` | Produção | Sim |
| `.env.local` | Cópia local ativa | Não (gitignore) |
| `.env.development` | Secrets dev cloud | Não |
| `.env.staging` | Secrets staging | Não |
| `.env.production` | Secrets produção | Não |

Copie o template correspondente:

```bash
cp .env.local.example .env.local
```

Defina `APP_ENV` para carregar o arquivo certo no Prisma CLI:

```bash
APP_ENV=development npx prisma migrate deploy
```

## Variáveis por domínio

### DATABASE_URL

PostgreSQL connection string consumida por Prisma e NestJS.

| Ambiente | Exemplo |
|----------|---------|
| Local | `postgresql://postgres:postgres@localhost:5432/insureflow?schema=public` |
| Neon (pool) | `postgresql://user:pass@ep-xxx-pooler.neon.tech/insureflow?sslmode=require` |
| Neon (direct) | Usar em CI/migrations quando pooling bloquear DDL |

**Regras**

- Produção: SSL obrigatório (`sslmode=require`)
- Neon: usar URL **pooled** na API; URL **direct** apenas para `migrate deploy` em CI/release
- Nunca commitar credenciais reais

### JWT (API)

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Segredo HMAC — mín. 32 caracteres em prod |
| `JWT_EXPIRES_IN` | TTL access token — ex.: `15m` |
| `JWT_REFRESH_DAYS` | Validade refresh token — ex.: `7` |

Gerar secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### NEXTAUTH / AUTH (Web)

InsureFlow usa sessão custom (`AUTH_SECRET` + cookies httpOnly para tokens da API).

| Variável | Descrição |
|----------|-----------|
| `AUTH_SECRET` | Segredo de assinatura de sessão — mín. 32 chars em prod |
| `API_INTERNAL_URL` | URL interna da API (server-side BFF) — ex.: `https://api.corretoraavila.com.br` |
| `API_URL` | Fallback público se `API_INTERNAL_URL` ausente |

**Vercel**: configurar `AUTH_SECRET` e `API_INTERNAL_URL` no painel do projeto `web`.

### STORAGE

Imagens de imóveis. `local` grava em `uploads/` e serve pela API. `s3` envia o arquivo ao bucket, grava só a key e responde a URL pública. Imagens antigas, sem `storage_driver`, continuam no path já salvo.

| Variável | Descrição |
|----------|-----------|
| `STORAGE_DRIVER` | `local` (padrão) ou `s3`. `STORAGE_PROVIDER` vale como fallback |
| `STORAGE_BUCKET` | Nome do bucket (obrigatório em `s3`) |
| `STORAGE_REGION` | Região cloud (obrigatório em `s3`) |
| `STORAGE_ACCESS_KEY` | Access key. Sem ela, o SDK usa a cadeia padrão de credenciais |
| `STORAGE_SECRET_KEY` | Secret key |
| `STORAGE_PUBLIC_URL` | Base pública do bucket, sem barra final |
| `STORAGE_ENDPOINT` | Endpoint alternativo (opcional) |

### CORS (API)

| Variável | Descrição |
|----------|-----------|
| `CORS_ORIGIN` | Origens permitidas, separadas por vírgula |

Exemplos:

```env
# Local
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# Staging
CORS_ORIGIN=https://staging.insureflow.app

# Produção
CORS_ORIGIN=https://corretoraavila.com.br,https://www.corretoraavila.com.br
```

### Redis (API — filas BullMQ)

| Variável | Descrição |
|----------|-----------|
| `REDIS_URL` | URL completa — ex.: `redis://127.0.0.1:6379` |

Opcional em dev local se filas não forem exercitadas; obrigatório em cloud.

### Rate limit

| Variável | Default |
|----------|---------|
| `THROTTLE_TTL` | `60` (segundos) |
| `THROTTLE_LIMIT` | `100` requisições |

### Seed (dev only)

| Variável | Descrição |
|----------|-----------|
| `SEED_DEV_DATA` | `1` para popular CRM demo após seed base |

## Matriz por ambiente

| Variável | local | development | staging | production |
|----------|-------|-------------|---------|------------|
| `APP_ENV` | local | development | staging | production |
| `NODE_ENV` | development | production | production | production |
| `DATABASE_URL` | localhost | Neon dev | Neon staging | Neon prod |
| `JWT_SECRET` | dev fixo | rotacionável | rotacionável | rotacionável |
| `AUTH_SECRET` | dev fixo | rotacionável | rotacionável | rotacionável |
| `CORS_ORIGIN` | localhost:3000 | Vercel preview URL | staging domain | prod domain |
| `API_INTERNAL_URL` | localhost:4000 | Railway URL | staging API | prod API |
| `SEED_DEV_DATA` | 1 | 1 | 0 | 0 |

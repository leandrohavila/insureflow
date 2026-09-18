# ENV-001 — Ambiente de desenvolvimento validado

**Data:** 2026-07-22

## Objetivo

Garantir que o desenvolvimento local usa **código-fonte atual** (`npm run start:dev`), não container Docker stale.

---

## Checklist ENV-001

| # | Verificação | Como validar |
|---|-------------|--------------|
| 1 | Um processo na porta 4000 | `npm run dev:local:validate` |
| 2 | `API_INTERNAL_URL=http://localhost:4000` | `.env.local` |
| 3 | Container `insureflow-api` parado | `docker ps` |
| 4 | API via `start:dev` | Boot log: `[boot] commit=... runtime=local` |
| 5 | Frontend → backend local | Web :3000 + BFF → :4000 |
| 6 | Runtime endpoint | `GET /api/v1/health/runtime` |

---

## Endpoint temporário

```
GET http://localhost:4000/api/v1/health/runtime
```

Resposta:

```json
{
  "version": "0.0.1",
  "commit": "<git SHA>",
  "startedAt": "2026-07-22T...",
  "environment": "development",
  "pid": 12345,
  "runtime": "local"
}
```

- `runtime: "local"` → processo Node local (`start:dev`)
- `runtime: "docker"` → container Docker (não usar em dev)
- `runtime: "production"` → build de produção

---

## Boot da API

```
[boot] commit=<sha> builtAt=<watch-mode|mtime> pid=<pid> NODE_ENV=development PORT=4000 runtime=local
GET http://localhost:4000/api/v1/health/runtime
```

---

## Comandos recomendados

```bash
# Infra (postgres + redis apenas)
docker compose up -d postgres redis

# Parar API Docker se estiver rodando
docker stop insureflow-api

# API local (código-fonte)
npm run start:dev -w api

# Frontend
npm run dev -w web

# Validar ambiente
npm run dev:local:validate
```

---

## Docker Compose

O serviço `api` usa profile `docker-api` — **não sobe** com `docker compose up -d` padrão.

```bash
docker compose --profile docker-api up -d   # só se quiser API em Docker
```

---

## Limpeza BUG-006/007/008

Instrumentação temporária removida:

- `bug007-validation.pipe.ts` — deletado
- `bug008-runtime-audit.util.ts` — deletado
- Logs `[BUG006]`, `[BUG007]`, `[BUG008]` — removidos de web e api
- Substituído por `runtime-info.util.ts` + endpoint `/health/runtime`

---

## Causa raiz anterior (BUG-008)

Desenvolvimento apontava para `http://localhost:4000` enquanto container Docker `insureflow-api` (build 2026-07-01) ocupava a porta — código local nunca era executado.

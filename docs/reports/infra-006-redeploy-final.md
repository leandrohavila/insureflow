# INFRA-006 — Redeploy final da API

**Data:** 24 de agosto de 2026  
**Branch alvo:** `release/crm-operacao-avila`  
**Commit alvo:** `8804911` (`88049114c8b5f8c4da38d9c284bdd1163d7f54ba`)  
**Serviço:** `insureflow-api` · projeto `thorough-spirit`  
**Deployment final:** `9b89ee7a-daf2-493a-bf80-a6d6fca81aab` (**SUCCESS**)

---

## Classificação final

# READY WITH WARNINGS

---

## 1. Verificação de commit SHA

| Item | Valor |
|------|--------|
| **SHA branch `release/crm-operacao-avila`** | `88049114c8b5f8c4da38d9c284bdd1163d7f54ba` |
| **SHA imagem anterior** (`b091ebc7`) | **Indeterminado** — runtime `/health/runtime` inexistente; boot com **14 migrations** (código pré-release) |
| **SHA imagem atual** (`9b89ee7a`) | **`unknown`** em `/health/runtime` (Docker não inclui `.git`) |
| **Evidência de paridade com `8804911`** | Boot com **27 migrations**; rotas `commercial-agenda`, `customers/:id/360`, `health/redis`; JWT com `dataScope` |

### Divergência confirmada (antes)

| Indicador | Imagem antiga | Release `8804911` |
|-----------|---------------|-------------------|
| Migrations no container | 14 | 27 |
| `/health/runtime` | 404 | 200 |
| `/health/redis` | 404 | 200 |
| `commercial-agenda` | 404 | 200 |
| `customers/:id/360` | 404 | 200 |
| JWT `dataScope` | ausente | presente |

**Conclusão:** havia divergência clara. Redeploy executado.

---

## 2. Ações de redeploy

| Passo | Comando / ação | Resultado |
|-------|----------------|-----------|
| Cache invalidation | `railway variable set NO_CACHE=1` | Aplicado |
| Redeploy GitHub | `railway redeploy --from-source --yes` | **FAILED** (`1dfe00a7`) |
| Redeploy upload limpo | Worktree `8804911` + `railway deployment up --detach -y` | **SUCCESS** (`9b89ee7a`) |
| Mensagem deploy | `INFRA-006: redeploy release/crm-operacao-avila 8804911 NO_CACHE` | — |

**Nota:** o primeiro `deployment up` acidental criou projeto paralelo `InsureFlow-deploy-8804911` (sem impacto no serviço de produção). O deploy válido foi feito após `railway link -p thorough-spirit -e production -s insureflow-api`.

---

## 3. Boot logs (deployment `9b89ee7a`)

```text
27 migrations found in prisma/migrations
No pending migrations to apply.

[RedisBootstrapService] [redis] Configurado redis.railway.internal:6379
[RedisBootstrapService] [redis] Conexão OK (PING PONG) — filas BullMQ podem subir

Mapped {/api/customers/:id/360, GET}
Mapped {/api/commercial-agenda, GET}
Mapped {/api/health/redis, GET}
Mapped {/api/health/runtime, GET}

Nest application successfully started
```

Sem erros `ENOTFOUND redis.railway.internal` no boot final.

---

## 4. Validação pós-deploy

### Infraestrutura

| Check | Endpoint / evidência | Status |
|-------|----------------------|--------|
| Liveness | `GET /api/v1/health` | **200** |
| Database | `GET /api/v1/health/db` | **200** connected |
| Redis | `GET /api/v1/health/redis` | **200** `redis: connected` |
| Runtime | `GET /api/v1/health/runtime` | **200** `commit: unknown` |
| Railway status | `insureflow-api` | **Online** (sem *Deploy failed*) |

### Redis

| Item | Resultado |
|------|-----------|
| Serviço Railway Redis | **Online** |
| API → Redis PING | **OK** |
| `/health/redis` | **200** |

### BullMQ

| Item | Resultado |
|------|-----------|
| Boot log | `[redis] Conexão OK (PING PONG) — filas BullMQ podem subir` |
| BullModule | Inicializado (5 instâncias nos logs) |
| Erros Redis no boot | **Nenhum** |

### Ownership

| Item | Resultado |
|------|-----------|
| `OWNERSHIP_ENFORCEMENT` | `on` |
| JWT `dataScope` | **`tenant`** |
| JWT `teamIds` | `[]` |
| JWT `roles` | `["admin"]` |
| `GET /api/v1/leads` | **200**, total **0** |

**Interpretação:** ownership **ativo no auth** (`dataScope` presente). Lista de leads vazia — provável gap de **dados** (sem registros ou backfill pendente), não falha de deploy.

### Customer 360

| Item | Resultado |
|------|-----------|
| `GET /api/v1/customers/{id}/360` | **200** |
| Payload | `customer`, `timeline`, `leads`, `deals`, `policies`, `properties`, `communications`, `followUps`, `renewals`, `agenda`, `renewalBook`, `crossSell`, `opportunities`, `pendencies`, `finance` |

### CRM ampliado

| Módulo | Endpoint | Status |
|--------|----------|--------|
| Deals | `/api/v1/crm/deals` | 200 |
| Pipelines | `/api/v1/crm/pipelines` | 200 |
| Agenda comercial | `/api/v1/commercial-agenda` | 200 |
| Renovações | `/api/v1/policy-renewals` | 200 |
| Quotes | `/api/v1/quotes` | 200 |
| Login API | `/api/v1/auth/login` | 201 |

### Erros HTTP 500

**Nenhum** nos endpoints testados pós-redeploy.

---

## 5. Respostas consolidadas

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Commit divergia? | **Sim** — imagem antiga (~14 migrations) vs. `8804911` (27) |
| 2 | Redeploy executado? | **Sim** — `9b89ee7a` SUCCESS |
| 3 | Redis conectado? | **Sim** |
| 4 | BullMQ conectado? | **Sim** |
| 5 | Ownership funciona? | **Parcial** — JWT OK; leads vazios (dados) |
| 6 | Customer 360 funciona? | **Sim** |
| 7 | Erros 500? | **Não** |
| 8 | Classificação | **READY WITH WARNINGS** |

---

## 6. Warnings remanescentes

1. **`commit=unknown` no runtime** — Dockerfile não copia `.git`; paridade inferida por migrations (27) e rotas, não por SHA em runtime.
2. **Leads total 0** para admin — investigar dados Neon / backfill ownership antes de homologação com captura.
3. **`NO_CACHE=1` ainda ativo** — remover após estabilização para builds mais rápidos.
4. **Projeto Railway acidental** `InsureFlow-deploy-8804911` — pode ser excluído no dashboard.
5. **`railway redeploy --from-source` continua falhando** — preferir `deployment up` de worktree limpo até corrigir integração GitHub.

---

## 7. Próximos passos

1. Remover `NO_CACHE=1` quando builds estiverem estáveis.
2. Excluir projeto acidental `InsureFlow-deploy-8804911`.
3. Verificar/importar leads em produção se homologação de captação for necessária.
4. Opcional: injetar `GIT_COMMIT` como build-arg no Dockerfile para `/health/runtime` reportar SHA real.
5. Corrigir `--from-source` deploy (investigar falhas `1dfe00a7`, `90c9f3f7`).

---

## Anexo — Comandos

```bash
# Verificar runtime e Redis
curl -s https://api.corretoraavila.com.br/api/v1/health/runtime
curl -s https://api.corretoraavila.com.br/api/v1/health/redis

# Status Railway
npx @railway/cli status
npx @railway/cli deployment list

# Redeploy limpo (worktree)
git worktree add ../InsureFlow-deploy-8804911 8804911
cd ../InsureFlow-deploy-8804911
railway link -p thorough-spirit -e production -s insureflow-api
railway deployment up --detach -y -m "redeploy 8804911"
```

---

*Relatório INFRA-006 — redeploy final concluído com sucesso operacional. API em paridade funcional com `release/crm-operacao-avila` (`8804911`).*

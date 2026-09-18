# INFRA-005 — Deploy controlado HML/Produção inicial

**Data:** 24 de agosto de 2026  
**Executor:** auditoria operacional (Railway CLI + probes HTTP + Prisma)  
**Branch alvo:** `release/crm-operacao-avila` (`8804911`)  
**Projeto Railway:** `thorough-spirit` (`645fb36c-1714-408c-a927-ffdf838ed780`)  
**Ambiente:** `production`  
**Restrições respeitadas:** sem `migrate reset`, sem seed destrutivo, sem apagar banco.

---

## Classificação final

# READY WITH WARNINGS

---

## Relatório consolidado — perguntas finais

| # | Pergunta | Resposta | Evidência |
|---|----------|----------|-----------|
| 1 | **Login funciona?** | **Sim** | API `POST /api/v1/auth/login` → **201** + JWT; BFF `POST /api/auth/login` → **200** + cookie `insureflow-session` |
| 2 | **CRM funciona?** | **Parcial** | Deals (6), Clientes (2), Atividades (9), Apólices (2) → **200**; Leads → **200** mas **total 0**; Quotes, Pipeline, Agenda, Renovação, Business Units → **404** |
| 3 | **Ownership funciona?** | **Não** | `OWNERSHIP_ENFORCEMENT=on` no Railway; JWT **sem** `dataScope`/`teamIds`; admin vê **0 leads** (esperado `tenant` ou backfill) |
| 4 | **Customer 360 funciona?** | **Não** | `GET /api/v1/customers/{id}/360` → **404** (módulo ausente na imagem em execução) |
| 5 | **Redis conectado?** | **Não (API)** / **Sim (Railway)** | Serviço Redis **Online** no Railway; container API ainda loga `ENOTFOUND redis.railway.internal`; `/health/redis` → **404** |
| 6 | **BullMQ conectado?** | **Não** | Mesma falha de DNS Redis no boot; filas `audit-log`, `commercial-automation`, `lead-reactivation` degradadas |
| 7 | **Existem erros 500?** | **Não** | Smoke test em 18 endpoints — **0** respostas HTTP 500 |
| 8 | **Classificação** | **READY WITH WARNINGS** | Infra base operacional; banco sincronizado (29 migrations); API desatualizada vs. release |

### Veredicto operacional

| Pergunta | Resposta |
|----------|----------|
| Sistema acessível? | **Sim** |
| API acessível? | **Sim** (intermitência leve no liveness) |
| Banco acessível? | **Sim** |
| Homologação assistida com dados reais? | **Não ainda** — exige redeploy da API (`8804911`) + fix ownership/Redis |

---

## Fase EXTRA — Migrations (24/08/2026 ~17:36 -03)

### Status antes do deploy

**Total:** 29 migrations  
**Aplicadas:** 15  
**Pendentes:** 14

<details>
<summary>Migrations já aplicadas (15)</summary>

1. `20260220120000_enterprise_init`
2. `20260517193000_add_crm_deals`
3. `20260517202000_add_customers`
4. `20260518002800_add_leads`
5. `20260518132500_add_questionnaires`
6. `20260519120000_lead_document_and_contact`
7. `20260520120000_deal_pipeline_order`
8. `20260520140000_add_activities`
9. `20260521000000_add_activity_status`
10. `20260521143000_backfill_submission_deal_id`
11. `20260523143558_npx_prisma_generate`
12. `20260523180000_add_policies`
13. `20260523200000_policy_enums_and_activity_policy`
14. `20260523210000_ensure_activity_policy_id`
15. `20260527120000_ownership_foundations`

</details>

<details>
<summary>Migrations aplicadas nesta execução (14)</summary>

1. `20260701120000_add_quotes_domain`
2. `20260703120000_proposal_center`
3. `20260708153000_deal_owner_user_id`
4. `20260724170000_questionnaire_submission_updated_by`
5. `20260820120000_multiempresa_reactivation`
6. `20260820180000_commercial_recovery`
7. `20260820190000_commercial_communication`
8. `20260820200000_user_business_units`
9. `20260820220000_evolution_api`
10. `20260820230000_customer_360_opportunities`
11. `20260820240000_sales_pipeline_inteligente`
12. `20260820250000_sales_targets_commissions`
13. `20260824140000_real_estate_inventory`
14. `20260824180000_re004_property_production`

</details>

### Execução

```text
Command: railway run -- npm run db:deploy -w @repo/database
Host:    ep-flat-grass-ajh8n0no.c-3.us-east-2.aws.neon.tech
Result:  All migrations have been successfully applied.
```

### Status após deploy

| Métrica | Valor |
|---------|-------|
| Migrations aplicadas (total) | **29 / 29** |
| Pendentes | **0** |
| Schema | **`Database schema is up to date!`** |

### Health pós-migrate

| Endpoint | Status |
|----------|--------|
| `GET /api/v1/health` | **200** |
| `GET /api/v1/health/db` | **200** `database: connected` |

---

## Smoke test final (24/08/2026 ~17:40 -03)

Credenciais: `admin@insureflow.com` / `Admin@2026!`

| Endpoint | HTTP | Resultado |
|----------|------|-----------|
| `/api/v1/health` | 200* | OK (*1 timeout isolado no batch) |
| `/api/v1/health/db` | 200 | connected |
| `/api/v1/health/redis` | 404 | endpoint ausente na imagem |
| `/api/v1/auth/login` | 201 | JWT + 27 permissions |
| BFF `/api/auth/login` | 200 | sessão criada |
| `/api/v1/leads` | 200 | total **0** |
| `/api/v1/customers` | 200 | total **2** |
| `/api/v1/crm/deals` | 200 | total **6** |
| `/api/v1/activities` | 200 | total **9** |
| `/api/v1/policies` | 200 | total **2** |
| `/api/v1/quotes` | 404 | — |
| `/api/v1/crm/insights/pipelines` | 404 | — |
| `/api/v1/commercial-agenda` | 404 | — |
| `/api/v1/policy-renewals` | 404 | — |
| `/api/v1/opportunities` | 404 | — |
| `/api/v1/business-units` | 404 | — |
| `/api/v1/customers/{id}/360` | 404 | Customer 360 indisponível |

**Erros HTTP 500:** nenhum.

---

## Fase 1 — Auditoria Railway

| Campo | Valor |
|-------|--------|
| Serviço | `insureflow-api` (`6c04caad-c270-4ab8-91a6-7c47cba59d87`) |
| Repositório | `leandrohavila/insureflow` |
| Branch GitHub | `release/crm-operacao-avila` @ `8804911` |
| Status | **Online** · *Deploy failed* (healthcheck plataforma) |
| Deployment ativo | `b091ebc7-967e-446e-b409-0dd18c1d0c9f` |
| Dockerfile | `apps/api/Dockerfile` |
| `railway.toml` | healthcheck `/api/v1/health`, timeout 120 s, porta 4000 |
| Domínio | `api.corretoraavila.com.br` (ACTIVE, porta 4000) |
| Plano | Hobby ativo |

**Discrepância:** container em execução contém ~14 migrations no build; commit release tem 27+. Rebuilds `--from-source` (`90c9f3f7`, `401f2560`) **falharam**.

---

## Fase 2 — Redis / BullMQ

| Item | Estado final |
|------|--------------|
| Serviço Redis Railway | **Online** (`3862b7f4-19bb-4d6c-a728-ab498373fc65`) |
| `REDIS_URL` | `redis://***@redis.railway.internal:6379` |
| API → Redis | **Falha** — logs contínuos `ENOTFOUND redis.railway.internal` |
| BullMQ | **Desconectado** — API bootou antes do Redis subir; restart bloqueado |
| `/health/redis` | **404** (imagem antiga sem endpoint) |

---

## Fase 3 — Neon

| Variável | Status |
|----------|--------|
| `DATABASE_URL` | Neon pooled `insureflow` |
| `DATABASE_URL_DIRECT` | Neon direct (mesmo banco) |
| Migrations | **29/29 aplicadas** |
| Schema | **Up to date** |

---

## Fase 4 — Deploy

| Deployment | Status | Nota |
|------------|--------|------|
| `b091ebc7-…` | SUCCESS | Container ativo (imagem antiga) |
| `401f2560-…` | FAILED | Build from-source |
| `90c9f3f7-…` | FAILED | Rebuild from-source |

Boot observado: `migrate deploy` OK na imagem (14 migrations) → NestJS OK → Redis ENOTFOUND.

---

## Fase 5 — Healthcheck

| Endpoint | Classificação |
|----------|---------------|
| `/api/v1/health` | **PASSOU** |
| `/api/v1/health/db` | **PASSOU** |
| `/api/v1/health/redis` | **FALHOU** (404) |

---

## Fase 6 — Login

| Passo | Status |
|-------|--------|
| Web `/login` | 200 |
| BFF login | 200 + cookie |
| API login | 201 + JWT |
| JWT `dataScope` | **ausente** |
| JWT `roles` | `["admin"]` |

---

## Fase 7 — CRM e Ownership

### CRM operacional (imagem atual)

| Módulo | Funciona? |
|--------|-----------|
| Deals / Pipeline básico | **Sim** |
| Clientes | **Sim** |
| Atividades | **Sim** |
| Apólices | **Sim** |
| Leads | **Parcial** (200, lista vazia) |
| Quotes | **Não** (404) |
| Agenda comercial | **Não** (404) |
| Carteira Renovação | **Não** (404) |
| Pipeline inteligente | **Não** (404) |
| Customer 360 | **Não** (404) |
| Business Units | **Não** (404) |

### Ownership

| Item | Valor |
|------|-------|
| `OWNERSHIP_ENFORCEMENT` | `on` |
| JWT ownership fields | **ausentes** |
| Leads admin | **0** (bloqueio operacional) |
| Conclusão | **Não validado / não funcional** |

---

## Variáveis de ambiente (sem secrets)

| Variável | Valor |
|----------|-------|
| `NODE_ENV` / `APP_ENV` | `production` |
| `PORT` | `4000` |
| `CORS_ORIGIN` | `corretoraavila.com.br` + www |
| `API_PUBLIC_URL` | `https://api.corretoraavila.com.br` |
| `OWNERSHIP_ENFORCEMENT` | `on` ⚠️ |
| `SEED_DEV_DATA` | `0` |

---

## Bloqueios remanescentes

1. **API desatualizada** — imagem antiga não expõe módulos do release (`8804911`).
2. **Redis/BullMQ** — API nunca reconectou após Redis subir.
3. **Ownership** — `on` sem JWT `dataScope` e leads vazios para admin.
4. **Customer 360 e módulos comerciais** — 404 até redeploy correto.
5. **Railway healthcheck** — marca *Deploy failed* apesar de liveness HTTP 200.

---

## Próximos passos (ordem recomendada)

1. **Redeploy API** do commit `8804911` com Redis já online.
2. **Validar** `/health/redis` → 200 e logs BullMQ limpos.
3. **Ajustar** `OWNERSHIP_ENFORCEMENT` para `off` ou `shadow` até backfill de leads.
4. **Executar** backfill ownership se necessário (`db:backfill:lead-ownership`).
5. **Smoke completo** pós-redeploy: Leads, 360, Agenda, Renovação, Pipeline.
6. **Atualizar** comentário branch em `railway.toml` (`develop` → `release/crm-operacao-avila`).

---

## Anexo — Comandos úteis

```bash
# Health
curl -s https://api.corretoraavila.com.br/api/v1/health
curl -s https://api.corretoraavila.com.br/api/v1/health/db

# Migrations (somente leitura)
cd packages/database && APP_ENV=development npx prisma migrate status

# Railway
npx @railway/cli status
npx @railway/cli deployment list
```

---

*Relatório consolidado final — INFRA-005. Neon sincronizado (29 migrations). Container API pendente de redeploy para release completo.*

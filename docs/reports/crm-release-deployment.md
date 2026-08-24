# CRM-RELEASE-001 — Relatório de deploy inicial

**Data:** 21 de agosto de 2026  
**Branch:** `release/crm-operacao-avila`  
**Escopo:** promover CRM-003 → CRM-006.4 ao ambiente cloud da Ávila, tratado daqui em diante como primeiro ambiente operacional (ainda sem carteira real).  
**CRM-007:** não iniciado.

Nenhum `prisma migrate reset`, `db push` ou apagamento de dados foi executado.

---

## Classificação

# DEPLOY BLOQUEADO

O banco cloud inspecionado **não contém leads/clientes reais da Ávila** (massa de seed/demo). As 12 migrations são **forward-only** (sem `DROP TABLE`). Mesmo assim o deploy **não foi executado**: a API Railway do domínio operacional está **fora do ar** (404 `Application not found`), não há CLI Railway/Vercel nesta máquina, e não existe `.env.production`. Health `/health`, `/health/db` e `/health/redis` do ambiente cloud **não** estão 200.

O código foi isolado na branch `release/crm-operacao-avila` (working tree preservado). **Migrations cloud não aplicadas. Seed cloud não executado. Push não executado.**

---

## Ambiente utilizado nesta auditoria

| Papel | O que foi usado | Observação |
|-------|-----------------|------------|
| Workstation | `localhost:5432/insureflow` + API `:4000` + Redis `127.0.0.1:6379` | Homologação local já feita; **não** é o ambiente operacional cloud |
| Postgres cloud | Neon `ep-flat-grass-ajh8n0no` (`.env.development`) | Único Postgres cloud alcançável; 15 migrations antigas aplicadas; **12 pendentes** |
| “Produção” documentada | `corretoraavila.com.br` / `api.corretoraavila.com.br` | Web Vercel no ar; **API Railway 404** |
| HML documentada | `insureflow-api-dev` / `insureflow-web-dev` | Ambos 404 |

Não há `.env.production` nem `.env.staging` neste workstation. Sem Railway CLI não foi possível ler `DATABASE_URL` do serviço `insureflow` no dashboard. O Neon acima é o banco referenciado pelo env de **development**; é o único candidato cloud que respondou. Usuários são todos `@insureflow.com` (seed). **Nenhum** `@corretoraavila.com.br`.

---

## URLs

| Superfície | URL | HTTP agora |
|------------|-----|------------|
| WEB operacional | https://corretoraavila.com.br/login | **200** (Vercel `gru1`) |
| WEB www | https://www.corretoraavila.com.br | 308 → apex (histórico) |
| API operacional | https://api.corretoraavila.com.br/api/v1/health | **404** Railway `Application not found` |
| API fallback | https://insureflow-production-08c5.up.railway.app/api/v1/health | **404** |
| API HML | https://insureflow-api-dev.up.railway.app/api/v1/health | **404** |
| WEB HML | https://insureflow-web-dev.vercel.app | **404** `DEPLOYMENT_NOT_FOUND` |
| API local | http://127.0.0.1:4000/api/v1/health | **200** |
| API local DB | http://127.0.0.1:4000/api/v1/health/db | **200** |
| API local Redis | http://127.0.0.1:4000/api/v1/health/redis | **200** (`127.0.0.1:6379`) |

---

## Validação prévia do banco (somente leitura)

### A) Neon cloud (`ep-flat-grass-ajh8n0no` / database `insureflow`)

Este é o banco que **seria** promovido, se o Railway estivesse no ar.

| Tabela | Registros | Pode perder dados reais? |
|--------|----------:|--------------------------|
| tenants | 1 (`insureflow` / InsureFlow Corp) | Não — tenant seed |
| users | 6 | Não — personas seed |
| leads | **0** | **Não há leads** |
| customers | 2 | Demo: Oliveira Logística, Transportes Silva Ltda |
| deals | 6 | Demo; estágios `proposta`(2), `qualificacao`(2), `fechado`(1), `negociacao`(1) |
| policies | 2 | Demo |
| activities | 9 | Demo |
| business_units | tabela **inexiste** | N/A — criada pela migration 20260820120000 |
| questionnaire_submissions | 0 | Não |

**Usuários Neon:** `admin@`, `gerencia@`, `comercial@`, `parceiro@`, `sales@`, `viewer@` — todos `insureflow.com`. **Não há `imoveis@`.** Nenhum e-mail Ávila.

**Conclusão dados reais:** **não há carteira real** neste Neon. Há massa de seed/demo que a migration `20260820240000` **remapearia** (`qualificacao`→`contato`, `negociacao`→`proposta`, `fechado`→`fechamento`) em **4 deals**. Isso não é perda de cliente Ávila; é alteração de vocabulário de funil demo. Não foi aplicado.

### B) Postgres local (`localhost:5432/insureflow`)

Não é o alvo do deploy cloud. Contagens só para não confundir ambientes:

| Tabela | Qtd |
|--------|----:|
| tenants | 1 |
| users | 7 (inclui `imoveis@insureflow.com`) |
| business_units | 2 (Corretora Ávila, Ávila Imóveis) |
| leads | 41 (inclui lotes AVILA/CRM0064/HOTFIX de homologação **local**) |
| customers | 18 |
| deals | 37 |
| policies | 11 |
| activities | 249 |

Este banco local **já tem** as 27 migrations. **Não** foi resetado.

---

## Fase 1 — Release Git

| Item | Status |
|------|--------|
| Branch `release/crm-operacao-avila` | **Criada** a partir de `feature/rbac-ownership-foundations` |
| Commit local | `47702a5` — `feat(crm): pacote operacional Ávila (CRM-003 a CRM-006.4) para primeiro ambiente` (695 files) |
| `schema.prisma` / 12 migrations / API / BFF / WEB / jobs / seeds | **Incluídos** nesse commit |
| `main` | **Não** alterada |
| Push | **Não** executado |

Nada foi descartado (`reset`/`clean` não rodaram).

---

## Fase 2 — Migrations (não aplicadas no cloud)

`npx prisma migrate status`:

| Alvo | Resultado |
|------|-----------|
| Local `localhost` | 27 found, **up to date** |
| Neon `ep-flat-grass` | 27 found, **12 not yet applied** (exit 1 = pendente; **não** é deploy) |

Ordem pendente no Neon (aplicar só depois do Railway HML/operacional apontar **este** banco):

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
11. `20260820240000_sales_pipeline_inteligente` — **UPDATE** `deals.stage` (4 linhas demo)  
12. `20260820250000_sales_targets_commissions`  

Destrutivas (`DROP TABLE` / `TRUNCATE` / `DROP COLUMN`): **nenhuma**.  
`prisma migrate deploy` **não** foi executado. `prisma migrate reset` **não** foi executado.

---

## Fase 3 — Infra e variáveis (sem valores secretos)

| Componente | Status |
|------------|--------|
| Railway API operacional | **404 Application not found** — serviço ausente ou domínio órfão |
| Vercel WEB operacional | **No ar** (login 200), build antigo (sem CRM-006.4) |
| PostgreSQL Neon | **Alcançável** via `.env.development` |
| Redis cloud | **Não verificado** (API `/health/redis` 404; `REDIS_URL` **AUSENTE** em `.env.development`) |
| CLI `railway` / `vercel` / `gh` | **Não instalados** |

| Variável | Arquivo local `.env.development` | Serviço Railway/Vercel operacional |
|----------|----------------------------------|-------------------------------------|
| `DATABASE_URL` | CONFIGURADA (Neon pooled) | **AUSENTE / inacessível** (serviço 404) |
| `DATABASE_URL_DIRECT` | CONFIGURADA (Neon direct) | **AUSENTE / inacessível** |
| `REDIS_URL` | **AUSENTE** | **AUSENTE / inacessível** |
| `JWT_SECRET` | CONFIGURADA (não exibida) | **AUSENTE / inacessível** |
| `CORS_ORIGIN` | CONFIGURADA (aponta web HML 404) | **AUSENTE / inacessível** |
| `API_PUBLIC_URL` | **AUSENTE** | **AUSENTE / inacessível** |
| `OWNERSHIP_ENFORCEMENT` | **AUSENTE** neste arquivo | **AUSENTE / inacessível** |
| `AUTH_SECRET` | CONFIGURADA (não exibida) | Vercel prod: presumida CONFIGURADA (login page sobe); valor não lido |
| `API_INTERNAL_URL` | CONFIGURADA (API HML 404) | Vercel prod: documentada como API custom domain **404** |
| `API_URL` | **AUSENTE** | **AUSENTE / inacessível** |

Não foram copiados secrets de um ambiente para outro.

---

## Fase 4 — Deploy (não executado)

Critérios da tarefa:

| Critério | Avaliação |
|----------|-----------|
| Banco sem dados reais | **Atendido** no Neon inspecionado (0 leads; 2 customers demo) |
| Migrations seguras | **Atendido** (sem DROP; remap só de funil demo) |
| Ambiente correto | **Não atendido** — API Railway 404, Redis cloud ausente, sem CLI de deploy |

Por isso **não** houve:

- `prisma migrate deploy` no Neon  
- seed  
- redeploy Railway  
- redeploy Vercel  
- push para `origin` / `main`

O boot `apps/api/scripts/start-release.cjs` aplicaria as 12 migrations **no primeiro start** se o Railway voltasse com este código **e** `DATABASE_URL` = este Neon. Isso só deve ocorrer **depois** de o serviço API ser recriado e a URL conferida.

---

## Fase 5 — Smoke test

Smoke no cloud operacional: **não executado** (API 404). Login BFF em produção mascararia 404 da API como 401.

Smoke local (já documentado em `avila-production-readiness.md`, 74%): API/DB/Redis 200; personas `admin`, `gerencia`, `comercial`, `parceiro` validadas; `imoveis@` existe **só no local**. Cloud Neon **não tem** `imoveis@` — seed HML/operacional será necessário **depois** do migrate, no Neon, nunca com `migrate reset`.

| Área | Cloud operacional | Local |
|------|-------------------|-------|
| Login | Bloqueado (API 404) | OK seed |
| Leads | — | OK |
| Clientes | — | OK (ownership da lista ainda incompleto) |
| Customer 360 | — | OK |
| Pipeline | — | OK (HOTFIX-001) |
| Agenda | — | OK (fix comercial 500) |
| Renovações | — | OK |
| Importações | — | OK (planilha teste) |
| Ownership | — | OK em leads |
| Business Units | tabela ausente no Neon | 2 BUs |
| ACL | — | OK ressalvas parceiro/comercial |
| Comissões | — | OK HOTFIX-001 |
| Questionários | 0 submissions no Neon | OK |

---

## Problemas encontrados

1. Serviço Railway da API operacional **não existe** ou o domínio aponta para deployment apagado.  
2. Redis cloud não configurado no env de development.  
3. Web Vercel operacional está **desalinhada** da API (front antigo, API morta).  
4. Neon sem `business_units` e sem persona `imoveis@`.  
5. Sem `.env.production` — não há segunda URL de banco para cruzar com o Neon.  
6. `start-release.cjs` auto-migrate: risco se o serviço errado receber este código.

---

## O que já está pronto para o *próximo* deploy (quando o Railway existir)

1. Neon inspecionado: **sem carteira real**.  
2. 12 migrations listadas, ordem confirmada, não destrutivas.  
3. Branch `release/crm-operacao-avila` criada.  
4. Homologação local CRM-006.4 com ressalvas.  
5. Após API 200: `migrate deploy` neste Neon → seed personas/BUs (`imoveis@`, `corretora-avila`) → smoke das 4+1 personas.  
6. **A partir do primeiro import real da Ávila, este Neon vira operacional: proibido reset/clean/migrate reset.**

---

## Próximo passo (não é CRM-007)

1. Recriar Railway `insureflow-api` (ou equivalente) apontando **esta** branch e **este** Neon + Redis.  
2. Conferir `DATABASE_URL` no painel (host Neon, não localhost).  
3. Autorizar push de `release/crm-operacao-avila`.  
4. Deploy API → esperar `/health` `/health/db` `/health/redis` = 200.  
5. `migrate deploy` (ou deixar o boot fazer, **só** com URL Neon conferida).  
6. Seed **necessário** (BUs + `imoveis@`) — somente neste Neon, com `SEED_DEV_DATA=1` pontual.  
7. Apontar Vercel `corretoraavila.com.br` para a mesma branch; `API_INTERNAL_URL` = API viva.  
8. Homologação assistida com planilha de teste; depois carteira real.

---

## Resumo executivo

| Item | Valor |
|------|--------|
| Ambiente cloud inspecionado | Neon `ep-flat-grass-ajh8n0no` / `insureflow` |
| URL API | https://api.corretoraavila.com.br → **404** |
| URL WEB | https://corretoraavila.com.br/login → **200** (build antigo) |
| Migrations aplicadas neste passo | **Nenhuma** no cloud (12 ainda pendentes no Neon) |
| Seed neste passo | **Não** |
| Health cloud | **Não 200** |
| Smoke cloud | **Não executado** |
| Dados reais Ávila no Neon | **Não encontrados** |
| Classificação | **DEPLOY BLOQUEADO** |

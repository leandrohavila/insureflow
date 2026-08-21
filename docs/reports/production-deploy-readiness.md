# Deploy readiness — Ávila Corretora

**Data da auditoria:** 21 de agosto de 2026  
**Escopo:** estado do repositório + CRM-006.4 e ajustes posteriores, antes de qualquer promoção para HML ou produção.  
**Método:** somente leitura. Nenhuma migration foi aplicada em cloud. Nenhum seed. Nenhuma importação de dados reais. Nenhum dado alterado. Nenhum código de aplicação alterado nesta auditoria.

---

## Veredito

| Ambiente | Classificação |
|----------|----------------|
| **A) HML (cloud) para homologação assistida** | **NOT READY** |
| **B) Produção para receber este release** | **NOT READY** |
| Homologação local (já executada neste workstation) | READY WITH WARNINGS — ver `docs/reports/avila-production-readiness.md` (74%) |

**Não subir este working tree para produção.**  
**Não apontar Railway/Vercel de produção para esta branch enquanto o working tree não estiver commitado, revisado e homologado em HML isolado.**

---

## Respostas executivas

### A) HML está pronto para homologação?

**NOT READY.**

Não existe ambiente HML cloud funcional. Os hosts documentados respondem 404 (`Application not found` no Railway; `DEPLOYMENT_NOT_FOUND` na Vercel). O Neon referenciado em `.env.development` está inalcançável (`P1001`). Redis HML não está configurado no arquivo local de development. O código do CRM-006.4 **não está commitado**.

A homologação assistida **local** (API `:4000`, Postgres `localhost/insureflow`, Redis `127.0.0.1:6379`) já rodou com ressalvas — isso **não** substitui HML compartilhado para a corretora.

### B) Produção está pronta para receber este release?

**NOT READY.**

Motivos cumulativos:

1. O release CRM-006.4 (e todo o bloco CRM-003 → 006.x) está só no working tree — **zero commits** desse pacote.
2. São **12 migrations** ainda não versionadas no Git, incluindo remap de `deals.stage`. O boot da API (`apps/api/scripts/start-release.cjs`) executa `prisma migrate deploy` automaticamente. Um deploy Railway aplicaria essas migrations em produção sem passo manual.
3. A API pública de produção (`api.corretoraavila.com.br` e o fallback Railway documentado) está **fora do ar** (404 Railway). A web Vercel está no ar, mas o BFF trata qualquer `!res.ok` do login como “e-mail ou senha incorretos”, o que mascara API morta.
4. Não há `.env.production` nesta máquina; `DATABASE_URL` e Redis de produção **não foram inspecionados** (e não devem ser usados para migrate/seed).
5. Importador faz **upsert por CPF/CNPJ** (update in-place). Importar carteira real em produção neste estado é risco direto de alteração de dados.

### C) Quais passos exatos para chegar à homologação assistida?

Ver seção [Roteiro para homologação assistida](#roteiro-para-homologação-assistida-hml). Resumo: commit em branch própria → recriar HML (Railway + Vercel + Neon + Redis) **separado de produção** → `migrate deploy` **somente no Neon HML** → seed HML se necessário → deploy HML → smoke + personas → só então discutir produção.

---

## 1. Branch atual

| Item | Valor |
|------|--------|
| Branch | `feature/rbac-ownership-foundations` |
| HEAD | `0c8385ba84428c96c1345a2fbea12284e741d772` |
| Mensagem | `fix(web): add leads:share label for Vercel HML build` |
| Upstream | `origin/feature/rbac-ownership-foundations` (HEAD = origin; **nada a pushar** deste commit) |
| Remote | `https://github.com/leandrohavila/insureflow.git` |

O HEAD commitado é Sprint 2 (RBAC/ownership). **Não contém CRM-006.4.** O que está rodando localmente é HEAD **mais** um working tree enorme.

Runtime local (`GET /api/v1/health/runtime`):

```
version=0.0.1
commit=0c8385ba84428c96c1345a2fbea12284e741d772
environment=development
runtime=local
```

O endpoint `/health/runtime` existe só no código não commitado; o `commit` reportado é o HEAD git, não um SHA do CRM-006.4.

---

## 2. Commits pendentes / working tree

**Commits não enviados desta feature:** nenhum (sincronizada com origin).

**Working tree sujo (bloqueante):**

| Tipo | Quantidade (aprox.) |
|------|---------------------|
| Arquivos modificados (tracked) | 157 |
| Arquivos untracked | 721 |
| Diff tracked | +10 604 / −5 919 linhas |

Isso inclui, no mesmo lote não versionado:

- CRM-006 / 006.1 / 006.2 / 006.3 / **006.4**
- importador, agenda, carteira de renovação, Customer 360 estendido
- multiempresa, cotações, propostas, Evolution API, metas/comissões
- 12 pastas de migration
- `exceljs` em `apps/api/package.json`
- templates `docs/templates/importacao/LEADS.xlsx` e `CLIENTES.xlsx`
- relatórios em `docs/reports/`

**Não há um commit isolado de CRM-006.4.** Promover “só o 006.4” exigiria split consciente; o estado atual é um monólito de working tree.

`develop` local **diverge** de `origin/develop`:

| Ref | SHA | Data | Nota |
|-----|-----|------|------|
| `develop` local | `67a2e9c` | 2026-05-27 | `fix(crm): activities PATCH…` (ahead 2) |
| `origin/develop` | `84990af` | 2026-06-26 | `style(web): increase login spacing` (behind 2 no local) |
| `origin/main` | `779a0c6` | 2026-05-19 | merge Prisma stabilization |
| `main` local | `412d111` | 2026-05-17 | **behind 3** vs origin/main |

`railway.toml` documenta deploy a partir de **`develop`**. Produção, se ainda segue `origin/develop`, está no estilo de login de junho/2026 — **meses atrás** deste working tree.

---

## 3 e 12. Migrations pendentes e status

### Local (`APP_ENV` default → `localhost:5432/insureflow`)

```
27 migrations found
Database schema is up to date!
```

Prisma Client gerado: **6.19.3**, com delegates `businessUnit`, `businessUnitPipeline`, `salesTarget`, `policyRenewal`. Alinhado ao schema do working tree.

### Commitadas no Git (HEAD)

Até `20260527120000_ownership_foundations` (15 migrations + lock). Produção, se estiver em `develop`/`main` antigos, pode nem ter essa.

### Não commitadas (presentes só no disco) — **12**

| Migration | Efeito principal | Risco de dados |
|-----------|------------------|----------------|
| `20260701120000_add_quotes_domain` | Tabelas cotações/propostas + enums | Baixo (create) |
| `20260703120000_proposal_center` | `ALTER TYPE` ProposalStatus | Baixo (additive) |
| `20260708153000_deal_owner_user_id` | Coluna + **UPDATE** `deals.owner_user_id` a partir do lead | Médio (preenche owner) |
| `20260724170000_questionnaire_submission_updated_by` | Coluna FK | Baixo |
| `20260820120000_multiempresa_reactivation` | BUs, templates, cross-sell; **UPDATE** leads (`last_interaction_at`, `lost_at`) | Médio |
| `20260820180000_commercial_recovery` | Follow-ups / renewal comercial | Baixo (create) |
| `20260820190000_commercial_communication` | Communication log/provider | Baixo |
| `20260820200000_user_business_units` | Membership de usuário × BU | Baixo |
| `20260820220000_evolution_api` | `ALTER TYPE` CommunicationStatus | Baixo |
| `20260820230000_customer_360_opportunities` | Oportunidades 360 | Baixo |
| `20260820240000_sales_pipeline_inteligente` | `DealSourceType`, pipelines; **UPDATE `deals.stage`** (qualificacao→contato, negociacao→proposta, fechado→fechamento) | **Alto** |
| `20260820250000_sales_targets_commissions` | metas/comissões; `deals.product_type` | Baixo (create + coluna) |

**CRM-006.4 não adiciona migration própria.** Depende de schema já introduzido sobretudo por `20260820180000` (carteira) e `20260820240000` (`DealSourceType=RENEWAL`). Sem essas, o módulo não sobe.

Nenhum `DROP TABLE` / `TRUNCATE` encontrado nessas SQLs. O risco não é apagar carteira; é **mutar estágios de negócio** e owners, e criar tabelas que a API passará a exigir.

### HML Neon

`npx prisma migrate status` com `APP_ENV=development` (somente status, sem deploy):

```
Can't reach database server at ep-flat-grass-ajh8n0no.c-3.us-east-2.aws.neon.tech:5432
P1001
```

Status de migrations em HML: **desconhecido** (compute suspenso, projeto apagado ou rede bloqueada).

### Produção

**Não executado.** Sem `.env.production` local; política desta auditoria proíbe `migrate deploy` e qualquer escrita. Inferência: se o serviço Railway de produção ainda usa `start-release.cjs` e alguém publicar este código, as 12 migrations pendentes **serão aplicadas no boot**.

---

## 4. DATABASE_URL local

Origem: `.env` / `.env.local` / `apps/api/.env` (valores mascarados).

| Campo | Valor observado |
|-------|-----------------|
| Protocolo | `postgresql` |
| Host | `localhost` |
| Porta | `5432` |
| Database | `insureflow` |
| SSL | não |
| `OWNERSHIP_ENFORCEMENT` | `on` (`.env` e `apps/api/.env`) |
| `APP_ENV` | `local` (`.env.local`) |
| Redis | `127.0.0.1:6379` |

Health local no momento da auditoria: `/health` ok, `/health/db` connected, `/health/redis` connected (`127.0.0.1:6379`).

---

## 5. DATABASE_URL HML

Arquivo: `.env.development` (existe). `.env.staging` **não existe**.

| Campo | Valor observado (mascarado) |
|-------|-----------------------------|
| `APP_ENV` | `development` |
| Pooled | `ep-flat-grass-ajh8n0no-pooler.c-3.us-east-2.aws.neon.tech` / `insureflow` / SSL |
| Direct | `ep-flat-grass-ajh8n0no.c-3.us-east-2.aws.neon.tech` / `insureflow` / SSL |
| `API_INTERNAL_URL` | `https://insureflow-api-dev.up.railway.app` |
| `CORS_ORIGIN` | `https://insureflow-web-dev.vercel.app,http://localhost:3000` |
| `REDIS_URL` | **ausente** neste arquivo |
| `SEED_DEV_DATA` | `1` |

`prisma.config.ts` troca `DATABASE_URL` por `DATABASE_URL_DIRECT` quando esta existe. Qualquer `db:deploy` com `APP_ENV=development` miraria esse Neon — **hoje inalcançável**.

Isso **não** é o banco de produção (pelo menos não pelo naming/CORS). Continua proibido usar essa URL para seed/import em produção; também não serve como HML até o Neon voltar.

---

## 6. DATABASE_URL produção

| Fonte | Resultado |
|-------|-----------|
| `.env.production` nesta máquina | **Ausente** |
| `.env.production.example` | Placeholder `ep-PROD-pooler.neon.tech` — sem credencial real |
| API pública `/health/db` | Não inspecionável (serviço 404) |
| Railway variables | CLI `railway` **não instalada**; dashboard não lido |

**Conclusão:** host/credencial de produção **não confirmados nesta auditoria**. Não assumir que o Neon `ep-flat-grass-*` seja produção. Não apontar migrate/seed para URL de produção.

---

## 7. Configuração Railway da API

Arquivo canônico: `/railway.toml` (raiz). Legado: `apps/api/railway.toml`.

| Item | Config no repo |
|------|----------------|
| Builder | Dockerfile `apps/api/Dockerfile` |
| Branch documentada | `develop` |
| Healthcheck | `GET /api/v1/health` (timeout 120s) |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| Start | **CMD** `node scripts/start-release.cjs` → **`prisma migrate deploy` + boot** |
| Watch | `apps/api/**`, `packages/database/**`, `scripts/**`, lockfiles |

**Runtime público (21/08/2026):**

| URL | HTTP | Corpo |
|-----|------|--------|
| `https://api.corretoraavila.com.br/api/v1/health` | 404 | Railway `Application not found` |
| `https://insureflow-production-08c5.up.railway.app/api/v1/health` | 404 | idem |
| `https://insureflow-api-dev.up.railway.app/api/v1/health` | 404 | idem |
| Qualquer path no custom domain (`/`, `/docs`, `/api/v1/auth/login`) | 404 | idem |

O go-live de 2026-05-27 (`docs/infra/go-live-production.md`) descrevia API Active. **Esse estado não se reproduz hoje na internet pública.** Serviço removido, projeto suspenso, ou domínio apontando para deployment inexistente.

---

## 8. Configuração Vercel da WEB

`apps/web/vercel.json`:

- Framework Next.js, região `gru1`
- `installCommand`: `cd ../.. && npm ci`
- `buildCommand`: `cd ../.. && npx turbo run build --filter=web`
- Redirect permanente `www.corretoraavila.com.br` → apex

`vercel.json` na raiz do monorepo (untracked) declara `experimentalServices.api` — **não** é o que está no ar em produção.

**Runtime público:**

| URL | HTTP | Nota |
|-----|------|------|
| `https://corretoraavila.com.br/` | 307 | → `/login` |
| `https://corretoraavila.com.br/login` | 200 | Vercel `gru1` |
| `https://www.corretoraavila.com.br/login` | 308 | → apex |
| `https://corretoraavila.com.br/api/auth/me` | 401 | BFF vivo (`Não autenticado`) |
| `https://insureflow-web-dev.vercel.app/` | 404 | `DEPLOYMENT_NOT_FOUND` |

Login BFF (`POST /api/auth/login` com senha dummy ≥ 8): **401** `E-mail ou senha incorretos`. Isso **não prova** que a Nest está no ar: `loginWithBackendCredentials` faz `if (!res.ok) return null` — um 404 Railway vira a mesma mensagem de credencial inválida.

Variáveis Vercel produção (documentadas, não lidas no dashboard): `AUTH_SECRET`, `API_INTERNAL_URL=https://api.corretoraavila.com.br`. Se `API_INTERNAL_URL` ainda aponta para o custom domain 404, o login de produção está quebrado mesmo com a página de login 200.

CLI `vercel` / `gh` **não disponíveis** neste workstation.

---

## 9. Variáveis de ambiente necessárias

### API (Railway HML e, no futuro, produção)

| Variável | HML | Produção | Notas |
|----------|-----|----------|--------|
| `DATABASE_URL` | Neon HML pooled | Neon **prod** pooled | Nunca misturar |
| `DATABASE_URL_DIRECT` | Neon HML direct | Neon prod direct | Só migrate; `prisma.config.ts` promove direct se definida |
| `REDIS_URL` | Redis HML (`${{Redis.REDIS_URL}}`) | Redis prod Railway | **Não** `127.0.0.1` |
| `JWT_SECRET` | ≥ 32 chars, **distinto** de prod | ≥ 32, rotacionável | |
| `CORS_ORIGIN` | URL Vercel HML + localhost se preciso | `https://corretoraavila.com.br,https://www.corretoraavila.com.br` | Redeploy após mudar |
| `PORT` | `4000` | `4000` | |
| `NODE_ENV` | `production` | `production` | |
| `APP_ENV` | `development` ou `staging` | `production` | |
| `OWNERSHIP_ENFORCEMENT` | `shadow` ou `on` (acordar) | **não ligar** até HML assinado; local está `on` | Docs Sprint 2: prod `off` até validar |
| `API_PUBLIC_URL` | URL pública da API HML | `https://api.corretoraavila.com.br` | Webhook Evolution (CRM-004); fora do 006.4 |
| `SEED_DEV_DATA` | `1` só se seed HML for explícito | **`0` / ausente** | Nunca seed em produção |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | 60 / 100 | 60 / 100 | |

### Web (Vercel)

| Variável | HML | Produção |
|----------|-----|----------|
| `AUTH_SECRET` | ≥ 32, distinto | ≥ 32 |
| `API_INTERNAL_URL` | URL Railway HML **viva** | URL API prod **viva** |
| `API_URL` | fallback opcional | fallback opcional |

CRM-006.4 **não exige** variável nova além das acima. Evolution/WhatsApp Inbox **não** entram neste release.

---

## 10. Redis HML e produção

| Ambiente | Evidência | Status |
|----------|-----------|--------|
| Local | `/health/redis` → `127.0.0.1:6379` | OK |
| HML | `REDIS_URL` ausente em `.env.development`; API HML 404 | **Não funcional** |
| Produção | `/health/redis` público 404; URL real não lida | **Não verificável**; docs pedem `${{Redis.REDIS_URL}}` interno |

Filas BullMQ (SLA 07:00 America/Sao_Paulo, reativação, automação comercial) **não rodam** sem Redis cloud. Homologar agenda/SLA em HML exige Redis HML dedicado — não o Redis de produção e não `127.0.0.1` no Railway.

---

## 11. Prisma Client

| Item | Valor |
|------|--------|
| Versão pinada | `6.19.3` (`package.json` overrides + `@prisma/client`) |
| Generate local | `node_modules/.prisma/client` presente |
| Garantia de build | `apps/api/scripts/ensure-prisma-client.cjs` (prebuild) |
| Docker | `npm run build -w @repo/database` no stage builder |

Client local **inclui** o schema do working tree (BUs, sales targets, policy renewal). Um deploy a partir do HEAD git **sem** o working tree geraria client **sem** esses modelos — incompatível com o código CRM-006.4.

---

## 13. Versão atualmente publicada em produção

Não há tag/release Git utilizável nesta máquina (`gh` ausente). Inferência por runtime:

| Superfície | O que está no ar |
|------------|------------------|
| Web | Next na Vercel `gru1`, domínio `corretoraavila.com.br`, login page 200. Commit **não exposto** no HTML. Certamente **não** é o working tree CRM-006.4 (rotas `/crm/importacoes` etc. não existem no HEAD). |
| API pública | Railway **Application not found** — versão da API **não lida**. |
| `origin/develop` | `84990af` (2026-06-26) — candidato mais provável se o serviço ainda buildava `develop`. |
| Go-live documentado | 2026-05-27, API `0.0.1` era o package da API. |

**Conclusão:** produção publicada ≪ working tree local (dezenas de módulos e 12 migrations de diferença). Não há “hotfix pequeno”; é um salto de plataforma.

---

## 14. Diferenças local × HML × produção

| Dimensão | Local (agora) | HML cloud | Produção |
|----------|---------------|-----------|----------|
| Código CRM-006.4 | Presente (uncommitted) | Ausente (hosts 404) | Ausente |
| Postgres | `localhost/insureflow`, 27 migrations aplicadas | Neon `ep-flat-grass-*` **offline** | Desconhecido; API pública down |
| Redis | Docker/local `6379` | Não configurado no env de dev | Não verificável |
| Ownership | `on` | Docs: `shadow`; env HML local sem a var | Docs: `off` até HML; example de prod **omite** a var |
| Seed | `SEED_DEV_DATA=1` | Pretendido `1` | Deve permanecer `0` |
| Web | `:3000` | 404 Vercel preview | 200 login Vercel |
| API | `:4000` saudável | 404 Railway | 404 Railway público |
| Importações / agenda / carteira | Homologado local 74% | Não existe | Não existe |

---

## 15. Existe ambiente HML funcional?

**Não.** Evidência direta:

- `https://insureflow-api-dev.up.railway.app` → 404 Application not found  
- `https://insureflow-web-dev.vercel.app` → 404 DEPLOYMENT_NOT_FOUND  
- Neon HML → P1001  
- Relatórios Sprint 2 (maio/2026) e `sprint-2-closure.md` já registravam HML cloud não executado / 404  

O que existe hoje como “homologação” é **somente o stack local** desta máquina.

---

## Validação específica — CRM-006.4 e ajustes posteriores

Fonte: código no working tree + `docs/reports/crm-006-4-operacao-comercial.md` + `docs/reports/avila-production-readiness.md`.

### O que o módulo entrega (não commitado)

| Fase | Entrega | Git |
|------|---------|-----|
| 1 Importador | `/crm/importacoes`, XLSX oficial, preview, upsert CPF, `exceljs` | untracked / `app.module.ts` modified |
| 2 Carteira | `/crm/renovacoes-carteira`, filtros, deal `sourceType=RENEWAL`, atividade | untracked |
| 3 Agenda | `GET /commercial-agenda`, visões hoje/atrasada/7/30 | untracked + `agenda/page.tsx` modified |
| 4 Customer 360 | `renewalBook` + aba agenda | `customer-360.service.ts` untracked/modified |

### Ajustes posteriores à 1ª homologação (já no disco)

1. Layout oficial Ávila (aliases do layout antigo). Modelos em `docs/templates/importacao/`.
2. `dueInDays` inclui o último dia (`setUTCHours(23, 59, 59, 999)` em `policy-renewals.service.ts`).
3. Agenda comercial: `leadWhere` / `dealWhere` / `customerWhere` separados — evita HTTP 500 no perfil comercial.

### Ressalvas que **viajam** com o release (não são bugs de deploy, são produto)

- WhatsApp / Cidade / UF **sem coluna**; vão para `notes` (leads) ou são descartados (clientes).
- Sem enum `PROPOSAL_SENT`.
- Listagem de clientes **não** é ownership-scoped (só BU) — comercial vê a mesma lista que admin na auditoria.
- Comercial **403** em importação de clientes (`clients:manage`).
- Parceiro **403** em carteira/agenda/360.
- Overlay de hidratação residual (`login-form` / `app-sidebar`).
- Import **atualiza** registro existente pelo CPF — inadequado para produção sem backup e sem piloto controlado.
- HOTFIX-001 (Kanban, 360, WON→comissão, ownership de leads) está no mesmo working tree; não quebrar esses fluxos na HML.

### O que CRM-006.4 **não** precisa para HML

- Migration extra além das 12 já listadas.
- Variável de ambiente nova.
- Seed de produção.
- WhatsApp Inbox / Instagram (CRM-007) — fora de escopo.

---

## O que já pode ser promovido para HML

**Nada, neste instante**, para um HML cloud — o destino não existe.

Quando o HML for recriado, o **candidato** a promover é o working tree local (após commit), não o HEAD `0c8385b`. Conteúdo mínimo para o 006.4 funcionar:

- módulos `commercial-import`, `commercial-agenda`, `policy-renewals` (extensões)
- web: importações, renovacoes-carteira, agenda workspace, BFF `FormData` / XLSX
- migrations `20260820120000` … `20260820250000` (e as de julho, se o banco HML ainda estiver no schema de maio)
- `exceljs` + lockfile
- Prisma schema atualizado

Não promover direto de `feature/rbac-ownership-foundations` HEAD: falta o código.

Não promover para o serviço Railway de **produção** mesmo que o HML seja a mesma conta — serviços e `DATABASE_URL` precisam ser distintos.

---

## O que ainda precisa ser commitado

Tudo o que está dirty, em especial:

- 12 migrations em `packages/database/prisma/migrations/202607*` e `202608*`
- `packages/database/prisma/schema.prisma`
- `apps/api/src/modules/commercial-import/**`, `commercial-agenda/**`, `policy-renewals/**`
- registros em `app.module.ts`
- telas e BFFs web listados no `git status`
- `apps/api/package.json` (`exceljs`) + `package-lock.json`
- templates XLSX e relatórios de homologação, se forem parte do pacote de release

Recomendação de processo (não executado aqui): branch nova a partir de um base acordado (`develop` reconciliado), **não** commit direto em `main`. Split em PRs menores é desejável, mas o 006.4 não sobe sem as migrations 20260820\*.

---

## Migrations que precisam ser aplicadas

**Somente em HML**, depois de backup/branch Neon HML, com `APP_ENV=development` e `DATABASE_URL_DIRECT` do Neon HML:

```text
npm run db:deploy
```

Ordem: as 12 pastas untracked, na ordem dos timestamps. Local já está aplicado — não reaplicar local.

**Produção: não aplicar nesta fase.** Se o Railway de produção for redeployado com este código, o `start-release.cjs` aplicará sozinho — esse é o principal risco de perda/alteração de dados.

Mitigação futura (depois da HML, em PR separado): gate de migrate no boot (`APP_ENV=production` exigir flag explícita) **ou** migrate só em job de release, nunca implícito. Isso seria mudança de código — fora desta auditoria.

---

## Riscos de deploy

| Risco | Severidade | Detalhe |
|-------|------------|---------|
| Working tree não commitado | Crítica | Deploy a partir do Git **não leva** o 006.4 |
| Auto-migrate no boot Railway | Crítica | 12 migrations, incluindo remap de stage, em qualquer serviço que receba o Dockerfile |
| HML = produção por engano | Crítica | Um `DATABASE_URL` errado no Railway HML destrói/altera prod |
| API prod 404 | Alta | Custom domain e fallback documentados mortos; web órfã |
| BFF mascara API down como 401 | Alta | Homologação “login falhou” pode ser infra |
| `OWNERSHIP_ENFORCEMENT=on` em prod | Alta | Listagens de leads mudam; parceiro/comercial veem menos |
| Redis ausente em cloud | Alta | Crons SLA/reativação/agenda quebram ou degradam |
| Neon HML P1001 | Alta | Não há destino para migrate HML hoje |
| `develop` divergente | Média | Merge base sujo (ahead/behind 2) |
| Seed `SEED_DEV_DATA=1` copiado para prod | Crítica | Proibido |
| Dependência `exceljs` | Baixa | Precisa ir no lockfile; Docker `npm ci` precisa do commit |
| Volume do diff | Alta | Review único é inviável; regressão HOTFIX-001 possível |

---

## Riscos de perda ou alteração de dados

| Ação | Efeito | Permitido agora? |
|------|--------|------------------|
| `prisma migrate deploy` em produção | Cria tabelas; **UPDATE de `deals.stage` e owners**; preenche timestamps de lead | **Não** |
| Seed em produção | Insere/sobrescreve usuários e massa demo | **Não** |
| Import XLSX real em produção | **UPDATE** de leads/clientes existentes pelo CPF + cria apólices | **Não** |
| Import XLSX em HML com cópia de prod | Mesmo upsert sobre dados reais clonados | Só com Neon branch isolado e aceite explícito |
| `ON DELETE CASCADE` nas FKs novas | Só afeta linhas das **tabelas novas** se o pai for apagado | Aceitável em HML |
| Remap de stage (`fechado`→`fechamento` etc.) | Kanban de produção passaria a outro vocabulário | Bloqueante até HML + backup |

Não há `DROP TABLE` nas migrations pendentes. O cenário de “perder a carteira” é mais **update em massa** (estágios, owners, upsert de import) do que delete. Continua inaceitável em produção sem backup Neon (child branch) e sign-off.

---

## Roteiro para homologação assistida (HML)

Ordem obrigatória. Nenhuma linha aplica-se a produção.

1. **Congelar o escopo**  
   CRM-006.4 + correções (layout XLSX, `dueInDays`, agenda comercial). Sem CRM-007. Sem import de planilha real da corretora até o HML estar verde.

2. **Reconciliar Git (sem push para `main`)**  
   - Criar branch de release (ex. `release/hml-crm-006-4`) a partir do `develop` remoto atualizado.  
   - Commitar o working tree (ou o subset mínimo listado acima).  
   - Resolver divergência local/origin `develop` **antes** de pedir deploy Railway `develop`.  
   - Não misturar `.env`, `.env.development` (já gitignored) nem `railway-diagnose-out.txt`.

3. **Recriar infra HML — projeto/serviço separados de produção**  
   - Railway: serviço API novo (não o de `api.corretoraavila.com.br`). Branch = branch de release. Root `/`, `railway.toml`. Start Command vazio.  
   - Redis plugin **no mesmo projeto HML**. `REDIS_URL=${{Redis.REDIS_URL}}`.  
   - Neon: **branch/projeto HML**. Se `ep-flat-grass-*` estiver morto, criar outro. Nunca colar URL de produção.  
   - Vercel: preview/projeto HML (`insureflow-web-dev` ou novo). `API_INTERNAL_URL` = URL Railway HML **depois** do health 200.

4. **Variáveis HML** (seção 9). `SEED_DEV_DATA=0` até alguém pedir seed; `OWNERSHIP_ENFORCEMENT=on` se a homologação local (já feita com `on`) deve se repetir.

5. **Schema só no Neon HML**  
   ```text
   APP_ENV=development
   # DATABASE_URL_DIRECT = neon HML
   npm run db:deploy
   ```  
   Confirmar `prisma migrate status` = up to date. **Não** usar `db:push`. **Não** rodar isso com URL de produção.

6. **Seed HML (opcional, explícito)**  
   Personas `admin@` / `gerencia@` / `comercial@` / `parceiro@` e BUs `corretora-avila` / imóveis. Proibido em produção. Sem isso, importador e ACL de BU quebram (tabela `business_units` vazia após migrate).

7. **Deploy HML**  
   Railway redeploy API → esperar `/api/v1/health`, `/health/db`, `/health/redis` = 200.  
   Vercel deploy web → `/login` 200.  
   `CORS_ORIGIN` com a URL web real.  
   `npm run hml:deploy:verify` com `API_URL` e `WEB_URL` HML.

8. **Homologação assistida (pessoas Ávila + time)**  
   Checklist mínimo (já validado localmente; repetir no HML):  
   - Login 4 personas  
   - Import preview + commit **planilha de teste** (não a carteira real)  
   - Carteira 60/30/15/vencido + deal `RENEWAL`  
   - Agenda comercial (não pode 500)  
   - Customer 360 abas renovação/agenda  
   - HOTFIX-001: Kanban, criar lead, WON→comissão, ownership de leads  
   - Confirmar que comercial continua 403 em import de clientes (esperado)

9. **Critério para falar em produção (ainda não executar)**  
   - HML estável ≥ ciclo combinado  
   - API produção **restaurada** (hoje 404) e health público 200  
   - Backup Neon prod (child branch)  
   - `SEED_DEV_DATA` ausente  
   - Decisão explícita sobre `OWNERSHIP_ENFORCEMENT`  
   - Decisão explícita sobre migrate no boot  
   - Import real só depois do piloto HML, com preview obrigatório e backup

---

## O que esta auditoria deliberadamente **não** fez

- Alterar código da aplicação  
- `prisma migrate deploy` em HML ou produção  
- Seed  
- Import de dados reais  
- Push, merge, PR  
- Login com credenciais reais de produção  
- Leitura de secrets completos (apenas host/db mascarados)

---

## Referências

- `docs/reports/avila-production-readiness.md` — 74%, APROVADO COM RESSALVAS (local)  
- `docs/reports/crm-006-4-operacao-comercial.md`  
- `docs/reports/hotfix-001-operational-stabilization.md`  
- `docs/infra/go-live-production.md` — estado **histórico** (2026-05-27), **não** reproduzido na API pública hoje  
- `docs/infra/environments.md`, `docs/infra/release-checklists.md`  
- `docs/architecture/sprint-2-hml-deploy-guide.md`, `docs/sprint-notes/sprint-2-closure.md`

---

## Classificação final

```
A) HML cloud ............... NOT READY
B) Produção deste release .. NOT READY
   Homologação local 006.4 . READY WITH WARNINGS (74%, já documentado)
```

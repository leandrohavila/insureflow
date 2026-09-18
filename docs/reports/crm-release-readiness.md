# CRM-RELEASE-001 — Prontidão para HML

**Data:** 21 de agosto de 2026  
**Objetivo:** preparação técnica e documental para homologação assistida da Ávila Corretora.  
**Não executado nesta tarefa:** deploy, push, `git add`/`commit`, `prisma migrate deploy`, `db push`, seed, alteração de produção.

---

## Classificação

# NOT READY

A preparação **documental** está completa. O Prisma local está válido. O working tree **não** está commitado e **não** existe HML cloud utilizável. O próximo passo autorizado é Git (branch + commit) e, depois, recriação da infra HML — ainda não o deploy.

---

## Bloqueios (exatos)

| # | Bloqueio | Por que impede HML |
|---|----------|-------------------|
| 1 | Working tree não commitado | Railway/Vercel só deployam o que está no Git. HEAD `0c8385ba` **não** contém CRM-003…006.4 |
| 2 | Branch `release/crm-operacao-avila` não criada | Estratégia definida; comando ainda não rodado (working tree intacto) |
| 3 | API HML 404 | `https://insureflow-api-dev.up.railway.app` → Railway `Application not found` |
| 4 | Web HML 404 | `https://insureflow-web-dev.vercel.app` → `DEPLOYMENT_NOT_FOUND` |
| 5 | Neon HML inalcançável | `ep-flat-grass-ajh8n0no.c-3.us-east-2.aws.neon.tech` → `P1001` |
| 6 | Redis HML ausente | `REDIS_URL` não existe em `.env.development`; serviço cloud HML não existe |
| 7 | Variáveis HML cloud | Todas **PRECISA SER CRIADA** no Railway/Vercel HML (ver § Variáveis) |
| 8 | Divergência `develop` | Local ahead 2 / behind 2 vs `origin/develop` — reconciliar **antes** de apontar Railway para `develop` |

Não são bloqueios de schema: `prisma validate` passou; 27 migrations locais aplicadas; sem `DROP TABLE` nas 12 pendentes de Git.

Quando os itens 1–7 forem resolvidos, a classificação pode passar a **READY FOR HML** *para deploy HML* — ainda **não** para produção.

---

## Fase 1 — Working tree

Ver manifesto completo: [`docs/reports/crm-release-manifest.md`](./crm-release-manifest.md).

| | Quantidade |
|--|--:|
| Paths dirty | 879 |
| **INCLUIR no commit** | **695** |
| Não incluir (logs/artifacts) | screenshots, `dist-test`, `tsc.log`, `railway-diagnose-out.txt`, `vercel.json` raiz |
| Nada foi apagado do disco | sim |

---

## Fase 2 — Migrations (desde CRM-003)

Nenhuma migration foi executada nesta tarefa. Status HML/produção = inferência (sem `migrate deploy`).

Ordem de aplicação (timestamps Prisma, **obrigatória**):

| # | Migration | Data (timestamp) | Feature | Dependências | Git | Local | HML | Produção |
|---|-----------|------------------|---------|--------------|-----|-------|-----|----------|
| 1 | `20260701120000_add_quotes_domain` | 2026-07-01 | CRM-003 cotações | schema leads/deals/customers (já no HEAD antigo) | **untracked** | Sim | Desconhecido (Neon down) | **Não aplicar** |
| 2 | `20260703120000_proposal_center` | 2026-07-03 | CRM-003 propostas | #1 (`ProposalStatus`) | untracked | Sim | Desconhecido | **Não aplicar** |
| 3 | `20260708153000_deal_owner_user_id` | 2026-07-08 | ownership de deals | tabela `deals`, `leads.owner_user_id` | untracked | Sim | Desconhecido | **Não aplicar** |
| 4 | `20260724170000_questionnaire_submission_updated_by` | 2026-07-24 | questionários | submissions | untracked | Sim | Desconhecido | **Não aplicar** |
| 5 | `20260820120000_multiempresa_reactivation` | 2026-08-20 | BU + reativação | tenants, leads, customers | untracked | Sim | Desconhecido | **Não aplicar** |
| 6 | `20260820180000_commercial_recovery` | 2026-08-20 | carteira / follow-up | #5 (`business_units`) | untracked | Sim | Desconhecido | **Não aplicar** |
| 7 | `20260820190000_commercial_communication` | 2026-08-20 | CRM-004 comunicações | #5 templates | untracked | Sim | Desconhecido | **Não aplicar** |
| 8 | `20260820200000_user_business_units` | 2026-08-20 | membership BU | #5 | untracked | Sim | Desconhecido | **Não aplicar** |
| 9 | `20260820220000_evolution_api` | 2026-08-20 | CRM-004 Evolution | #7 `CommunicationStatus` | untracked | Sim | Desconhecido | **Não aplicar** |
| 10 | `20260820230000_customer_360_opportunities` | 2026-08-20 | Customer 360 | #5, customers | untracked | Sim | Desconhecido | **Não aplicar** |
| 11 | `20260820240000_sales_pipeline_inteligente` | 2026-08-20 | CRM-006 pipeline / `DealSourceType` | #5 BUs | untracked | Sim | Desconhecido | **Não aplicar** |
| 12 | `20260820250000_sales_targets_commissions` | 2026-08-20 | CRM-006 metas/comissões | #5, deals | untracked | Sim | Desconhecido | **Não aplicar** |

**CRM-006.4** não tem migration própria. Exige pelo menos **#6** (carteira) e **#11** (`sourceType=RENEWAL`).

Mutações de dados (não são DROP, mas alteram linhas existentes):

- #3 `UPDATE deals.owner_user_id` a partir do lead  
- #5 `UPDATE leads.last_interaction_at` / `lost_at`  
- #11 `UPDATE deals.stage` (qualificacao→contato, negociacao→proposta, fechado→fechamento)

Validação local (somente leitura):

```
npx prisma validate     → schema valid
npx prisma migrate status (APP_ENV=local, localhost) → 27 migrations, up to date
DROP TABLE / TRUNCATE nas 12 → nenhum
```

**Ordem correta:** a tabela acima, de 1 a 12. O `migrate deploy` no Neon **HML** (futuro) aplica nessa ordem. O boot Docker (`start-release.cjs`) também — por isso o Railway HML **não pode** apontar para o banco de produção.

Migrations já no Git (HEAD, até `20260527120000_ownership_foundations`) são pré-requisito; produção antiga pode estar atrás disso. HML novo deve aplicar **todas** as 27, não só as 12.

---

## Fase 3 — Estratégia de branch (sem alterar `main`)

### Estado

| | |
|--|--|
| Branch atual | `feature/rbac-ownership-foundations` |
| HEAD | `0c8385ba84428c96c1345a2fbea12284e741d772` (sincronizado com origin) |
| Alterações | **preservadas** — nenhum reset/clean |
| `main` | não será checkout, merge nem push |

### Estratégia

1. Criar `release/crm-operacao-avila` **a partir do HEAD atual** (mantém o working tree).  
2. Não fazer checkout de `main`.  
3. Não apontar Railway de produção para esta branch.  
4. Railway HML: Source = `release/crm-operacao-avila`.  
5. Reconciliar `develop` só depois da HML estável — e nunca via reset do working tree atual.

`git switch -c` **não descarta** arquivos modificados/untracked.

### Comandos (ainda NÃO executar push; commit só com autorização)

PowerShell, na raiz `C:\Projetos\InsureFlow`:

```powershell
# 1) Branch local (working tree permanece)
git switch -c release/crm-operacao-avila

# 2) Stage seletivo — NÃO usar git add -A
git add -- .env.example README.md docker-compose.yml package.json package-lock.json turbo.json
git add -- apps/api/.env.example apps/api/package.json apps/api/src apps/api/test
git add -- apps/api/scripts/ensure-prisma-client.cjs
git add -- apps/api/scripts/homolog-crm-006-4.cjs
git add -- apps/api/scripts/audit-crm-006-4-production.cjs
git add -- apps/web
git add -- packages/auth packages/database packages/typescript-config/library-build.json
git add -- packages/forms-engine packages/forms-library
git add -- docs/templates
git add -- docs/reports/crm-release-manifest.md
git add -- docs/reports/hml-deployment-checklist.md
git add -- docs/reports/crm-release-readiness.md
git add -- docs/reports/crm-006-4-operacao-comercial.md
git add -- docs/reports/hotfix-001-operational-stabilization.md
git add -- docs/reports/avila-production-readiness.md
git add -- docs/reports/production-deploy-readiness.md
git add -- docs/reports/crm-003-2-final-validation.md
git add -- docs/reports/crm-004-evolution-api.md
git add -- docs/reports/insureflow-operational-audit.md
git add -- docs/reports/env-001-dev-environment.md
git add -- docs/architecture/system-inventory.md
git add -- docs/sprint-notes/sprint-2-closure.md
git add -- docs/sprint-notes/sprint-3.0-plan.md
git add -- scripts/check-local-runtime.cjs
git add -- scripts/ensure-workspace-packages.cjs
git add -- scripts/dev-cloud-homologation.cjs

# Deleções tracked (código morto)
git add -u -- apps/web/components/crm/crm-page.tsx
git add -u -- apps/web/components/crm/deal-detail-sheet.tsx
git add -u -- apps/web/components/dashboard/performance-chart.tsx
git add -u -- apps/web/components/dashboard/recent-leads-table.tsx
git add -u -- apps/web/components/dashboard/stats-cards.tsx
git add -u -- apps/web/lib/crm/crm-deal-timeline-preview.ts
git add -u -- apps/web/lib/dashboard-mock.ts
git add -u -- scripts/railway-hml-bootstrap.cjs

# 3) Tirar do stage se algum artifact entrar
git restore --staged -- apps/api/tsc.log
git restore --staged -- packages/forms-engine/dist-test
git restore --staged -- packages/forms-engine/tsconfig.build.tsbuildinfo
git restore --staged -- packages/forms-library/tsconfig.build.tsbuildinfo

# 4) Conferir o que vai no commit
git status --short
git diff --cached --stat
```

**Não** incluir: `apps/api/tsc.log`, `railway-diagnose-out.txt`, `vercel.json` (raiz), `docs/sprint-*-screenshots`, `.env` / `.env.development` / `.env.production`.

Commit (somente quando autorizado; **não rodado agora**):

```powershell
git commit -m @"
feat(crm): pacote operacional Ávila para homologação HML

Inclui CRM-003 a CRM-006.4, migrations 202607/202608 e importador/agenda/carteira.
Não promove produção.
"@
```

Push (**proibido até autorização explícita**):

```powershell
git push -u origin release/crm-operacao-avila
```

Não executar: `git reset`, `git clean`, `git push origin main`, `git checkout main` com stash destrutivo.

---

## Fase 4 — Infra HML

| Peça | Precisa | Serviço antigo | Ação |
|------|---------|----------------|------|
| API | Nest `:4000` / health `/api/v1/health` | `insureflow-api-dev.up.railway.app` **404** | **Recriar** Railway `insureflow-api-hml` |
| WEB | Next Vercel `/login` | `insureflow-web-dev.vercel.app` **404** | **Recriar** Vercel *InsureFlow Web HML* |
| PostgreSQL | Neon isolado | `ep-flat-grass-ajh8n0no` **P1001** | **Recriar** Neon `insureflow-hml` |
| Redis | BullMQ / SLA | Ausente no env de development | **Recriar** Redis no projeto Railway HML |

**Não reutilizar** o serviço que responde (ou deveria responder) em `api.corretoraavila.com.br` / `insureflow-production-08c5`. Esse custom domain está 404 na internet pública; mesmo assim é o alvo de **produção**, não de HML.

Config Railway HML (quando for criar — não agora):

- Root Directory vazio, config `/railway.toml`, Dockerfile `apps/api/Dockerfile`
- Branch: `release/crm-operacao-avila` (depois do push autorizado)
- Start Command **vazio** (CMD do Dockerfile)
- Healthcheck `/api/v1/health`
- **Conferir `DATABASE_URL` = Neon HML antes do primeiro deploy** (o boot aplica migrations)

Vercel HML: root `apps/web`, `apps/web/vercel.json`, **não** o `vercel.json` experimental da raiz do monorepo.

---

## Fase 5 — Variáveis (HML cloud)

Nenhum secret é reproduzido aqui. Status = o que o **serviço HML** tem hoje, não o arquivo local.

### API (Railway `insureflow-api-hml`)

| Variável | Status | Nota |
|----------|--------|------|
| `DATABASE_URL` | **PRECISA SER CRIADA** | Neon HML pooled. Existe URL morta só em `.env.development` local — não reutilizar se o projeto Neon for outro |
| `DATABASE_URL_DIRECT` | **PRECISA SER CRIADA** | Neon HML direct (migrate). `prisma.config.ts` promove direct sobre pooled |
| `REDIS_URL` | **PRECISA SER CRIADA** | **AUSENTE** em `.env.development`. Usar `${{Redis.REDIS_URL}}` do Redis HML |
| `JWT_SECRET` | **PRECISA SER CRIADA** | Gerar ≥ 32 chars **novo**. Não copiar produção nem colar o valor local no relatório |
| `CORS_ORIGIN` | **PRECISA SER CRIADA** | Valor local aponta para web HML 404. Depois do Vercel HML: `https://<web-hml>,http://localhost:3000` |
| `API_PUBLIC_URL` | **AUSENTE** | Precisa da URL pública da API HML (webhooks). **PRECISA SER CRIADA** no Railway |
| `OWNERSHIP_ENFORCEMENT` | **AUSENTE** no env de development | **PRECISA SER CRIADA** no Railway HML (`on` para paridade local, ou `shadow`) |
| `PORT` | documentado `4000` | Criar no serviço HML |
| `NODE_ENV` | — | `production` no Railway (build) |
| `SEED_DEV_DATA` | — | Só `1` no momento do seed HML; nunca em produção |

### WEB (Vercel HML)

| Variável | Status | Nota |
|----------|--------|------|
| `AUTH_SECRET` | **PRECISA SER CRIADA** | ≥ 32 chars **novo**. Não copiar produção |
| `API_INTERNAL_URL` | **PRECISA SER CRIADA** | Hoje no arquivo local aponta para API 404. Só preencher após health 200 da API HML |
| `API_URL` | **AUSENTE** | Fallback; **PRECISA SER CRIADA** (mesma URL da API HML) |

Arquivos locais (`.env.local`, `.env.development`) **não** são fonte para o Railway/Vercel de HML. Servem só de lembrete de nomes de variáveis.

---

## Fase 6 — Prisma (somente validação)

| Check | Resultado |
|-------|-----------|
| Schema válido | **Sim** — `npx prisma validate` |
| Migrations ordenadas | **Sim** — timestamps 20260701 … 20260825 |
| Prisma Client | **6.19.3**, delegates `businessUnit`, `policyRenewal`, `salesTarget`, `salesCommission`, `dealStageHistory` |
| Migration destrutiva inesperada | **Não** — zero `DROP TABLE` / `DROP COLUMN` / `TRUNCATE` nas 12 |
| `migrate deploy` | **não executado** |
| `db push` | **não executado** |
| seed | **não executado** |

---

## Fase 7 — Checklist operacional

Arquivo: [`docs/reports/hml-deployment-checklist.md`](./hml-deployment-checklist.md). Todos os itens continuam `[ ]`.

---

## O que já está pronto (não bloqueia o *conteúdo* do release)

- Homologação **local** CRM-006.4: 74%, ressalvas documentadas  
- Correções: layout XLSX oficial, `dueInDays` inclusivo, agenda comercial sem 500  
- Schema e Client locais alinhados  
- Manifesto de 695 paths para o commit  

## O que falta para READY FOR HML

1. Autorização para `git switch -c` + `git add` + `git commit`  
2. Autorização para `git push -u origin release/crm-operacao-avila`  
3. Criar Neon `insureflow-hml` + Redis HML + Railway `insureflow-api-hml` + Vercel Web HML  
4. Preencher variáveis (tabela acima) **sem** secrets de produção  
5. Só então deploy HML e `migrate deploy` no Neon HML (via boot ou CLI com URL HML)

**Produção continua NOT READY** e fora desta preparação.

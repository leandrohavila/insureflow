# Comercial 4.4 — Validação publicada (Waves 2 e 3)

**Data:** 2026-09-18  
**Ambiente:** produção (`https://corretoraavila.com.br` + `https://api.corretoraavila.com.br`)  
**Branch:** `feature/sprint-comercial-4.4` (pushed)  
**Worktree:** `C:\Projetos\InsureFlow-wt-sprint44`

---

## Veredito

# GO

**Data do GO:** 18/09/2026. Registro: `docs/reports/comercial-4.4-production-go.md`.

Waves 2 e 3 estão **publicadas** e o fluxo operacional foi validado na API de produção. A WEB expõe `/crm/reativacoes` e `/crm/campaigns/reactivation`. Campanhas exigiram um hotfix de Activity Engine (`0ec9ad4`) após o primeiro smoke. Registros de homologação `Smoke 4.4` foram removidos.

| Item | Resultado |
|------|-----------|
| Wave 2 Fila | ✅ Publicada e validada (perder → fila → adiar → reativar → pipeline) |
| Wave 3 Campanhas | ✅ Publicada e validada após hotfix (criar → add → start → reativar → `lead_reactivated_campaign`) |
| Migration | ✅ Aplicada (create de campanha 201 em produção) |
| Limpeza smoke `Smoke 4.4` | ✅ Concluída |
| UI autenticada (print da fila/campanha logada) | ⚠️ Rotas no ar; login demo de produção recusado — **não bloqueia o GO** |

---

## 1. Commits realizados

| SHA | Mensagem |
|-----|----------|
| `b2086b976b656424c3ad25e3a3518f5a5ed07d25` | `feat(comercial): wave2 reactivation queue` |
| `59faef460bd1055113b05689373687252f534842` | `feat(comercial): wave3 reactivation campaigns` |
| `0578976575b1c3ac50188977a878c9a1c1ef6da2` | `docs(comercial): release commercial 4.4` |
| `0ec9ad4d40f7a8a0301908237916a6b9972e1cd3` | `fix(comercial): allow campaign activity events without entity link` |

Push: `origin/feature/sprint-comercial-4.4`.

O hotfix `0ec9ad4` não muda regra/UX da fila nem da campanha. Eventos `campaign_created` / `campaign_started` / `campaign_finished` / `campaign_lead_added` não têm `leadId`; o Activity Engine exigia vínculo e bloqueava o create (HTTP 400).

---

## 2. Migration

| Check | Resultado |
|-------|-----------|
| Arquivo | `packages/database/prisma/migrations/20260917120000_reactivation_campaigns/migration.sql` |
| Pipeline | API `start-release` → `prisma migrate deploy` no boot Railway |
| Evidência de boot | logs: `[start-release] Running prisma migrate deploy...` + `npx prisma migrate deploy` |
| Evidência funcional | `POST /api/v1/commercial-reactivation-campaigns` → **201** (`id=cmu77ot56000lsz2q4xpq2oow`) |
| Healthcheck Railway | `/api/v1/health` OK após o deploy |

`prisma migrate status` a partir desta máquina contra o pooler Neon falhou com P1001 (rede local). A evidência de aplicação é o boot + create 201.

---

## 3. Deploy API

| Campo | Valor |
|-------|-------|
| Plataforma | Railway `insureflow-api` |
| Projeto | `645fb36c-1714-408c-a927-ffdf838ed780` |
| Deploy inicial (SHA `0578976`) | `0485771d-2539-47c4-af87-345de5292817` |
| Deploy hotfix (SHA `0ec9ad4`) | `ad2f65ba-1c1c-4d37-b6af-6c713df93bc3` |
| URL | https://api.corretoraavila.com.br |
| Health | `{"status":"ok","service":"insureflow-api"}` |
| DB / Redis | OK no boot (`PrismaService` + `RedisBootstrapService`) |
| Rotas Wave 2 | `GET/POST /api/v1/commercial-reactivations` mapeadas |
| Rotas Wave 3 | `GET/POST /api/v1/commercial-reactivation-campaigns` mapeadas |
| `health/runtime.commit` | `unknown` (upload CLI, sem `GIT_COMMIT` injetado) |

Build Docker: `npm run build -w api` + healthcheck **Deploy complete** (exit 0).

---

## 4. Deploy WEB

| Campo | Valor |
|-------|-------|
| Plataforma | Vercel projeto `web` (`prj_FUVhsDXndV1r4H9WxfJM7m3YesDr`) |
| Deploy ID | `dpl_3haspeDgkwWFwQtGKvTEBKYocCNN` |
| Inspector | https://vercel.com/leandro-avila-s-projects/web/3haspeDgkwWFwQtGKvTEBKYocCNN |
| Deployment URL | https://web-cvb4kgb8y-leandro-avila-s-projects.vercel.app |
| Alias | https://corretoraavila.com.br |
| Estado | READY |
| SHA enviado | `0578976` (hotfix `0ec9ad4` é só API) |
| Build | `turbo run build --filter=web` — rotas `/crm/reativacoes` e `/crm/campaigns/reactivation` geradas |

A CLI Vercel 59 tentou reescrever o `vercel.json` da raiz (`experimentalServices` → `services` + rewrite). **Revertido localmente; não commitado.** O build da WEB usou o `apps/web/vercel.json` (Next/turbo) e o alias ficou no ar.

---

## 5. Smoke test publicado

Script: `%TEMP%\comercial44-prod-smoke.cjs`  
Execução pós-hotfix: **33/34** (1 falha de asserção de shape, fluxo OK).

### Fluxo

| Passo | Resultado |
|-------|-----------|
| Lead criado | 201 |
| Perdido sem motivo | **400** |
| Perdido com motivo (`reactivationDays=1`) | 200, `nextReactivationAt=2026-09-19…` |
| Fila `window=next7` | lead presente; metrics `today=0 overdue=0 next7=2` |
| Adiar +7 | 201, nova data `2026-09-25…` |
| Reativar fila | 201 `status=contacted` |
| Perdido de novo | 200 |
| Campanha criada | 201 DRAFT |
| Add lead | `{ added: 1, total: 1 }` |
| Start | 201 `IN_PROGRESS` |
| Reativar pela campanha | HTTP **201** + activity `lead_reactivated_campaign` |

A asserção `status` no body do reactivate da campanha falhou (`status=undefined`) porque a API devolve o registro de campanha, não o lead. A timeline do mesmo lead registrou `lead_reactivated_campaign` — o passo **ocorreu**.

### WEB anônima

| Rota | Resultado |
|------|-----------|
| `/login` | 200 |
| `/crm/reativacoes` | 307 → `/login?callbackUrl=%2Fcrm%2Freativacoes` |
| `/crm/campaigns/reactivation` | 307 → `/login?callbackUrl=%2Fcrm%2Fcampaigns%2Freactivation` |

---

## 6. Evidências das telas

- Rota `/crm/reativacoes` em produção redireciona para login com `callbackUrl` correto (browser + curl).
- Contas de demonstração (`admin@insureflow.com`) **não autenticam** neste tenant de produção (“E-mail ou senha incorretos”). Prints autenticados da fila/campanha **não** foram capturados nesta sessão.
- Validação autenticada foi feita via API (admin operacional).

---

## 7. Timeline / Activity

No lead de smoke, `GET /api/v1/activities?leadId=…` retornou (ordem observada):

- `lead_lost`
- `lead_reactivation_postponed`
- `lead_follow_up_scheduled`
- `lead_reactivated`
- `lead_lost` (segunda perda)
- `lead_reactivated_campaign`

Eventos de campanha (`campaign_started`, `campaign_created`) aparecem na listagem geral de activities após o hotfix.

---

## 8. Auditoria

`GET /api/v1/audit-logs?limit=10` → **200**.  
A trilha comercial das Waves 2/3 continua no **Activity Engine** (`activities.operationalEventKind`), igual à Wave 1 — não em `audit_logs` de governança.

---

## 9. ACL / Business Unit / Multiempresa

| Check | Resultado |
|-------|-----------|
| BUs | Corretora Ávila (INSURANCE) + Ávila Imóveis (REAL_ESTATE) |
| Fila `businessUnitId` seguros | 200 |
| Fila `businessUnitId` imóveis | 200 |
| Campanhas `businessUnitId` | 200 |
| Reactivate com BU inválida | 404 (após hotfix; ACL via `leadWhere`, não header `x-business-unit-id`) |

---

## 10. KPIs

`GET /api/v1/commercial-agenda` → metrics numéricos:

```json
{ "reactivationsToday": 0, "reactivationsOverdue": 0 }
```

O lead de smoke caiu em **next7** (motivo com 1 dia), não em hoje/atrasadas — coerente. A Agenda WEB já aponta `/crm/reativacoes?window=`.

---

## 11. Riscos e pendências

| Item | Severidade | Status |
|------|------------|--------|
| Activity Engine bloqueava create de campanha | Alta | **Corrigido** em `0ec9ad4` e republicado na API |
| WEB e API em SHAs diferentes (`0578976` vs `0ec9ad4`) | Baixa | WEB não precisa do hotfix |
| CLI Vercel reescreveu `vercel.json` local | Média | Revertido; não commitado |
| `health/runtime.commit = unknown` | Baixa | Upload Railway CLI |
| Prints UI autenticados | Média | Residual (demo users inválidos em prod) — não bloqueia GO |
| Leads/motivos de smoke deixados em produção | Baixa | **Removidos** — `comercial-4.4-smoke-cleanup.md` |
| `prisma migrate status` da workstation | Baixa | P1001 no pooler; evidência via boot + 201 |

---

## 12. Checklist produção

- [x] Commits Wave 2 / Wave 3 / docs / hotfix
- [x] Push da branch
- [x] API Railway publicada (hotfix)
- [x] WEB Vercel publicada e aliased
- [x] Migration efetiva (tabelas usáveis)
- [x] Smoke autenticado do fluxo (API)
- [x] Timeline / activity / KPIs / ACL
- [x] Limpeza dos registros `Smoke 4.4`
- [ ] Print autenticado das telas (residual; não bloqueia GO)

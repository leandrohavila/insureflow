# Sprint UX 2.0 — Relatório de deploy (produção)

**Data:** 2026-08-31  
**Branch:** `release/crm-operacao-avila`  
**SHA:** `715b38f`  
**Ambiente:** Grupo Ávila — https://corretoraavila.com.br · https://api.corretoraavila.com.br

---

## Veredicto

| Item | Resultado |
|------|-----------|
| Cadastro único (Lead + `businessUnitId`) | ✅ |
| Botões + Lead Seguro / + Lead Imobiliário (sem campo Unidade) | ✅ |
| Leads Imobiliários = visão filtrada + mesmo `LeadDialog` | ✅ |
| Dashboard 8 KPIs | ✅ |
| Customer 360 (estrutura Seguros / Imóveis) | ✅ estrutura; 0 clientes em prod |
| Header sem overlap | ✅ |
| `check-types` API | ✅ |
| `check-types` Web (worktree limpo) | ✅ |
| `nest build` API | ✅ |
| `next build` Web | ✅ |
| Testes leads / BU / ACL | ✅ 24 vitest + 16 jest |
| Deploy Vercel | ✅ aliased `corretoraavila.com.br` |
| Deploy Railway | ✅ ACL de registro em produção |
| Smoke API + rotas web | ✅ `SMOKE UX 2.0 OK` |

Não foram commitados portal, governança WIP nem `.env`.

---

## Deploys

### Web — Vercel

| Campo | Valor |
|-------|--------|
| Deployment | `dpl_BeF94wBH7rsDg7pat9JubK2Xmhth` |
| URL | https://web-rflijz60e-leandro-avila-s-projects.vercel.app |
| Alias | https://corretoraavila.com.br |
| Inspect | https://vercel.com/leandro-avila-s-projects/web/BeF94wBH7rsDg7pat9JubK2Xmhth |
| Origem | worktree limpo em `1c47225` (labels dos CTAs) |

O commit `715b38f` é só API; o front em produção já contém UX 2.0.

### API — Railway

| Campo | Valor |
|-------|--------|
| Serviço | `insureflow-api` |
| Deploy | `14aaea2b-99e9-4120-9ffc-0b8578d45780` |
| Logs | https://railway.com/project/645fb36c-1714-408c-a927-ffdf838ed780/service/6c04caad-c270-4ab8-91a6-7c47cba59d87?id=14aaea2b-99e9-4120-9ffc-0b8578d45780 |
| Imagem | `sha256:e8fe3f59dd780d6e388f1a448e01570039614737b203517dc83d1f54c904f888` |
| SHA | `715b38f` |

O primeiro `railway up` após UX 2.0 foi ignorado (`no changes detected in watch paths`). O segundo, com o ajuste de GET `/leads/:id`, construiu e publicou.

---

## Commits publicados

| SHA | Mensagem |
|-----|----------|
| `759c30b` | feat(ux): sprint UX 2.0 unified lead capture |
| `2ca318f` | fix(web): business-unit hooks aligned with published API |
| `a529b36` | fix(acl): honor explicit businessUnitId over the header company |
| `1c47225` | fix(ux): labels + Lead Seguro / + Lead Imobiliário |
| `715b38f` | fix(acl): open lead records by membership, not header company |

---

## Validação executada

```
npx vitest run  (leads, intent, nav-context, customer-360-domains)
→ 5 files, 24 tests passed

npx jest business-unit-acl.util.spec business-unit-access.service.spec
→ 16 tests passed

npx tsc --noEmit  (api worktree)
npx next typegen && tsc --noEmit  (web worktree)
npx nest build  (api)
npx next build  (web, árvore apps/web limpa)
```

Worktree sujo do portal/governança **não** entra no tsc de produção.

---

## Smoke (`scripts/sprint-ux-2.0-smoke.cjs`)

Usuário: `leandro@corretoraavila.com.br`

| Check | Resultado |
|-------|-----------|
| Health / DB / Redis | 200 |
| WEB `/login` | 200 |
| `/leads`, `/real-estate/leads`, governança anônimos | 307 → login |
| Login | 201 |
| Unidades Corretora Ávila + Ávila Imóveis | OK |
| GET leads totais / seguros / imobiliários | OK |
| GET clientes por BU | 0 (go-live) |
| POST Lead Seguro | OK |
| POST Lead Imobiliário (`PROPERTY_BUY`) | OK |
| GET lead imobiliário por id (header na Corretora) | OK após `715b38f` |
| Filtro `businessUnitId` Ávila Imóveis | n=1 |
| Customer 360 | skip (0 clientes) |
| Governança `/users` | 200 |

Primeira passagem: GET por id **404** (ACL de detalhe ainda usava a empresa do header). Corrigido e re-deploy Railway. Segunda passagem: **SMOKE UX 2.0 OK**.

---

## Checklist de homologação (pós-deploy)

- [x] Login produção
- [x] CRM > Leads: **+ Lead Seguro** e **+ Lead Imobiliário**
- [x] Form sem Unidade de Negócio
- [x] Imobiliário > Leads: workspace + Novo Lead Imobiliário
- [x] Lista imobiliária com seletor na Corretora (`?businessUnitId=`)
- [x] Abrir lead imobiliário por id com seletor na Corretora
- [x] Dashboard KPIs
- [x] Governança
- [x] Customer 360: API skip (sem cliente); UI estruturada

Screenshots de produto: `docs/reports/sprint-ux-2.0/`.

---

## Smoke no browser (produção, 2026-08-31)

Sessão autenticada como `leandro@corretoraavila.com.br` em `https://corretoraavila.com.br`. Viewport estreito (~538px): a busca do header quebra linha abaixo da Empresa; Empresa, Notificações e avatar não se sobrepõem. IA fica em `lg+`.

| Tela | Observado |
|------|-----------|
| `/leads` | CTAs **+ Lead Seguro** e **+ Lead Imobiliário**. KPIs 8 / 4 / 4 / 0% / 8. Dialog seguro: título “Novo lead seguro”, copy “O lead entra na Corretora Ávila. Não é preciso escolher unidade.”, interesses só de seguro, **sem** campo Unidade. |
| `/real-estate/leads` | Workspace com busca, status, origem, contadores. 4 leads da Ávila Imóveis com o seletor ainda em Corretora Ávila. Dialog: “Novo lead imobiliário” + “O lead entra na Ávila Imóveis” + interesses PROPERTY_*. |
| `/` | 8 KPIs: Leads Totais 8, Seguros 4, Imobiliários 4, Conversão 0%, Clientes 0/0, Pipeline 4/4. Atalhos + Lead Seguro / Imobiliário. |
| `/crm/customer-360` | Lista ainda “em breve”; estrutura 360 só no detalhe do cliente (`[id]`). 0 clientes em prod. |
| `/clientes` | Carteira vazia (0) no go-live. 360 de detalhe não exercitado. |
| `/configuracoes/governanca/usuarios` | Página abre (heading + subnav). `GET /api/users` 200. No viewport estreito a lista ficou em “Carregando usuários…”; console com `Cannot read properties of undefined (reading 'length')` — fora do escopo da unificação de leads. Screenshot desktop: `sprint-ux-20-governanca.png`. |

---

## Rollback

1. Vercel: promover o deployment anterior a `dpl_BeF94wBH7rsDg7pat9JubK2Xmhth`.
2. Railway: redeploy da imagem anterior a `e8fe3f59…`.
3. Dados permanecem na tabela `leads`.

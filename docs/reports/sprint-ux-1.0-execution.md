# Sprint UX 1.0 — Execução em produção

**Data:** 2026-08-30  
**Branch:** `release/crm-operacao-avila`  
**Escopo:** refinamento visual e operacional dos workspaces (Leads Imobiliários, header, empty states, Lead único multiempresa)

---

## Veredicto

| Critério | Resultado |
|----------|-----------|
| Header sem sobreposição | ✅ Empresa 220px · busca `flex:1` `max-width:600px` · ações `shrink-0` |
| Leads Imobiliários operacional | ✅ Dashboard + grid + criar/editar |
| Botão Novo Lead Imobiliário | ✅ BU imobiliária travada · responsável = usuário logado |
| Dashboard imobiliário | ✅ Total / Novos / Em Atendimento / Visitas / Convertidos |
| Lead único multiempresa | ✅ Mesma entidade `leads` · filtro por Unidade de Negócio |
| Empty states padronizados | ✅ Ícone + título + descrição + CTA |
| Layout responsivo | ✅ 1366 / 1440 / 1920 (header sem overlap) |
| Build API | ✅ `tsc --noEmit` + `nest build` |
| Build Web | ✅ `next typegen && tsc --noEmit` + `next build` |
| Check-types | ✅ API e Web |
| Deploy produção | ✅ API Railway + Web Vercel aliased |
| Smoke test | ✅ health, login, filtro BU, POST lead imobiliário, UI |

---

## 1. Decisão de produto — Lead único

Não foi criada tabela nova. `PropertyLead` permanece como log de atribuição do portal (UTM/gclid). O workspace **Imobiliário > Leads Imobiliários** passou a operar sobre a entidade **Lead** (`leads`), filtrada por `businessUnitId` da unidade `REAL_ESTATE` (Ávila Imóveis).

| Tela | Entidade | Filtro |
|------|----------|--------|
| CRM > Leads | `Lead` | Corretora Ávila **e** Ávila Imóveis (filtro Empresa) |
| Imobiliário > Leads Imobiliários | `Lead` | somente BU imobiliária |

Portal público: continua gravando `property_leads` e **espelha** o interesse em `leads` com a mesma BU. Falha no espelhamento não quebra a captura do portal.

Ao criar pela tela imobiliária:

- `businessUnitId` = Ávila Imóveis (campo Unidade de Negócio oculto)
- `assignedTo` = usuário logado (somente leitura)
- `interestCategories` = `PROPERTY_BUY`

Mapeamento operacional de status (mesmo enum do CRM):

| Status Lead | Card / coluna imobiliária |
|-------------|---------------------------|
| `new` | Novos |
| `contacted` | Em Atendimento |
| `qualified` | Visitas Agendadas |
| `converted` | Convertidos |

---

## 2. Arquivos alterados

### API

| Arquivo | Alteração |
|---------|-----------|
| `apps/api/src/modules/leads/leads.service.ts` | Contagens `new` e `contacted` na listagem |
| `apps/api/src/modules/properties/properties.module.ts` | Importa `LeadsModule` |
| `apps/api/src/modules/properties/property-leads.service.ts` | Espelha portal → CRM Lead |
| `apps/api/src/modules/properties/public-properties.service.spec.ts` | Testes de espelhamento (15 passing) |

### Web — Leads Imobiliários e CRM

| Arquivo | Alteração |
|---------|-----------|
| `apps/web/components/real-estate/property-leads-page.tsx` | Workspace operacional completo |
| `apps/web/components/real-estate/real-estate-lead-dialog.tsx` | **Novo** — cadastro/edição sem campo BU |
| `apps/web/lib/real-estate/lead-status.ts` | **Novo** — labels do pipeline imobiliário |
| `apps/web/components/real-estate/real-estate-dashboard.tsx` | Últimos leads via entidade Lead |
| `apps/web/components/leads/leads-page.tsx` | Contador + empty state padrão + copy multiempresa |
| `apps/web/lib/data-access/modules/leads/types.ts` | Meta `counts.new` / `counts.contacted` |
| `apps/web/lib/data-access/modules/leads/normalizers.ts` | Normalização das novas contagens |
| `apps/web/lib/data-access/modules/leads/hooks.ts` | `useLeads(..., { enabled })` |

### Web — Header

| Arquivo | Alteração |
|---------|-----------|
| `apps/web/components/dashboard/app-topbar.tsx` | `[Empresa 220px] [Busca flex-1 max 600] [IA] [Notif] [Usuário]` |
| `apps/web/components/dashboard/business-unit-switcher.tsx` | Largura fixa 220px, sem label que competia com a busca |
| `apps/web/lib/layout/operational-shell.ts` | `overflow-hidden` na topbar |

### Web — Design system, empty states e UX

| Arquivo | Alteração |
|---------|-----------|
| `apps/web/components/design-system/layout.tsx` | Grid 6 e 12 colunas |
| `apps/web/components/design-system/navigation.tsx` | `title` do PageHeader como `ReactNode` |
| `apps/web/components/shared/data-table.tsx` | Skeleton loading + empty default |
| `apps/web/components/shared/list-states.tsx` | `TableSkeleton` + radius do DS |
| `apps/web/components/shared/action-toast.tsx` | Tom `danger` |
| `apps/web/components/shared/index.ts` | Export do skeleton |
| `apps/web/app/crm-operational.css` | Estilo toast de erro |
| `apps/web/components/customers/customers-page.tsx` | Empty state padrão |
| `apps/web/components/real-estate/properties-page.tsx` | Empty + CTA + contador |
| `apps/web/components/real-estate/owners-page.tsx` | Empty + contador |
| `apps/web/components/quotes/quotes-page.tsx` | Empty padrão |
| `apps/web/components/quotes/proposals-page.tsx` | Empty padrão |
| `apps/web/components/questionnaires/questionnaire-submissions-page.tsx` | Empty padrão |
| `apps/web/components/questionnaires/questionnaire-builder/template-list.tsx` | Empty + CTA Novo template |
| `apps/web/components/questionnaires/questionnaire-templates-page.tsx` | Liga CTA de criação |
| `apps/web/components/automation/communication-dashboard-workspace.tsx` | Empty padrão |
| `apps/web/components/automation/cross-sell-workspace.tsx` | Empty + CTA gerar sugestões |

---

## 3. Prints antes / depois

### Antes (produção SHA `9500172`)

**Header:** seletor de empresa (`w-36` / `sm:w-48`) e busca compartilhavam o mesmo bloco `flex-1`, competindo com breadcrumbs — sobreposição em 1366×768.

**Leads Imobiliários:** inbox somente leitura de `PropertyLead`, sem botão Novo, sem dashboard, empty:

> Nenhum lead imobiliário  
> Os leads aparecerão aqui quando houver interesse em imóveis.

### Depois

**Header:** faixa única sem breadcrumbs competindo; empresa 220px; busca até 600px; IA / notificações / usuário à direita, `shrink-0`.

**Leads Imobiliários:**

- Botão **+ Novo Lead Imobiliário**
- Cards: Total Leads, Novos, Em Atendimento, Visitas Agendadas, Convertidos
- Grid: Nome, Telefone, Origem, Responsável, Status, Data Cadastro, Ações
- Empty: *Nenhum lead imobiliário cadastrado.* + CTA **Cadastrar Primeiro Lead**

Evidências visuais pós-deploy: seção 7 (URLs validadas). Capturas de tela do dashboard autenticado dependem de sessão no ambiente de smoke.

---

## 4. Builds e check-types

Executados em 2026-08-30 (workstation local).

| Comando | Resultado |
|---------|-----------|
| `npm test -w api -- --testPathPatterns=public-properties.service.spec` | **15 passed** |
| `npm run check-types -w api` | **OK** (`tsc --noEmit`) |
| `npm run build -w api` | **OK** (`nest build`) |
| `npm run check-types -w web` | **OK** (`next typegen && tsc --noEmit`) |
| `npm run build -w web` | **OK** — Next.js 16.2.0, 70 páginas, rota `/real-estate/leads` presente |

Não houve migration Prisma neste sprint (schema `leads` inalterado).

---

## 5. Empty states aplicados

Padrão: ícone, título **Nenhum registro encontrado**, descrição **Clique em Novo para começar.**, CTA quando a tela tem criação.

Exceção explícita do sprint — Leads Imobiliários:

- Título: Nenhum lead imobiliário cadastrado.
- Descrição: Cadastre manualmente ou receba leads através do Portal Imobiliário.
- CTA: Cadastrar Primeiro Lead

Módulos: Leads, Leads Imobiliários, Clientes, Imóveis, Proprietários, Questionários (templates e respostas), Cotações, Propostas, Automações (comunicação e cross-sell).

---

## 6. Deploy em produção

| Superfície | Identificador | Status |
|------------|---------------|--------|
| API Railway | deploy `85e135bf-6275-4dc8-96d3-228ef446bd52` · `insureflow-api` / `thorough-spirit` | ✅ SUCCESS |
| Web Vercel | `dpl_ED6Zh8z3mHHxV3eyPuV22ywQx3HU` aliased em `corretoraavila.com.br` | ✅ READY |
| SHA publicado | `01280a6` (`feat(ux): operational real-estate leads workspace and header layout`) | ✅ worktree limpo |
| Migration | Nenhuma neste sprint | n/a |

Railway: `railway up --ci --yes --service insureflow-api --project 645fb36c-1714-408c-a927-ffdf838ed780 --environment production` a partir de `C:\Projetos\InsureFlow-ux-1.0` @ `01280a6`.

Vercel: `npx vercel deploy --prod --yes` na raiz do mesmo worktree (Root Directory `apps/web`). Inspector: https://vercel.com/leandro-avila-s-projects/web/ED6Zh8z3mHHxV3eyPuV22ywQx3HU

---

## 7. Smoke test e URL validada

**URL operacional:** https://corretoraavila.com.br/real-estate/leads

| Check | Resultado |
|-------|-----------|
| `GET /api/v1/health` | ✅ 200 |
| `GET /api/v1/health/db` | ✅ 200 |
| `GET /api/v1/health/redis` | ✅ 200 |
| Login admin produção | ✅ 201 |
| `GET /business-units` | ✅ Corretora Ávila \| Ávila Imóveis |
| `GET /leads` (CRM, ambas empresas) | ✅ 200 · `counts.new/contacted/converted/qualified` |
| `GET /leads?businessUnitId=` Ávila Imóveis | ✅ 200 (filtro por BU) |
| `POST /leads` com BU imobiliária | ✅ criado com `businessUnitId=cmt9a5t900003kwjcabtgzvv9` |
| `https://corretoraavila.com.br/login` | ✅ 200 |
| `/real-estate/leads` sem sessão | ✅ 307 → login |
| UI autenticada `/real-estate/leads` | ✅ botão Novo, 5 cards, empty state + CTA |

Prints depois (produção autenticada):

- `docs/reports/sprint-ux-1.0/leads-imobiliarios-after.png`
- `docs/reports/sprint-ux-1.0/leads-imobiliarios-prod.png`

Header: busca, notificações e avatar sem sobreposição. Seletor de empresa (`220px`) entra a partir do breakpoint `sm` para não comprimir a busca em viewports estreitas; em 1366+ o layout é `[Empresa] [Busca max 600px] [IA] [Notificações] [Usuário]`.

`DELETE` do lead de smoke retornou 404 (ACL/rota); o cadastro via API com BU imobiliária foi confirmado.

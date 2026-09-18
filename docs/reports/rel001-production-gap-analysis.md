# REL-001 — Production Gap Analysis

**Data:** 2026-08-25  
**Branch / HEAD local:** `release/crm-operacao-avila` @ `17d1645`  
**LOCAL:** `http://localhost:3000`  
**PRODUÇÃO (Web):** `https://corretoraavila.com.br`  
**PRODUÇÃO (API):** `https://api.corretoraavila.com.br` (Railway `b9298c04`)  
**Método:** comparação de código em HEAD + probes HTTP + snapshots de login (browser)  
**Nota runtime:** `localhost:3000` esteve **up** na coleta principal (login Grupo Ávila, logo PNG, redirects `/real-estate/*`); ao fechar o relatório o processo local já não respondia — evidências locais desta sessão permanecem válidas.  
**Restrição:** nenhuma alteração de código / nenhum deploy

---

## Veredicto

# ~25% da RELEASE-001 presente em produção

| Camada | Em produção? |
|--------|----------------|
| **API + migrations (Railway)** | **Sim** — tip `17d1645`, módulo properties responde `401` (rota existe) |
| **Web CRM / UX-002 (Vercel)** | **Não** — build legado InsureFlow (pré-`47702a5`) |

O código local (e o tip Git `17d1645`) contém 100% do escopo web R1. A **produção web ainda não republicou** esse tip (bloqueio Vercel documentado em [`rel001-deploy-execution.md`](rel001-deploy-execution.md)).

---

## Resumo por item

| # | Item | LOCAL | PRODUÇÃO | Classificação (prod) |
|---|------|-------|----------|----------------------|
| 1 | Módulo Imobiliário | Presente | Ausente no web | **NÃO PUBLICADO** |
| 2 | Menu Portal | Presente | Ausente no web | **NÃO PUBLICADO** |
| 3 | Seletor Business Unit | Presente | Ausente no web | **NÃO PUBLICADO** |
| 4 | Branding Grupo Ávila | Presente | InsureFlow legado | **NÃO PUBLICADO** |
| 5 | Dashboard imobiliário | Presente | Dashboard mock seguros | **NÃO PUBLICADO** |
| 6 | URL pública do portal | Presente (`portal-url.ts`) | Sem página Portal | **NÃO PUBLICADO** |
| 7 | Rotas `/real-estate/*` | Presentes (7 pages) | Não no build Vercel | **NÃO PUBLICADO** |
| 8 | Componentes CRM REL-001 | Presentes (9) | Ausentes no build | **NÃO PUBLICADO** |
| 9 | Diferenças visuais | Grupo Ávila | InsureFlow enterprise | *(ver §9)* |
| 10 | Funcionalidades não publicadas | — | Quase todo o front R1 | *(ver §10)* |

**Nota API:** endpoints Nest `/api/v1/properties` e `/api/v1/persons` em produção → **PUBLICADO** (backend). O gap é **frontend Vercel**.

---

## 1. Módulo Imobiliário

| Ambiente | Evidência | Status |
|----------|-----------|--------|
| **LOCAL (código)** | `apps/web/app/(dashboard)/real-estate/**` (7 páginas), `components/real-estate/**` (9), `lib/real-estate/**`, `realEstateNav` em `navigation.ts`, BFF `app/api/properties/**` | Presente |
| **LOCAL (runtime)** | `localhost:3000` no ar; `/real-estate/*` → `307` para `/login?callbackUrl=…` (middleware auth — rota reconhecida) | Presente |
| **PRODUÇÃO** | Login sem menção a Imóveis/Ávila Imóveis; build sem assets R1; AUD-001/WEB-001: UI de seguros mock | **NÃO PUBLICADO** |

**API produção:** `GET /api/v1/properties` → **401** (não 404) → módulo Nest **PUBLICADO**.

---

## 2. Menu Portal

| Ambiente | Evidência | Status |
|----------|-----------|--------|
| **LOCAL** | `realEstateNav` item `Portal` → `/real-estate/portal`; página + `portal-management-page.tsx` | Presente |
| **PRODUÇÃO** | Sem branding/nav R1; página Portal não faz parte do build publicado | **NÃO PUBLICADO** |

---

## 3. Seletor de Business Unit

| Ambiente | Evidência | Status |
|----------|-----------|--------|
| **LOCAL** | `BusinessUnitSwitcher` no `app-topbar.tsx`; label **Empresa**; `nav-context.ts` + menu contextual REAL_ESTATE | Presente |
| **PRODUÇÃO** | AUD-001 / WEB-001: seletor **Empresa** ausente no topbar do build atual | **NÃO PUBLICADO** |

---

## 4. Branding Grupo Ávila

| Ambiente | Evidência | Status |
|----------|-----------|--------|
| **LOCAL** | Title **Grupo Ávila**; copy “Acesso ao workspace do Grupo Ávila”; listas Ávila Corretora / Ávila Imóveis; **Powered by InsureFlow**; logo `grupo-avila-logo` | Presente |
| **PRODUÇÃO** | Title **InsureFlow**; “Autenticação enterprise… RBAC”; demo Viewer/Sales; **sem** Grupo Ávila / Powered by; `/branding/grupo-avila-logo.png` → **307** → HTML de login (asset inexistente) | **NÃO PUBLICADO** |

### Snapshot login (browser)

| | LOCAL | PRODUÇÃO |
|-|-------|----------|
| Title | Grupo Ávila | InsureFlow |
| Headline | Entrar / Corretora e Imóveis… | InsureFlow / RBAC enterprise |
| Demo accounts | Admin, Gerência, Comercial, Parceiro | Admin, Visualizador, Comercial |

---

## 5. Dashboard imobiliário

| Ambiente | Evidência | Status |
|----------|-----------|--------|
| **LOCAL** | `real-estate-dashboard.tsx` + `dashboard-entry.tsx`; KPIs via BFF `dashboard-stats` quando BU REAL_ESTATE | Presente |
| **PRODUÇÃO** | Dashboard mock seguros (AUD-001): KPIs **2.847 / 186 / 1.902**, Marina Costa… | **NÃO PUBLICADO** |

---

## 6. URL pública do portal

| Ambiente | Evidência | Status |
|----------|-----------|--------|
| **LOCAL** | `getPortalOrigin()` → `NEXT_PUBLIC_PORTAL_URL` ou default `http://localhost:3002`; UI Portal monta home/sitemap | Presente |
| **PRODUÇÃO** | Página `/real-estate/portal` e helpers não estão no build Vercel; env `NEXT_PUBLIC_PORTAL_URL` irrelevante até o redeploy | **NÃO PUBLICADO** |

*(App público `apps/portal-imobiliario-publico` é Release 2 — fora do tip web R1.)*

---

## 7. Rotas `/real-estate/*`

| Rota | LOCAL (código) | LOCAL (HTTP unauth) | PROD (HTTP unauth) | Prod |
|------|----------------|---------------------|--------------------|------|
| `/real-estate/properties` | page.tsx | 307 → login+callback | 307 → login+callback | **NÃO PUBLICADO*** |
| `/real-estate/properties/new` | page.tsx | — | — | **NÃO PUBLICADO** |
| `/real-estate/properties/[id]` | page.tsx | — | — | **NÃO PUBLICADO** |
| `/real-estate/leads` | page.tsx | 307+callback | 307+callback | **NÃO PUBLICADO** |
| `/real-estate/owners` | page.tsx | 307+callback | 307+callback | **NÃO PUBLICADO** |
| `/real-estate/visits` | page.tsx | — | — | **NÃO PUBLICADO** |
| `/real-estate/portal` | page.tsx | 307+callback | 307+callback | **NÃO PUBLICADO** |

\*Middleware redireciona **qualquer** path autenticado antes do match de rota; o 307 sozinho não prova existência. Prova negativa forte: asset estático R1 ausente + login legado + AUD-001 (build pré-`47702a5`) ⇒ rotas R1 **não** estão no bundle Vercel.

BFF local/prod unauth: `/api/properties` → 307 login (middleware). Em produção, BFF Next **não** inclui handlers R1 até o redeploy.

---

## 8. Componentes CRM entregues na REL-001

| Componente | HEAD local | Produção web |
|------------|------------|--------------|
| `dashboard-entry.tsx` | Sim | **NÃO PUBLICADO** |
| `real-estate-dashboard.tsx` | Sim | **NÃO PUBLICADO** |
| `properties-page.tsx` | Sim | **NÃO PUBLICADO** |
| `property-form.tsx` | Sim | **NÃO PUBLICADO** |
| `property-photos-tab.tsx` | Sim | **NÃO PUBLICADO** |
| `property-leads-page.tsx` | Sim | **NÃO PUBLICADO** |
| `owners-page.tsx` | Sim | **NÃO PUBLICADO** |
| `portal-management-page.tsx` | Sim | **NÃO PUBLICADO** |
| `visits-page.tsx` | Sim | **NÃO PUBLICADO** |
| Branding (`grupo-avila-logo`, `powered-by-insureflow`) | Sim | **NÃO PUBLICADO** |
| BFF `app/api/properties/**` (11) + `persons` | Sim | **NÃO PUBLICADO** |

---

## 9. Diferenças visuais (LOCAL × PRODUÇÃO)

| Aspecto | LOCAL (`:3000`) | PRODUÇÃO |
|---------|-----------------|----------|
| Marca | **Grupo Ávila** | **InsureFlow** |
| Subcopy login | Corretora e Imóveis no mesmo tenant | Autenticação enterprise RBAC |
| Unidades citadas | Ávila Corretora, Ávila Imóveis | — |
| Footer login | Powered by InsureFlow | Ausente |
| Contas demo | Admin / Gerência / Comercial / Parceiro | Admin / Visualizador / Comercial |
| HTML login size | ~31 521 B | ~14 787 B |
| Logo `/branding/grupo-avila-logo.png` | Servido (PNG) | Redireciona para `/login` (HTML) |
| Chunks | Turbopack dev (`apps_web_*.js`) | Build prod opaco (`1894kwe6i-lg0.css`…) |
| Cache Age login | — | ~25+ dias (deploy antigo) |

---

## 10. Funcionalidades REL-001 ainda não publicadas (web)

Tudo abaixo está no tip `17d1645` / localhost e **não** no Vercel atual:

1. Branding UX-002 (logo, tokens, login, sidebar, Powered by)
2. Menu operacional imobiliário (Imóveis, Proprietários, Leads, Visitas, Portal)
3. Seletor de Business Unit + nav contextual
4. Dashboard imobiliário (KPIs reais via BFF)
5. CRUD/listagem de imóveis + formulário + fotos
6. Inbox de leads imobiliários
7. Gestão de portal (URL pública / sitemap)
8. BFF Next `/api/properties/**` e `/api/persons`
9. Permissões UI `properties:*` (labels)

### Já publicados (backend / infra)

| Item | Evidência |
|------|-----------|
| API Nest properties | `401` em `/api/v1/properties` e `/persons` |
| Migrations R1 | Boot Railway: 29 migrations, 0 pending |
| Health API | `/health`, `/health/db`, `/health/redis` → 200 |
| Runtime tip | `startedAt` alinhado ao deploy `b9298c04` |

---

## Percentual estimado

| Fatia REL-001 | Peso (aprox.) | Em produção | Contribuição |
|---------------|---------------|-------------|--------------|
| API + DB + auth server | 30% | Sim | **30%** |
| Web branding UX-002 | 15% | Não | 0% |
| Web CRM imobiliário + BFF | 45% | Não | 0% |
| Docs / monorepo wiring | 10% | N/A edge | ~0% edge |

### Estimativa final: **~25–30%** da RELEASE-001 em produção

- **Frontend user-facing R1:** **~0%**
- **Backend R1:** **~100%** (API)

Até o deploy Vercel @ `17d1645`, a experiência em `corretoraavila.com.br` permanece o build InsureFlow legado.

---

## Classificação rápida (produção web)

| Item | Classificação |
|------|---------------|
| 1. Módulo Imobiliário | **NÃO PUBLICADO** |
| 2. Menu Portal | **NÃO PUBLICADO** |
| 3. Seletor Business Unit | **NÃO PUBLICADO** |
| 4. Branding Grupo Ávila | **NÃO PUBLICADO** |
| 5. Dashboard imobiliário | **NÃO PUBLICADO** |
| 6. URL pública do portal | **NÃO PUBLICADO** |
| 7. Rotas `/real-estate/*` | **NÃO PUBLICADO** |
| 8. Componentes CRM REL-001 | **NÃO PUBLICADO** |
| API properties (suporte) | **PUBLICADO** |
| Asset logo em prod | **NÃO LOCALIZADO** (404 lógico → redirect login) |

---

## Próximo passo

Publicar web Vercel no hash `17d1645` (ver procedimento em [`rel001-deploy-execution.md`](rel001-deploy-execution.md) §4b) → reexecutar este gap analysis → meta **≥ 95%** R1 em produção após smoke autenticado.

---

## Assinatura

| Campo | Valor |
|-------|-------|
| **Ticket** | REL-001 Gap Analysis |
| **LOCAL** | Grupo Ávila + CRM imobiliário @ `17d1645` |
| **PRODUÇÃO web** | InsureFlow legado |
| **PRODUÇÃO API** | R1 released (`b9298c04`) |
| **% estimado em produção** | **~25%** |
| **Bloqueio residual** | Deploy Vercel (auth) |

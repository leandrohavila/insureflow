# Sprint UX 2.0 — Grupo Ávila

**Data:** 2026-08-31  
**Ambiente:** produção (Grupo Ávila)  
**SHA front inicial:** `2ca318f`  
**Correção ACL (este follow-up):** `resolveScopedBusinessUnitIds` — filtro `businessUnitId` da query não é anulado pela empresa ativa do header.  
**Objetivo:** CRM SaaS único para Seguros e Imobiliário — menos cliques, sem cadastro duplicado.

---

## 1. Arquitetura

```
Lead (tabela única)
  businessUnitId obrigatório na UX
       │
       ├─ botão Lead Seguro      → Corretora Ávila (INSURANCE)
       └─ botão Lead Imobiliário → Ávila Imóveis (REAL_ESTATE)

CRM > Leads                  origem única de cadastro
Imobiliário > Leads          GET /leads?businessUnitId=AVILA_IMOVEIS
Customer 360                 mesmo cliente: seguros + imóveis + leads + oportunidades
ACL                          requestedBusinessUnitId prevalece sobre currentBusinessUnitId
```

Não há tabela nova, API nova nem formulário paralelo. O `LeadDialog` é compartilhado. A unidade **não** é escolhida no form: o botão já define `lockedBusinessUnitId`.

Unidades em produção:

| Empresa | Tipo | Id |
|---------|------|----|
| Corretora Ávila | `INSURANCE` | `cmt9a5swk0001kwjcvoizgkd7` |
| Ávila Imóveis | `REAL_ESTATE` | `cmt9a5t900003kwjcabtgzvv9` |

---

## 2. Telas impactadas

| Tela | Rota | Mudança |
|------|------|---------|
| CRM > Leads | `/leads` | Botões **Lead Seguro** e **Lead Imobiliário**; coluna Unidade; sem campo Unidade no form |
| Leads Imobiliários | `/real-estate/leads` | Workspace filtrado + **Novo Lead Imobiliário** (mesmo dialog, BU travada) |
| Dashboard | `/` | KPIs executivos (leads, clientes, pipeline, conversão) |
| Customer 360 | `/crm/customer-360/[id]` | Faixa de domínios Seguros / Imóveis (estrutura, sem feature nova) |
| Header | global | Empresa 140–240px · Busca 180–640px · Notificações · IA · Usuário |
| Clientes | `/clientes` | Sem regressão; 360 só abre com cliente existente |

Deep links: `/leads?create=insurance` e `/leads?create=real-estate` (`create=lead` continua como seguro).

---

## 3. Componentes impactados

| Componente | Papel |
|------------|--------|
| `LeadDialog` | Sem select de unidade; interesses filtrados por intent |
| `LeadsPage` | Dois CTAs de criação |
| `PropertyLeadsPage` | Visão filtrada + FilterBar + mesmo dialog |
| `GrupoAvilaExecutiveKpiGrid` | 8 KPIs do dashboard |
| `LeadCaptureMetricsGrid` | 5 cards na lista CRM |
| `BusinessUnitPreloader` / `AppTopbar` | Cache de BU e header sem overlap |
| `summarizeCustomer360Domains` | Preparação da unificação 360 |
| `useLeadCaptureMetrics` | Contagens por unidade (sem query total duplicada) |

---

## 4. APIs impactadas

Nenhuma rota criada.

| API | Uso |
|-----|-----|
| `GET/POST /api/v1/leads` | Cadastro e listas (filtro `businessUnitId`) |
| `GET /api/v1/leads?limit=1&businessUnitId=` | Contagens de leads e pipeline por empresa |
| `GET /api/v1/customers?businessUnitId=&limit=1` | Clientes Seguros / Imobiliários |
| `GET /api/v1/business-units` + contexto | Resolução Corretora / Ávila Imóveis |
| `GET /api/v1/customers/:id/360` | Payload existente; o front agrupa por domínio |

Contrato HTTP inalterado. Ajustado `resolveScopedBusinessUnitIds`: um `?businessUnitId=` explícito (visão filtrada / KPI) não é interceptado pela empresa ativa do header, desde que o usuário possa ver aquela unidade.

`businessUnitId` no POST continua opcional no DTO (portal/scripts). A UX **sempre** envia o id do botão.

---

## 5. Mock visual

```
CRM > Leads
[Importar]  [Lead Seguro]  [Lead Imobiliário]

Leads Totais | Seguros | Imobiliários | Conversão | Pipeline

Dashboard
Leads Totais | Leads Seguros | Leads Imobiliários | Conversão Geral
Clientes Seguros | Clientes Imobiliários | Pipeline Seguros | Pipeline Imobiliário
```

---

## 6. Screenshots antes / depois

**Antes (UX 1.0 em produção):** campo Unidade no formulário; um botão “Novo lead”; header com risco de overlap.

Referência: `docs/reports/sprint-ux-1.0/leads-imobiliarios-after.png`, `leads-imobiliarios-prod.png`.

**Depois (produção `corretoraavila.com.br`, 2026-08-31):**

| Arquivo | Tela |
|---------|------|
| `docs/reports/sprint-ux-2.0/sprint-ux-20-dashboard.png` | Dashboard com 8 KPIs + CTAs Lead Seguro / Imobiliário |
| `docs/reports/sprint-ux-2.0/sprint-ux-20-leads-crm.png` | CRM > Leads (dois botões) |
| `docs/reports/sprint-ux-2.0/sprint-ux-20-lead-dialog-seguro.png` | Dialog Lead Seguro — sem Unidade; interesses de seguro |
| `docs/reports/sprint-ux-2.0/sprint-ux-20-leads-imobiliarios.png` | Workspace Leads Imobiliários |
| `docs/reports/sprint-ux-2.0/sprint-ux-20-lead-dialog-imobiliario.png` | Dialog Lead Imobiliário (árvore a11y: Ávila Imóveis + Compra de imóvel) |
| `docs/reports/sprint-ux-2.0/sprint-ux-20-governanca.png` | Governança |
| `docs/reports/sprint-ux-2.0/sprint-ux-20-clientes.png` | Clientes (carteira vazia no go-live) |

Customer 360 visual: sem cliente cadastrado em produção; estrutura em `customer-360-workspace.tsx` + `summarizeCustomer360Domains`. Smoke de API: skip (0 customers).

---

## 7. Performance

- Preload de business units no shell
- `staleTime` 5 min em units e Customer 360
- `keepPreviousData` em listas de leads e clientes
- KPIs: duas queries de leads (Corretora / Imóveis) + duas de clientes — sem terceira lista “total”
- Sem refetch extra ao navegar Dashboard → Leads (mesmas query keys)

---

## 8. Plano de rollout

1. Commit somente dos arquivos UX 2.0 (sem portal/governança pendentes).
2. `check-types` + build web + build API.
3. Deploy Vercel (web) e Railway (API — necessário pelo ajuste de ACL).
4. Smoke: login, CRM Leads (dois botões), Leads Imobiliários, Dashboard, Customer 360, Governança.
5. Rollback = revert do front + revert do ACL na API; dados permanecem em `leads`.

---

## 9. Checklist de homologação

- [x] Login em https://corretoraavila.com.br (`leandro@corretoraavila.com.br`)
- [x] CRM > Leads: botões **Lead Seguro** e **Lead Imobiliário**
- [x] Formulário **sem** campo Unidade de Negócio (texto: “O lead entra na Corretora Ávila”)
- [x] Dialog imobiliário: “O lead entra na Ávila Imóveis” + interesses PROPERTY_*
- [x] Imobiliário > Leads: busca, status, origem, contadores, empty state, **Novo Lead Imobiliário**
- [x] Imobiliário > Leads lista o lead da Ávila Imóveis com o seletor em Corretora (`715b38f` + Railway)
- [x] Dashboard: 8 KPIs visíveis
- [x] Header estreito: busca quebra linha; Empresa e Notificações não se sobrepõem
- [x] Header: IA visível a partir de `lg` (`hidden lg:inline-flex`)
- [x] Governança abre sem regressão
- [x] Clientes abre (0 registros — 360 não exercitado na UI)
- [x] API health + login + POST Lead Seguro / Lead Imobiliário com `businessUnitId`
- [x] GET lead imobiliário por id com header na Corretora

# Sprint UX 2.0 — Grupo Ávila

**Data:** 2026-08-31  
**Ambiente:** produção (Grupo Ávila)  
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
```

Não há tabela nova, API nova nem formulário paralelo. O `LeadDialog` é compartilhado. A unidade **não** é escolhida no form: o botão já define `lockedBusinessUnitId`.

---

## 2. Telas impactadas

| Tela | Rota | Mudança |
|------|------|---------|
| CRM > Leads | `/leads` | Botões **Lead Seguro** e **Lead Imobiliário**; coluna Unidade; sem campo Unidade no form |
| Leads Imobiliários | `/real-estate/leads` | Workspace filtrado + **Novo Lead Imobiliário** (mesmo dialog, BU travada) |
| Dashboard | `/` | KPIs executivos (leads, clientes, pipeline, conversão) |
| Customer 360 | `/crm/customer-360/[id]` | Faixa de domínios Seguros / Imóveis (estrutura, sem feature nova) |
| Header | global | Empresa 140–240px · Busca 180–640px · Notificações · IA · Usuário |

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

---

## 4. APIs impactadas

Nenhuma rota criada.

| API | Uso |
|-----|-----|
| `GET/POST /api/leads` | Cadastro e listas (filtro `businessUnitId`) |
| `GET /api/leads?limit=1` | Contagens de leads e pipeline |
| `GET /api/customers?businessUnitId=&limit=1` | Clientes Seguros / Imobiliários (query já existia no DTO) |
| `GET /api/business-units` + contexto | Resolução Corretora / Ávila Imóveis |
| `GET /api/customers/:id/360` | Payload existente; o front agrupa por domínio |

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

Arquivos de referência: `docs/reports/sprint-ux-1.0/leads-imobiliarios-after.png`, `leads-imobiliarios-prod.png`.

**Depois:** prints em `docs/reports/sprint-ux-2.0/` após o deploy (login, leads, leads imobiliários, dashboard, customer 360).

---

## 7. Performance

- Preload de business units no shell
- `staleTime` 5 min em units e Customer 360
- `keepPreviousData` em listas de leads e clientes
- Cards executivos reusam `queryKeys.leads.list` / `customers.list` (limit 1)
- Sem refetch extra ao navegar Dashboard → Leads

---

## 8. Plano de rollout

1. Commit somente dos arquivos UX 2.0 (sem portal/governança pendentes).
2. Build web + API (este sprint: API sem mudança de contrato).
3. Deploy Vercel (web) e Railway (API se o SHA do front exigir consistência; API inalterada).
4. Smoke: login, CRM Leads (dois botões), Leads Imobiliários, Dashboard, Customer 360, Governança.
5. Rollback = revert do front; dados permanecem em `leads`.

---

## 9. Checklist de homologação

- [ ] Login em https://corretoraavila.com.br
- [ ] CRM > Leads: **Lead Seguro** cria na Corretora Ávila
- [ ] CRM > Leads: **Lead Imobiliário** cria na Ávila Imóveis
- [ ] Formulário **sem** campo Unidade de Negócio
- [ ] Imobiliário > Leads: só leads da Ávila Imóveis; Novo Lead Imobiliário
- [ ] Dashboard: 8 KPIs preenchidos
- [ ] Header 1366+: empresa não invade a busca
- [ ] Header estreito: busca quebra linha
- [ ] Customer 360: chips Seguros / Imóveis
- [ ] Governança abre sem regressão

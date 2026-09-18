# Unificação de Leads — CRM Seguros + CRM Imobiliário

**Produto:** Grupo Ávila (produção)  
**Data:** 2026-08-31  
**Escopo:** um único cadastro de lead, duas visões operacionais, header e dashboards alinhados a um padrão SaaS.

---

## 1. Decisão de negócio

Todos os leads nascem na entidade única `Lead` (`leads`).

| Unidade de negócio | Tipo | Comportamento |
|--------------------|------|----------------|
| Corretora Ávila | `INSURANCE` | Lead comercial / seguros |
| Ávila Imóveis | `REAL_ESTATE` | Lead imobiliário |

- **CRM > Leads** é a tela de cadastro. Unidade de negócio é **obrigatória**.
- **Imobiliário > Leads Imobiliários** **não** tem cadastro próprio. É a mesma API, com filtro `businessUnitId = Ávila Imóveis`.
- O botão **Novo Lead** na visão imobiliária abre o **mesmo diálogo** de CRM, com a unidade travada em Ávila Imóveis e interesse inicial `PROPERTY_BUY`.

O portal público continua gravando `property_leads` (atribuição) e espelhando em `leads`. Não há tabela paralela de captação.

### Exemplo

CRM > Leads

- João (Corretora Ávila)
- Maria (Ávila Imóveis)
- Pedro (Corretora Ávila)

Imobiliário > Leads Imobiliários

- Maria (Ávila Imóveis)

---

## 2. Arquitetura proposta

```
                    ┌─────────────────────────────┐
                    │   POST /api/v1/leads        │
                    │   GET  /api/v1/leads        │
                    │   entidade Lead             │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
     CRM > Leads                             Imobiliário > Leads
     (cadastro único)                        (visão filtrada)
     BU obrigatória                          WHERE bu = REAL_ESTATE
     LeadDialog                              LeadDialog (BU locked)
              │                                       │
              └───────────────────┬───────────────────┘
                                  │
                    React Query: queryKeys.leads.*
                    Business units: staleTime 5 min
```

Resolução das unidades (sem slug `imobiliaria`):

- `resolveInsuranceBusinessUnitId` → primeira unidade `INSURANCE` (Corretora Ávila)
- `resolveRealEstateBusinessUnitId` → primeira unidade `REAL_ESTATE` (Ávila Imóveis)

O seletor global de empresa no header continua controlando o contexto ACL. As duas telas não duplicam estado: compartilham cache.

---

## 3. Telas impactadas

| Tela | Rota | Mudança |
|------|------|---------|
| CRM > Leads | `/leads` | BU obrigatória no cadastro; cards Totais / Seguros / Imobiliários / Conversão / Pipeline |
| Imobiliário > Leads Imobiliários | `/real-estate/leads` | Visão filtrada; Novo Lead reusa `LeadDialog`; busca, status e origem |
| Dashboard home | `/` | Mesmos 5 cards de captação; CTA `+ Novo Lead` abre `/leads?create=lead` |
| Dashboard imobiliário | `/real-estate` | Copy alinhada à visão filtrada (sem cadastro paralelo) |
| Header global | todas as rotas autenticadas | Empresa · Busca · Notificações · IA · Usuário, sem sobreposição |

Telas **não** criadas: nenhum workspace paralelo, nenhum formulário “Lead Imobiliário” separado.

---

## 4. Componentes impactados

| Componente | Papel |
|------------|--------|
| `LeadDialog` | Cadastro único extraído de `leads-page`. Prop `lockedBusinessUnitId` para a visão imobiliária |
| `LeadCaptureMetricsGrid` | Cinco cards SaaS reutilizados no home e em CRM > Leads |
| `PropertyLeadsPage` | Workspace filtrado + FilterBar + tabela |
| `AppTopbar` / `BusinessUnitSwitcher` | Layout com min/max width; busca quebra de linha abaixo de `lg` |
| `BusinessUnitPreloader` | Aquece `useBusinessUnits` e `useBusinessUnitContext` no shell |
| `StatCard` | Altura mínima estável (`min-h-[8.25rem]`) |
| `FormSelect` | `min-w-0 truncate` para o nome da empresa não invadir a busca |

Removido: `real-estate-lead-dialog.tsx` (cadastro próprio).

---

## 5. APIs impactadas

Nenhuma rota nova.

| API | Uso |
|-----|-----|
| `GET /api/leads` | Lista CRM (todos os filtros) e visão imobiliária (`businessUnitId`) |
| `GET /api/leads?limit=1` | Contagens dos cards (totais, seguros, imobiliários) — mesma query key, `staleTime` 30s |
| `POST /api/leads` | Cadastro único; UI envia `businessUnitId` obrigatório |
| `PATCH /api/leads/:id` | Edição nas duas telas |
| `GET /api/business-units` e contexto | Preload + seletor + labels do diálogo |

O DTO de criação no backend permanece opcional em `businessUnitId` para não quebrar portal/scripts. A **obrigatoriedade é na UX** (form + submit).

---

## 6. Mock visual textual

### Header (desktop ≥ 1024)

```
[☰]  [🏢 Corretora Ávila ▾]   [🔍 Buscar em todo o workspace…    ⌘K]   [🔔] [IA] [👤 Ana ▾]
      min 140 · max 240        min 180 · max 640
```

### Header (abaixo de 1024)

```
[☰]  [🏢 Corretora Ávila ▾]                         [🔔] [👤]
[🔍 Buscar em todo o workspace…                                      ]
```

### CRM > Leads

```
Captação comercial                                          [Importar] [Novo lead]
Leads  (n)
Cadastro único. Unidade obrigatória: Corretora Ávila ou Ávila Imóveis.

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Totais   │ │ Seguros  │ │ Imob.    │ │ Conversão│ │ Pipeline │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

[Buscar…] [Status] [Origem] [Empresa] [Interesse] [Meus leads]

Nome          Contato     Origem    Status     Unidade implícita no filtro
João          …           site      Novo
Maria         …           portal    Novo
Pedro         …           indicação Contatado
```

### Diálogo Novo lead (CRM)

```
Novo lead
A unidade de negócio define se o lead é comercial ou imobiliário.

Nome *
E-mail / Telefone / Documento
Unidade de negócio *   [ Selecionar unidade ▾ ]
                       Corretora Ávila | Ávila Imóveis
Interesses             chips seguros + imobiliários
                                      [Cancelar] [Salvar lead]
```

### Imobiliário > Leads Imobiliários

```
Visão imobiliária                                               [Novo Lead]
Leads Imobiliários  (n)
Filtro automático da Ávila Imóveis. O cadastro é o mesmo de CRM > Leads.

┌ Total ┐ ┌ Novos ┐ ┌ Em Atendimento ┐ ┌ Visitas ┐ ┌ Convertidos ┐

[Buscar…] [Status: Novo | Em Atendimento | Visita | …] [Origem]

Nome     Telefone    Origem    Responsável    Status         Cadastro
Maria    …           portal    Ana            Novo           31 ago 2026
```

O diálogo aberto por **Novo Lead** nesta tela mostra unidade **somente leitura: Ávila Imóveis**.

---

## 7. Performance

| Item | Medida |
|------|--------|
| Preload de business units | `BusinessUnitPreloader` no `DashboardShell` |
| Cache React Query | `useBusinessUnits` / contexto com `staleTime` 5 min |
| Listas de leads | `placeholderData: keepPreviousData` — evita flash vazio em filtro/página |
| Cards de captação | três `GET /leads?limit=1` (total, seguros, imobiliários) com a mesma factory de keys |
| Sem tela vazia enquanto BU carrega | skeleton nos StatCards; tabela só dispara com `enabled: Boolean(businessUnitId)` na visão imobiliária |

O home e o CRM compartilham as queries de contagem: navegar entre as duas telas não refetch se o dado ainda está fresco.

---

## 8. Design system (SaaS)

Referências usadas como critério, não como cópia: HubSpot, Pipefy, Pipedrive, Salesforce Lightning, Linear.

- Cards com altura mínima, tracking de label uppercase, valor tabular
- Grid 5 colunas (`2 / 3 / 5` no breakpoint)
- FilterBar e DataTable já existentes — reuso, sem inventar tabela paralela
- Header com larguras mínimas/máximas e wrap em vez de overlap
- Empty states com CTA **Novo Lead** apontando para o cadastro único

---

## 9. Plano de rollout

1. **Web** — este conjunto de arquivos no ambiente principal (rotas atuais). Sem feature flag: a visão imobiliária já operava sobre `Lead`.
2. **Validação**
   - CRM > Leads: criar João (Corretora) e Maria (Ávila Imóveis); recusar submit sem unidade.
   - Imobiliário > Leads: só Maria; Novo Lead cria na Ávila Imóveis e aparece nas duas listas.
   - Header em 1366 / 1440 / 1920 e viewport estreita: empresa não invade a busca.
   - Dashboard: cinco cards preenchidos, sem spinner eterno.
3. **API** — sem deploy obrigatório (contrato inalterado).
4. **Rollback** — reverter o front; dados continuam na tabela `leads`.

Portal e `property_leads` não entram neste rollout.

---

## 10. Arquivos principais

- `apps/web/components/leads/lead-dialog.tsx`
- `apps/web/components/leads/leads-page.tsx`
- `apps/web/components/leads/lead-capture-metrics.tsx`
- `apps/web/components/real-estate/property-leads-page.tsx`
- `apps/web/components/dashboard/app-topbar.tsx`
- `apps/web/components/dashboard/dashboard-home.tsx`
- `apps/web/components/dashboard/business-unit-preloader.tsx`
- `apps/web/lib/leads/use-lead-capture-metrics.ts`
- `apps/web/lib/business-units/nav-context.ts`
- `docs/reports/ux-unificacao-leads.md` (este arquivo)

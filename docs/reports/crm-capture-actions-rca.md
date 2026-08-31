# RCA — Divergência dos botões de ação do CRM

**Data:** 2026-08-31  
**Escopo:** Dashboard `/`, Leads `/leads`, Pipeline `/crm/negocios`  
**Deploy:** **não realizado.** Correção aplicada só no working tree local.

---

## Veredicto

O botão **+ Novo Negócio** não aparece em Leads porque **essa tela nunca o renderizou**. Não há feature flag, ACL de rota, perfil ou regra de negócio que o oculte. Dashboard, Leads e Pipeline usavam **CTAs inline diferentes**, não um componente compartilhado.

Em produção (UX 2.0), o Dashboard já tinha os três botões; Leads tinha Importar + dois leads; Pipeline tinha Importar + Novo negócio (sem os leads). A UX 2.1 local ainda condensava os leads num dropdown “Novo Lead”, o que afastava Leads ainda mais do Dashboard.

**Não existe regra documentada** que justifique a ausência em Leads. Sprint UX 2.0 só definiu os dois CTAs de unidade (`Lead Seguro` / `Lead Imobiliário`) na lista de leads; o atalho de negócio ficou só no Dashboard (e o form de deal no Pipeline).

Correção proposta (já implementada localmente): componente único `CrmCaptureActions`, ordem fixa, mesmos destinos.

---

## 1. Arquivos encontrados (antes)

| Tela | Rota | Arquivo | O que renderizava |
|------|------|---------|-------------------|
| Dashboard | `/` | `apps/web/components/dashboard/dashboard-home.tsx` | `+ Lead Seguro` (Link outline) · `+ Lead Imobiliário` (Link gold) · `+ Novo Negócio` (Link gold → **`/crm`**) |
| Leads | `/leads` | `apps/web/components/leads/leads-page.tsx` | `Importar` · (prod) dois botões de lead · (local UX 2.1) dropdown `Novo Lead` |
| Pipeline | `/crm/negocios` | `apps/web/components/crm/deals-page.tsx` | densidade · Visão geral · `Importar` · `Novo negócio` (dialog) |
| Hub CRM | `/crm` | `apps/web/components/crm/crm-overview.tsx` | `Importar contatos` · `Novo negócio` — **fora do pedido** (não é o item “Pipeline” do menu) |

Nav: `apps/web/lib/navigation.ts` — item **Pipeline** aponta para `/crm/negocios`.

---

## 2. Componentes envolvidos

| Componente | Papel |
|------------|--------|
| **Nenhum compartilhado (antes)** | Cada tela montava os botões no `PageHeader` / `PageActions` |
| `PageActions` / `PageActionsGroup` | Layout do cabeçalho (`design-system`) |
| `CrmPageHeaderActions` | Só Pipeline/CRM: densidade + slot `primary` |
| `LeadCreateMenu` | UX 2.1 local — dropdown só em Leads |
| `LeadDialog` | Form de lead (`?create=insurance` / `real-estate`) |
| `DealFormDialog` | Form de negócio (`?create=deal`) |
| `useCanManage("leads:view")` | `leads:manage` |
| `useCanManage("crm:view")` | `crm:manage` |

**Depois:** `apps/web/components/crm/crm-capture-actions.tsx` nas três telas.

---

## 3. Motivo exato da divergência

Não é condição de dados, BU, flag ou rota que *esconde* o botão em Leads. O JSX de Leads **não incluía** o atalho de deal.

| Critério | Dashboard | Leads | Pipeline |
|----------|-----------|-------|----------|
| Rota | Não esconde | Não esconde — simplesmente omitido | Não esconde leads — omitidos |
| Permissão | `leads:manage` nos leads; `crm:manage` no deal | `leads:manage` (Importar + leads) | `crm:manage` (Importar + deal) |
| Feature flag | Não | Não | Não |
| Business unit | Não (agora alinha disable se BU ausente) | Disable do CTA se BU não resolvida | Não |
| Perfil | Quem não tem `*:manage` não vê o CTA | Idem | Idem |
| Dados | Não | Não | Não |

Regra UX 2.0 (`docs/reports/sprint-ux-2.0-grupo-avila.md`):

```
CRM > Leads
[Importar]  [Lead Seguro]  [Lead Imobiliário]
```

Isso descreve o que foi entregue, **não** uma proibição de “Novo Negócio” em Leads.

### Ações também divergiam

Dashboard **+ Novo Negócio** ia para `/crm` (visão geral), **sem** abrir o formulário. Pipeline abre `DealFormDialog`. `openCrmCreateDeal` já apontava para `/crm/negocios?create=deal`. O atalho do Dashboard estava **errado** em relação ao helper existente.

Evidência UX 2.0 Dashboard: `docs/reports/sprint-ux-2.0/sprint-ux-20-dashboard.png` (três CTAs). Leads em produção: dois leads + Importar, sem o terceiro.

---

## 4. Impacto da correção

- Leads e Pipeline passam a ter os mesmos três CTAs do Dashboard.
- **+ Novo Negócio** no Dashboard passa a abrir o Pipeline com `?create=deal` (mesmo fluxo do Pipeline).
- Leads: **+ Novo Negócio** navega para `/crm/negocios?create=deal`.
- Pipeline: leads navegam para `/leads?create=insurance|real-estate` (mesmo deep link do Dashboard).
- Leads in-page: os dois CTAs de lead continuam abrindo `LeadDialog` no lugar.
- `Importar` permanece onde já existia (Leads/Pipeline) — placeholder, sem `onClick` (fora deste escopo).
- Permissões inalteradas: sem `leads:manage` os dois leads somem; sem `crm:manage` some o deal.
- Responsivo: o grupo de CTAs usa `flex-wrap` (notebook 1366 e tablet).

**Fora de escopo:** hub `/crm` (“Visão geral”), Leads Imobiliários `/real-estate/leads`, dropdown UX 2.1 no header (substituído pelos três botões).

---

## 5. Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `apps/web/components/crm/crm-capture-actions.tsx` | **Novo** — CTAs na ordem combinada |
| `apps/web/lib/crm/crm-create-navigation.ts` | Hrefs canônicos; deal = `/crm/negocios?create=deal` |
| `apps/web/lib/crm/crm-create-navigation.spec.ts` | Contratos dos hrefs |
| `apps/web/components/dashboard/dashboard-home.tsx` | Usa `CrmCaptureActions` |
| `apps/web/components/leads/leads-page.tsx` | Header usa `CrmCaptureActions` |
| `apps/web/components/crm/deals-page.tsx` | Pipeline usa `CrmCaptureActions` |
| `apps/web/components/crm/crm-page-header-actions.tsx` | `flex-wrap` no grupo primary |

---

## 6. Resultado dos testes (local, `comercial@insureflow.com`, sem deploy)

| Tela | CTAs no header | Ação verificada |
|------|----------------|-----------------|
| Dashboard `/` | + Lead Seguro · + Lead Imobiliário · + Novo Negócio | Links. Destino do deal corrigido para `/crm/negocios?create=deal`. |
| Leads `/leads` | Importar · + Lead Seguro · + Lead Imobiliário · + Novo Negócio | Lead Seguro abre dialog **Novo lead seguro**. Novo Negócio é link para o Pipeline. |
| Pipeline `/crm/negocios` | Importar · + Lead Seguro · + Lead Imobiliário · + Novo Negócio | Novo Negócio abre dialog **Novo negócio**. Deep link `?create=deal` abre o mesmo form. |

Viewports: desktop 1440, notebook 1366, tablet 768 — os três CTAs permanecem no a11y tree (grupo com `flex-wrap`).

Evidência UX 2.0 (produção, antes): `docs/reports/sprint-ux-2.0/sprint-ux-20-dashboard.png`.

**Deploy não feito.**
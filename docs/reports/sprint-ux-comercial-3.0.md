# Sprint UX Comercial 3.0

**Data:** 2026-09-01  
**Ambiente auditado:** produção https://corretoraavila.com.br  
**Branch:** `release/crm-operacao-avila`  
**Objetivo:** elevar UX/UI operacional (gestor / comercial / retaguarda) sem features novas.

---

## 1. Problemas encontrados (auditoria visual)

Auditoria em produção (login admin, empresa **Corretora Ávila** e **Ávila Imóveis**), viewport **1366×768** (notebook primário). Screenshots em `docs/reports/sprint-ux-comercial-3.0/`.

### Header global

- Busca operacional cai para **segunda linha** em 1366: a fileira [Menu] [Empresa] [Notificações] [Perfil] fica no topo e a busca ocupa a largura abaixo, roubando área de conteúdo.
- Em algumas rotas o seletor de empresa some da árvore a11y (clipped / overflow), enquanto visualmente ainda aparece apertado.
- Topbar com `overflow-hidden` e filhos com `min-width` altos: risco de clip de texto no nome da empresa e no atalho ⌘K.
- Ouro (`--primary` no dark = gold) vaza para CTAs e estados ativos — identidade de marca usada como highlight funcional.

### Sidebar / navegação

- Admin Master: CRM → Seguros → Imobiliário → Governança. **Agenda** está no fim do CRM (depois de Customer 360), não no bloco operacional.
- Seguros mistura **Automação** (hub) e omite **Apólices** e **Renovações** (rotas existem).
- Não há grupo **Automação** com Follow-ups / Reativação / WhatsApp (rotas já existem).
- Páginas `/crm/*` repetem um **segundo menu** (`CrmModuleTabs`: Visão geral, Recuperação, SLA, Performance, Contatos, Empresas, Importações, Tarefas, Atividades…). Excesso no topo, overlap com a sidebar.

### Padrão operacional

- Dashboard: 8+ cards grandes (Leads Totais / Seguros / Imobiliários / Conversão / Clientes / Pipelines) + outra grade de ops; muito vazio, CLS enquanto “Carregando…”.
- Leads: KPIs em cards altos (Pipeline sozinho na segunda linha); 4 CTAs (Importar, Lead Seguro, Lead Imobiliário gold, Novo Negócio gold).
- Filtros quebram em duas linhas desalinhadas; placeholder de busca e campo Origem truncados.
- Tabela: colunas de contato/origem/responsável somem cedo; cabeçalhos STATUS e QUESTIONÁRIO colidem visualmente; sem prioridade, sem próximo contato, sem indicadores Sem contato / follow-up.

### Lead dialog

- Formulário único sem hierarquia 1–5.
- Histórico usa `ActivityTimeline` + `ActivityFormDialog` (modal) **em cima** do dialog do lead — stacking.
- Próximo contato (Data personalizada, D-60/D-30/D-15) já existe e funciona; só falta agrupamento visual.

### Agenda Comercial

- Tabs de janela corretas (`today` / `overdue` / `next7` / `next30` / `future`); label **Futuro** deveria ser **Futuras**.
- Segunda fileira de chips de tipo (11 itens) compete com as janelas.
- Tabela: Data/Hora não é a primeira coluna; falta Motivo; falta **Registrar resultado**.
- KPIs em cards com padding alto; empty state só texto.

### Outras telas

- Clientes: descrição longa; 3 KPI cards grandes para zeros; CTAs Importar + Novo cliente (Novo usa primary gold).
- Imóveis / Leads Imobiliários: mesmo padrão de captura gold e cards.
- Governança > Usuários / Configurações: chrome inconsistente com CRM (ok estruturalmente; não duplicar menu).

### Feedback / a11y

- Muitos “Carregando…” em texto, poucos skeletons no dashboard.
- Botões `sm` com altura 28px (abaixo de 32px em alguns CTAs).
- Gold em focus/CTA reduz contraste operacional (navy/ivory seria o peso certo).

---

## 2. Alterações

| Área | O que mudou |
|------|-------------|
| Header | Uma linha `[Menu] [Empresa] [Busca] [Notificações] [Perfil]`; `flex-nowrap`; busca encolhe; ⌘K só em xl; sino volta (popover para Agenda atrasados / Follow-ups). Sem destaque de IA. |
| Botões | Variant `default` = navy Ávila, não gold. Gold fica no chrome (sidebar, logo, ring). |
| Sidebar | CRM: Leads, Pipeline, Agenda, Clientes, 360. Seguros: Questionários, Cotações, Propostas, Apólices, Renovações. Automação: Follow-ups, Reativação, WhatsApp (rotas existentes). Governança inalterada. ACL preservado. |
| CRM chrome | `CrmModuleTabs` removido — não há segundo menu no topo de Agenda/Pipeline. |
| Leads | `[+ Novo Lead]` (menu seguro/imobiliário) + Importar. KPIs compactos: Leads, Sem contato, Follow-ups, Conversão, Pipeline. Tabela: Lead + prioridade, Contato, Origem, Status, Responsável, Próximo contato, Última interação, Ações. Indicador Sem contato. |
| DataTable | Removido `overflow-visible` no fill (cabeçalhos não colidem). |
| Lead dialog | Seções 1 Dados · 2 Qualificação · 3 Oportunidade · 4 Próxima ação · 5 Histórico. D-60/D-30/D-15 e Data personalizada preservados. Registrar atividade **inline** (sem modal-on-modal). |
| Agenda | Tabs: Hoje, Atrasados, Próximos 7/30, **Futuras** (`future` API). KPIs compactos. Colunas Data/Hora → Motivo. Ações: Concluir, Reagendar, Registrar resultado, Abrir Lead. |
| Dashboard | StatCards `density=compact`; CTAs de captura sem gold. |
| Filtros | FilterBar em uma linha com scroll horizontal; PageHeader compacto ainda mostra descrição curta. |

**Não feito de propósito:** WhatsApp/Reativação/Portal como produto; `leads-list-diagnostics`; WIP de portal/governança/`.env`; mistura de BUs na Agenda.

---

## 3. Screenshots before / after

| Arquivo | Tela |
|---------|------|
| `sprint-ux-30-leads-1366-before.png` | Leads 1366 — before |
| `sprint-ux-30-dashboard-1366-before.png` | Dashboard 1366 — before |
| `sprint-ux-30-agenda-1366-before.png` | Agenda 1366 — before |

After: após deploy em produção (seção 8).

---

## 4. Componentes alterados

- `app-topbar.tsx`, `app-notifications.tsx`, `business-unit-switcher.tsx`, `workspace-search.tsx`
- `operational-shell.ts`, `design-system/layout.ts`, `design-system/navigation.tsx`, `ui/button.tsx`
- `navigation.ts` + `navigation.spec.ts`
- `crm-shell.tsx`, `crm-capture-actions.tsx`
- `leads-page.tsx`, `lead-dialog.tsx`, `lead-create-menu.tsx`, `lead-capture-metrics.tsx`
- `lead-capture-metrics.ts`, `use-lead-capture-metrics.ts`, `lead-operational-signals.ts`
- `data-table.tsx` (fill overflow)
- `activity-form-dialog.tsx`, `activity-timeline.tsx`, `activity-quick-actions.tsx`
- `commercial-agenda-workspace.tsx`, `crm/agenda/page.tsx`
- `grupo-avila-kpi-grid.tsx`, `dashboard-commercial-ops-kpis.tsx`

---

## 5. Resultado dos testes

| Suite | Resultado |
|-------|-----------|
| `npx tsx --test apps/web/lib/navigation.spec.ts` | 9/9 pass |
| `node --test` `crm-capture-visibility.spec.ts` | 7/7 pass |
| `npx vitest run` lead-capture-metrics, lead-operational-signals, lead-intent | 8/8 pass |
| `tsc --noEmit -p apps/web` na árvore suja | falha só em `governance-companies.tsx` (WIP alheio, esperado) |

---

## 6. Resultado do smoke

*(após deploy)*

---

## 7. URL de produção

https://corretoraavila.com.br

---

## 8. SHA, deploy IDs, horário BRT

*(após commit/deploy)*

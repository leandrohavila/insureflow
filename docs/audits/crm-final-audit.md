# InsureFlow – Auditoria Final do CRM Comercial

**Data:** 2026-07-09  
**Sprint:** 6.4 — Hardening, UX e Estabilização Final  
**Escopo:** Auditoria read-only + correções pequenas e seguras  
**Referências:** Sprints 6.0–6.3, relatórios `docs/reports/sprint6-phase*.md`

---

## Sumário executivo

O CRM Comercial está **operacional de ponta a ponta** após as sprints 6.1–6.3: pipeline, Deal Workspace com cotações inline, Commercial Journey, timeline unificada e questionários integrados. Para operação diária, o produto está **apto a iniciar a Sprint 7 (Integração com Seguradoras)**, com ressalvas documentadas abaixo.

**Correções aplicadas nesta sprint (seguras, sem mudança de contrato/regra):**

| Correção | Arquivo(s) |
|---|---|
| Remoção de `console.log` de login em produção | `apps/web/lib/auth/session.ts` |
| Dedupe React Query — limite unificado de comparativos no Deal Workspace | `quotes/constants.ts`, `deal-quotes-hub.tsx`, `commercial-intelligence/hooks.ts` |
| Remoção de botão “Filtros” não funcional na página de cotações | `quotes-page.tsx` |
| Tratamento de erro em drawers de cotação | `quote-comparison-drawer.tsx`, `quote-line-drawer.tsx` |
| Feedback de erro no painel Commercial Journey | `commercial-intelligence-panel.tsx` |

---

## Legenda de severidade

| Nível | Critério |
|---|---|
| **CRÍTICO** | Impede operação, perda de dados, falha de segurança ou quebra total de fluxo |
| **ALTO** | Degrada experiência diária, performance severa ou funcionalidade prometida ausente |
| **MÉDIO** | Inconsistência UX/DX, dívida técnica com workaround, impacto parcial |
| **BAIXO** | Polish, refino visual, melhoria incremental |

---

# Fase 1 — Auditoria visual

## Telas auditadas

| Tela | Rota / componente | Estado geral |
|---|---|---|
| Leads | `/leads`, `leads-page.tsx` | ✅ Operacional; denso em mobile |
| Clientes | `/clientes`, `customers-page.tsx` | ✅ Operacional |
| Pipeline / Negócios | `/crm/negocios`, `deals-page.tsx` | ✅ Kanban + lista |
| Deal Workspace | `deal-sheet-v2.tsx` | ✅ Sheet V2 padrão |
| Questionários | `/questionarios/*` | ✅ Templates + respostas |
| Cotações (módulo) | `/cotacoes`, `quotes-page.tsx` | ⚠️ Read-only parcial |
| Cotações (deal) | `deal-quotes-hub.tsx` | ✅ CRUD inline |
| Commercial Journey | `commercial-intelligence-panel.tsx` | ✅ Aside xl+ |
| Timeline | `timeline-lane.tsx` | ✅ Sticky headers |
| CRM Overview | `/crm`, `crm-overview.tsx` | ✅ Shell operacional |
| Propostas | `/propostas` | ✅ Workflow completo |
| Tarefas / Agenda | `/crm/tarefas`, `/crm/agenda` | ⚠️ UI local/mock parcial |

### Achados visuais

| ID | Sev. | Tela | Achado |
|---|---|---|---|
| V-01 | MÉDIO | Deal Workspace | Commercial Journey ocupa coluna inteira abaixo do conteúdo em `<xl`; scroll longo no mobile |
| V-02 | MÉDIO | Deal Workspace | Rail horizontal mobile compete por altura com header denso |
| V-03 | BAIXO | Cotações (`/cotacoes`) | Página sem ações de criação — diverge visualmente do hub no deal |
| V-04 | BAIXO | Deal Workspace | Abas Documentos/Apólices disabled com badge “Em desenvolvimento” — correto, mas quebra expectativa visual |
| V-05 | BAIXO | Várias páginas | Botões “Importar” visíveis sem ação (Leads, Negócios, Clientes, Contatos, Empresas) |
| V-06 | BAIXO | `crm-operational.css` | ~1270 linhas legadas convivendo com design tokens — risco de spacing inconsistente |
| V-07 | BAIXO | Dark mode | Tema default `dark` via `InsureFlowThemeProvider`; alguns tokens CRM usam `color-mix` manual |

**Alinhamentos / scroll:** `EntitySheetShell.Body` é único scroll container — Timeline sticky funciona. Aside Commercial Journey usa `xl:sticky` — OK em desktop.

---

# Fase 2 — UX

## Estados de interface

| Padrão | Cobertura | Observação |
|---|---|---|
| Loading | ✅ Amplo | `LoadingState`, spinners inline, `DataTable` loading |
| Empty | ✅ Amplo | `EmptyState`, mensagens contextuais |
| Error | ⚠️ Parcial | DataTables com retry; drawers de cotação **corrigidos** nesta sprint |
| Success feedback | ⚠️ Parcial | `ActionToast` só em Tarefas/Agenda; mutations de cotação/CRM sem toast |
| Skeletons | ⚠️ Limitado | Poucos skeletons; majoritariamente loading text/spinner |
| Confirmações | ⚠️ `window.confirm` | Exclusões usam confirm nativo — funcional, não alinhado ao DS |
| Drawers | ✅ | Quote drawers, questionnaire detail sheet |
| Modais | ✅ | Deal/Lead forms via Dialog |

### Achados UX

| ID | Sev. | Achado |
|---|---|---|
| U-01 | ALTO | Página `/cotacoes` read-only — usuário precisa abrir Deal Workspace para criar comparativo |
| U-02 | MÉDIO | Mutations de cotação/proposta/CRM sem toast de sucesso — usuário depende de refresh visual |
| U-03 | MÉDIO | `window.confirm` para exclusões (leads, deals, customers, activities) — UX inconsistente |
| U-04 | MÉDIO | Botões “Importar” em 6+ telas sem handler — expectativa quebrada |
| U-05 | MÉDIO | Commercial Journey em mobile empilhado — difícil correlacionar ação + jornada |
| U-06 | BAIXO | Filtro “Todos” em propostas/cotações OK; busca textual ausente em cotações |
| U-07 | BAIXO | Abas CRM Tarefas/Atividades operacionais mas sem persistência backend completa |
| U-08 | BAIXO | Drawers de cotação sem feedback de sucesso explícito após save |

---

# Fase 3 — Performance

## React Query

| Padrão | Status |
|---|---|
| Query keys centralizadas | ✅ `query-keys.ts` |
| Invalidação cruzada quotes → CRM/activities | ✅ Sprint 6.2 |
| Deduplicação timeline no deal sheet | ✅ Mesma key `useActivityTimeline` |
| Limite comparativos deal workspace | ✅ **Corrigido** — `DEAL_WORKSPACE_QUOTES_LIMIT = 20` |

### Achados performance

| ID | Sev. | Achado |
|---|---|---|
| P-01 | ALTO | `GET /crm/deals` sem paginação por default — carrega todos os deals (paginação opcional existe no backend desde 6.1) |
| P-02 | MÉDIO | `useCommercialIntelligence` dispara até 5 queries ao abrir deal sheet — aceitável com cache, pesado em rede lenta |
| P-03 | MÉDIO | Relationship index client-side cap 500 — truncamento silencioso |
| P-04 | MÉDIO | `findDeals` enrichment (questionnaire + quotes + activities) — N+1 no backend |
| P-05 | MÉDIO | `questionnaire-templates-page.tsx` (~2066 linhas) — bundle e re-render custosos |
| P-06 | BAIXO | Commercial Intelligence recalcula snapshot a cada mudança de query — mitigado por `useMemo` |
| P-07 | BAIXO | Framer Motion no pipeline — `useReducedMotion` respeitado |

---

# Fase 4 — Design System

| Token / primitivo | Adoção CRM | Gap |
|---|---|---|
| Typography (`crm-text-*`) | ✅ Consistente no workspace | Algumas páginas legadas misturam classes Tailwind ad hoc |
| Spacing | ✅ `SectionPanel`, `PropertyGrid` | `crm-operational.css` duplica spacing |
| Cards | ✅ `GlassCard`, `SectionPanel` | — |
| Tables | ✅ `DataTable` compartilhado | — |
| Inputs / Forms | ✅ `FormField`, `FormLayout` | Drawers usam textarea nativo (OK) |
| Buttons | ✅ `buttonVariants` | Importar buttons órfãos |
| Badges / StatusPill | ✅ CRM primitives | — |
| Drawers / Sheets | ✅ `EntitySheetShell`, ui/sheet | — |
| Icons | ✅ lucide consistente | — |
| Estados loading/error/empty | ✅ `list-states.tsx` | Skeletons raros |
| Dark mode | ✅ Theme provider + tokens shadcn | CRM CSS legado parcialmente hardcoded |

| ID | Sev. | Achado |
|---|---|---|
| D-01 | MÉDIO | Migração incompleta `crm-operational.css` → design tokens |
| D-02 | BAIXO | `@deprecated crm-layout-classes.ts` ainda referenciado |
| D-03 | BAIXO | Confirm dialogs nativos vs `Dialog` do DS |

---

# Fase 5 — Código

## Scan automatizado

| Padrão | Ocorrências relevantes |
|---|---|
| `TODO` / `FIXME` / `HACK` | Nenhum crítico no CRM web |
| `console.log` | **Removidos** de `session.ts`; demais gated (`DEAL_CONTRACT_DEBUG`, `NEXT_PUBLIC_PIPELINE_DND_DEBUG`) |
| `console.warn/error` | Login route error; relationship boundary; runtime audit gated |
| Componentes mortos | `crm-page.tsx`, `deal-detail-sheet`, dashboard widgets — **removidos** em 6.1 |
| Hooks write quotes | **Wired** no Deal Workspace (6.2) |
| Testes web | 8 specs vitest — **sem script `test` no package web** |
| Testes API | 2 falhas legadas (`document.util.spec.ts`, `app.controller.spec.ts`) |

| ID | Sev. | Achado |
|---|---|---|
| C-01 | ALTO | Testes API com 2 falhas — CI instável |
| C-02 | MÉDIO | Vitest specs no web sem runner no `package.json` |
| C-03 | MÉDIO | Monolitos: `questionnaire-templates-page`, `leads-page`, `quotes/hooks.ts` |
| C-04 | BAIXO | Debug flags (`RUNTIME_AUDIT`, `DEAL_CONTRACT_DEBUG`) documentadas implicitamente |
| C-05 | BAIXO | Timeline: 3 variantes de lane (`timeline-lane`, `merged`, `operational`) |

---

# Fase 6 — Consolidado por severidade

## CRÍTICO

_Nenhum achado crítico bloqueando operação diária após sprints 6.1–6.3._

## ALTO

| ID | Área | Descrição | Ação Sprint 7+ |
|---|---|---|---|
| U-01 | UX | Módulo `/cotacoes` read-only | Wire create/edit ou redirect guiado |
| P-01 | Perf | Lista de deals sem paginação default no frontend | Usar `page/limit` em `useCrmDeals` quando lista > N |
| C-01 | QA | 2 testes Jest falhando | Corrigir specs legados |

## MÉDIO

| ID | Área | Descrição |
|---|---|---|
| V-01 | Visual | Commercial Journey mobile — layout empilhado longo |
| U-02 | UX | Falta toast global pós-mutation comercial |
| U-03 | UX | `window.confirm` em exclusões |
| U-04 | UX | Botões Importar sem implementação |
| U-05 | UX | Jornada comercial pouco acessível em viewport estreita |
| P-02 | Perf | 5 queries ao abrir deal sheet (inteligência comercial) |
| P-03 | Perf | Relationship index cap 500 |
| P-04 | Perf | Enrichment pesado em `findDeals` |
| P-05 | Perf | Monolito questionnaire templates |
| D-01 | DS | CSS operacional legado |
| C-02 | QA | Vitest não wired |
| C-03 | DX | Pages/components muito grandes |

## BAIXO

| ID | Área | Descrição |
|---|---|---|
| V-03–V-07 | Visual | Polish, import buttons, dark/CSS legado |
| U-06–U-08 | UX | Busca, feedback sucesso, tarefas locais |
| P-06–P-07 | Perf | Memoização OK; motion OK |
| D-02–D-03 | DS | Deprecations, confirm nativo |
| C-04–C-05 | Código | Debug flags, timeline variants |

---

# Matriz de prontidão — Sprint 7

| Capacidade | Pronto? | Notas |
|---|---|---|
| Lead → Deal → Questionário | ✅ | Fluxo operacional |
| Cotações no Deal Workspace | ✅ | Sprint 6.2 |
| Commercial Intelligence | ✅ | Sprint 6.3 — apólice/renovação blocked até Policies API |
| Propostas | ✅ | Centro de propostas completo |
| Timeline / Activity Engine | ✅ | Eventos comerciais publicados |
| RBAC / Multi-tenant | ✅ | Sem alterações nesta sprint |
| Integração seguradoras | ⏳ | Sprint 7 — `externalSource`, bulk API prontos no backend |
| Apólices no CRM UI | ⏳ | Aba disabled; backend Policies existe |
| Importação em massa | ⏳ | Botões placeholder |
| Notificações / Tasks persistidos | ⏳ | UI parcial |

---

# Validação (pós-correções)

| Check | Resultado |
|---|---|
| `npm run lint` | ✅ |
| `npm run check-types` | ✅ |
| `npm run test -w api` | ⚠️ 56/58 (2 falhas legadas) |
| `npm run build` | ✅ |

---

# Arquivos alterados na Sprint 6.4

```
apps/web/lib/auth/session.ts
apps/web/lib/data-access/modules/quotes/constants.ts
apps/web/lib/data-access/modules/quotes/index.ts
apps/web/lib/data-access/modules/commercial-intelligence/hooks.ts
apps/web/components/quotes/deal-quotes-hub.tsx
apps/web/components/quotes/quotes-page.tsx
apps/web/components/quotes/quote-comparison-drawer.tsx
apps/web/components/quotes/quote-line-drawer.tsx
apps/web/components/crm/commercial-intelligence/commercial-intelligence-panel.tsx
docs/audits/crm-final-audit.md
```

---

## Conclusão

O CRM Comercial InsureFlow está **estabilizado para operação diária** com fluxo comercial guiado, cotações no negócio e inteligência comercial derivada. As pendências **ALTO** restantes são evolutivas (read-only em `/cotacoes`, paginação frontend, testes legados) e não bloqueiam o kickoff da **Sprint 7 — Integração com Seguradoras**, desde que a equipe trate a página de cotações global e feedback pós-mutation como melhorias paralelas prioritárias.

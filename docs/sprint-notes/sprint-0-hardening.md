# Sprint 0 — Hardening Operacional

> Concluído em maio/2026. Estabilização da base antes de Activities, Customer lifecycle e Quotes.

## Entregas

| Item | Status | Notas |
|------|--------|-------|
| CRM list view scroll (P0) | ✅ | Vista lista com `CRM_PAGE_SHELL_SCROLL` + `stickyHeader` no DataTable |
| Query param `?deal=` (P1) | ✅ | Sync bidirecional via `router.replace` |
| Search debounce (P2) | ✅ | 400ms em leads, clientes, templates, negócios, contatos, empresas, atividades |
| KPIs reais (P1) | ✅ | `meta.counts` no backend leads/customers |
| Draft restore robusto (P1) | ✅ | Merge timestamp-aware; local mais recente prevalece |
| DnD rollback (P2) | ✅ | Snapshot no drag start; revert em cancel/falha API |
| Builder reorder (P2) | ✅ | `mutateAsync` serializado + guard `fieldReorderInFlight` |
| Activities placeholder cleanup | ✅ | `crm-deal-timeline-preview.ts` compartilhado |

## QA manual recomendado

### Resoluções

- [ ] 1366×768 — Kanban scroll horizontal; sidebar drawer; lista negócios scroll interno
- [ ] 1440×900 — Sidebar inline colapsável; sticky header lista
- [ ] 1920×1080 — Sidebar sempre aberta; rail max 1600px

### Zoom

- [ ] 90% / 100% / 110% — sem overflow global; modais legíveis

### Fluxos

- [ ] DnD: mover card, cancelar (Esc), falha API (desconectar rede)
- [ ] `?deal=` — abrir sheet, copiar URL, refresh, browser back
- [ ] Draft questionário — editar offline, refresh, múltiplas abas
- [ ] KPIs leads/clientes — conferir totais vs filtros ativos

## Regressões restantes (backlog pós-Sprint 0)

| Prioridade | Item |
|------------|------|
| P2 | `DataTable.selectable` — checkboxes sem funcionalidade |
| P2 | CRM deals: full tenant load (escala) — paginação futura |
| P2 | Kanban: headers de coluna não sticky em scroll vertical |
| P3 | `navigateBackToCrm` + `history.back()` pode desviar |
| P3 | `crm-page.tsx` órfão |
| P3 | Breakpoints 1440/1920 sem tuning dedicado |

## Próximo sprint

**Sprint 1 — Activities Domain:** substituir `buildDealTimelinePreview` por entidade `Activity` + API + timeline real.

---

## Addendum — Pipeline ordering (pré-Sprint 1)

| Item | Status |
|------|--------|
| Campo `pipelineOrder` (Float, fractional indexing) | ✅ |
| Migration + backfill por tenant/stage | ✅ |
| Reorder intra/inter coluna via `@dnd-kit/sortable` | ✅ |
| PATCH único `{ stage, pipelineOrder }` por drag | ✅ |
| Rollback Sprint 0 preservado | ✅ |

**Migration:** `20260520120000_deal_pipeline_order` — rodar `prisma migrate deploy` antes de testar.

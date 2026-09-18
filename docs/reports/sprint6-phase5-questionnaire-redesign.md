# Sprint 6.5 — Redesign UX Builder de Questionários

Relatório da sprint exclusiva de UX/UI do Builder de Questionários do InsureFlow.

**Escopo respeitado:** nenhuma alteração em endpoints, Prisma, DTOs, Activity Engine, RBAC ou multi-tenant. Toda a lógica de persistência reutiliza hooks e mutations existentes.

---

## Componentes alterados / criados

### Página orquestradora

| Arquivo | Papel |
|---------|--------|
| `apps/web/components/questionnaires/questionnaire-templates-page.tsx` | Reescrita como orquestrador (~620 linhas vs ~2066). Layout 3 colunas, atalhos, dialogs. |

### Novo módulo `questionnaire-builder/`

| Arquivo | Papel |
|---------|--------|
| `builder-header.tsx` | Header com título, busca, filtros, Importar, Novo, Preview, Salvar, Publicar |
| `template-list.tsx` | Coluna 1 — cards de templates (substitui `DataTable`) |
| `builder-canvas.tsx` | Coluna 2 — accordions por seção, DnD, cards de perguntas |
| `form-preview.tsx` | Coluna 3 — simulador interativo com progresso, páginas, viewport |
| `template-dialog.tsx` | Dialog de criar/editar template (extraído) |
| `field-dialog.tsx` | Dialog de criar/editar pergunta (extraído) |
| `preview-control.tsx` | Controle de preview inline no dialog de pergunta |
| `constants.ts` | Labels, status, tipos de pergunta |
| `types.ts` | Tipos compartilhados do builder |
| `utils.ts` | Helpers de seção, ordenação, slug, agrupamento |

---

## Decisões de UX

1. **Layout 3 colunas (desktop)** — Templates (22%) · Builder (53%) · Preview (25%), alinhado a ferramentas tipo Notion/Typeform/HubSpot Forms.
2. **Cards em vez de tabelas** — Lista de templates e perguntas como cards reduz carga cognitiva e facilita scan visual.
3. **Accordions modulares** — Cada seção é um módulo colapsável com contagem de perguntas, drag handle e ações (duplicar, renomear, excluir).
4. **Drag & drop (@dnd-kit)** — Substituição completa dos botões subir/descer para seções e perguntas.
5. **Preview sticky e interativo** — Usa `QuestionnaireAnswerField` real; barra de progresso; navegação por páginas (uma seção = uma página); accordions internos; botões Anterior/Próxima.
6. **Viewport toggle** — Desktop / Tablet / Mobile no preview para validar responsividade sem sair do builder.
7. **Responsividade em camadas:**
   - **≥1600px / ≥1280px:** 3 colunas
   - **1024–1279px:** templates + builder; preview recolhível (painel fixo lateral)
   - **<1024px:** preview em `Sheet` (drawer)
8. **Atalhos de teclado:** `Ctrl/Cmd+S` salvar (refetch), `Ctrl/Cmd+N` novo template, `Ctrl/Cmd+P` preview.
9. **Importar template** — Botão presente no header; abre fluxo de novo template (importação por arquivo documentada como evolução futura).

---

## Melhorias implementadas

- Remoção da `DataTable` de templates
- Remoção dos botões `ArrowUp` / `ArrowDown`
- Header operacional unificado (busca + filtros + ações)
- Duplicar seção (copia perguntas via `createField` existente)
- Memoização em cards de template, preview e field cards
- `aria-label`, `aria-expanded`, `role="progressbar"`, focus rings e tooltips
- Tokens do design system: `--if-space-*`, `--if-layout-*`, gaps consistentes

---

## Ganhos de usabilidade

| Antes | Depois |
|-------|--------|
| Tabela densa de templates | Cards escaneáveis com métricas visíveis |
| Builder abaixo da tabela (scroll longo) | 3 áreas visíveis simultaneamente no desktop |
| Reordenar com setas (lento, sem contexto) | Arrastar seções e perguntas |
| Preview estático desabilitado | Simulador respondível em tempo real |
| Sem feedback de progresso | Barra de progresso no preview |
| Layout único | Toggle Desktop/Tablet/Mobile |

---

## Screenshots comparativas (antes / depois)

> Screenshots devem ser capturadas manualmente em `/questionarios/templates` após deploy local.

### Antes
- Tabela full-width de templates
- Builder em grid 2 colunas abaixo da tabela
- Perguntas com botões ↑↓
- Preview com inputs desabilitados

### Depois
- Coluna esquerda: cards de templates selecionáveis
- Centro: accordions modulares com DnD
- Direita: preview sticky interativo com viewport switcher
- Header consolidado com Salvar/Publicar

**Placeholder paths sugeridos:**
- `docs/reports/assets/sprint6-phase5-before.png`
- `docs/reports/assets/sprint6-phase5-after-desktop.png`
- `docs/reports/assets/sprint6-phase5-after-mobile-drawer.png`

---

## Checklist de responsividade

| Breakpoint | Layout | Preview | Status |
|------------|--------|---------|--------|
| ≥1600px | 3 colunas (22/53/25) | Sticky coluna 3 | ✅ Implementado |
| 1280–1599px | 3 colunas reduzidas | Sticky coluna 3 | ✅ Implementado |
| 1024–1279px | Templates + builder | Recolhível (botão Preview) | ✅ Implementado |
| <1024px | Stack vertical | Drawer (`Sheet`) | ✅ Implementado |
| Mobile 390px | Cards full-width | Viewport mobile no drawer | ✅ Implementado |

---

## Validação

| Check | Resultado |
|-------|-----------|
| `npm run lint -- --filter=web` | ✅ Passou |
| `npm run check-types -- --filter=web` | ✅ Passou |
| `npm run build -- --filter=web` | ✅ Passou |
| `npm test` (api) | ⚠️ 56/58 — 2 testes legados pré-existentes (`document.util.spec.ts`, `app.controller.spec.ts`) |

---

## Arquivos removidos / reduzidos

- Lógica monolítica de ~1400 linhas movida para `questionnaire-builder/*`
- `DataTable` removida desta página (componente shared permanece no projeto)

---

## Próximos passos (fora do escopo UX)

- Importação real de template via JSON/arquivo
- Virtualização se listas ultrapassarem ~100 itens
- Screenshots automatizadas em CI visual

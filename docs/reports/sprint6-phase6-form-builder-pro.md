# Sprint 6.6 — Form Builder Professional Experience

Relatório da evolução UX/UI do Builder de Questionários para experiência profissional tipo Typeform / HubSpot / Notion.

**Escopo respeitado:** nenhuma alteração em APIs, backend, Prisma, DTOs, hooks, React Query, Activity Engine, RBAC ou multi-tenant.

---

## Melhorias visuais

### Fase 1 — Hierarquia visual (Canvas)

- Novo sistema de superfícies em `builder-surfaces.ts`:
  - **Canvas** → fundo base com padding generoso
  - **Level 1** → módulos de seção (borda + shadow-if-xs)
  - **Level 2** → área interna da seção
  - **Card** → perguntas com hover, seleção e shadow
- Espaçamento entre seções aumentado (`--if-space-5`)
- Seções visualmente independentes com header contrastante

### Fase 2 — Preview

- Coluna ampliada para **32%** no grid (≥1280px)
- Molduras de dispositivo:
  - **Desktop:** barra de browser simulada
  - **Tablet / Mobile:** bezel escuro estilo hardware
- Barra de progresso destacada (gradiente, 2px)
- Indicador de páginas com **dots** clicáveis
- Botão final “Enviar” na última página
- Preview permanece sticky

### Fase 3 — Cards de perguntas

- Layout horizontal: handle · número · título · ações
- Ações: Editar, **Duplicar**, Excluir (com tooltips)
- Estado selecionado com ring primary
- Padding e alinhamento revisados

---

## Componentes alterados / criados

| Arquivo | Descrição |
|---------|-----------|
| `builder-surfaces.ts` | Tokens de hierarquia visual |
| `field-library.ts` | 21 tipos de campo mapeados ao backend |
| `field-library-panel.tsx` | Painel recolhível “Biblioteca de Campos” |
| `field-form.ts` | Lógica compartilhada de formulário de pergunta |
| `field-properties-panel.tsx` | Painel lateral com auto-save (600ms debounce) |
| `builder-workspace.tsx` | Orquestra biblioteca + canvas + propriedades |
| `builder-canvas.tsx` | Hierarquia visual, cards, skeleton |
| `form-preview.tsx` | Device frames, progresso, page dots |
| `builder-confirm-dialog.tsx` | Substitui `window.confirm` |
| `autosave-indicator.tsx` | ● Pendente / Salvando / Salvo |
| `versions-menu.tsx` | Menu Versões (UI-only) |
| `builder-skeleton.tsx` | Loading skeleton do canvas |
| `builder-header.tsx` | Auto-save + Versões |
| `questionnaire-templates-page.tsx` | Integração completa |

**Removido do fluxo principal:** modal `QuestionnaireFieldDialog` (mantido no repo para referência, não mais usado na página).

---

## Ganhos de produtividade

| Antes (6.5) | Depois (6.6) |
|-------------|--------------|
| Modal para cada edição de pergunta | Painel lateral persistente |
| Inserir pergunta via botão + modal | Clique na biblioteca → campo criado + painel aberto |
| Sem duplicar pergunta | Duplicar em 1 clique |
| `window.confirm` nativo | Dialog acessível e consistente |
| Status de save implícito | Indicador visual de auto-save |
| Preview estreito (25%) | Preview amplo (32%) com moldura |
| Mesma cor em todos os níveis | 4 níveis de contraste |

**Redução estimada de cliques por pergunta:** ~3 cliques (abrir modal → editar → salvar → fechar → reabrir).

---

## Decisões de UX

1. **Painel > Modal** — edição inline no contexto do canvas; modal reservado a confirmações e template.
2. **Biblioteca por clique** — arquitetura com `data-library-field` preparada para DnD futuro.
3. **Auto-save com debounce** — 600ms; indicador reflete pending/saving/saved sem novas APIs.
4. **Versões UI-only** — exibe v atual + mock v-1; mensagem “em breve” para versionamento real.
5. **Campos estendidos (Hora, Renavam, Chassi, Assinatura, Imagem)** — mapeados para tipos existentes (`TEXT`, `FILE`, etc.) via `settings.inputKind` e placeholders, sem migration.
6. **Valor padrão** — armazenado em `settings.defaultValue` (campo JSON existente), sem alterar DTO.

---

## Screenshots antes / depois

> Capturar em `/questionarios/templates` após deploy local.

| Cena | Antes (6.5) | Depois (6.6) |
|------|-------------|--------------|
| Canvas | Tons uniformes | 4 níveis de superfície |
| Edição | Modal central | Painel direito sticky |
| Inserção | Botão Nova pergunta | Biblioteca lateral |
| Preview | 25%, sem moldura | 32%, device frame |
| Confirmação | Alert nativo | Dialog design system |

Paths sugeridos:
- `docs/reports/assets/sprint6-phase6-before.png`
- `docs/reports/assets/sprint6-phase6-after.png`

---

## Oportunidades futuras

- **Drag & Drop da biblioteca** — infraestrutura `draggable: true` + `data-library-field` já presente
- **Versionamento real** — backend de revisões e diff entre versões
- **Import JSON** — botão Importar no header
- **Virtualização** — se templates > 100 campos
- **Undo/Redo** — stack local de alterações
- **Validação avançada no painel** — regras condicionais (requer backend)

---

## Validação

| Check | Resultado |
|-------|-----------|
| `npm run lint -- --filter=web` | ✅ |
| `npm run check-types -- --filter=web` | ✅ |
| `npm run build -- --filter=web` | ✅ |
| `npm test` (api) | ⚠️ 56/58 — 2 testes legados pré-existentes |

---

## Checklist de fases

| Fase | Status |
|------|--------|
| 1 — Hierarquia visual | ✅ |
| 2 — Preview profissional | ✅ |
| 3 — Cards de perguntas | ✅ |
| 4 — Biblioteca de campos | ✅ |
| 5 — Painel de propriedades | ✅ |
| 6 — Auto-save visual | ✅ |
| 7 — Histórico / Versões UI | ✅ |
| 8 — Dialogs, tooltips, skeleton | ✅ |
| 9 — Memoização | ✅ |
| 10 — Spacing / dark / tipografia | ✅ |

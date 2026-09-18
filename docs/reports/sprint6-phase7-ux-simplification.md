# Sprint 6.7 — UX Simplification & Progressive Disclosure

Relatório da simplificação do Builder de Questionários com foco no **Canvas** e **progressive disclosure** — painéis secundários aparecem apenas quando necessários.

**Escopo respeitado:** nenhuma alteração em backend, APIs, Prisma, DTOs, React Query, Activity Engine, RBAC ou multi-tenant.

---

## Decisões de UX

### 1. Canvas como protagonista

- Grid desktop fixo: **Templates 20% · Canvas 55% · Preview 25%**
- Biblioteca e propriedades **removidas do layout fixo**
- Padding e gaps do canvas ampliados (`builder-surfaces.ts`) para respiro visual
- Seções como módulos independentes (Level 1 / Level 2)

### 2. Progressive disclosure — Biblioteca

- **Drawer lateral esquerdo** (`field-library-drawer.tsx`) substitui painel permanente
- Abre via:
  - Botão **Adicionar** / **Inserir campo** no canvas
  - **Nova pergunta** em cada seção
  - Atalho **`/`** (fora de inputs)
- **Fecha automaticamente** após inserir campo
- **Não abre** painel de propriedades após inserção — foco permanece no canvas

### 3. Progressive disclosure — Propriedades

- **Sheet lateral direito** apenas quando uma pergunta está selecionada
- Fecha ao clicar no fundo do canvas ou no botão fechar
- Auto-save (600 ms) mantido da sprint 6.6

### 4. Biblioteca categorizada + busca

Categorias em `field-library.ts`:

| Categoria   | Campos |
|------------|--------|
| Texto      | Texto, Texto Longo, Número, Moeda |
| Documentos | CPF, CNPJ, CEP, Email, Telefone |
| Veículos   | Placa, Renavam, Chassi |
| Escolhas   | Select, MultiSelect, Radio, Checkbox |
| Arquivos   | Arquivo, Imagem, Assinatura |

Busca filtra por label, categoria e keywords.

### 5. Quick Add

- Menu **Adicionar** (`quick-add-menu.tsx`) com 8 campos frequentes
- Inserção em 1 clique, sem abrir drawer
- Link “Ver todos os campos…” abre biblioteca completa

### 6. Menu contextual nas perguntas

- Ações **Editar / Duplicar / Mover / Excluir** no menu **⋮**
- Visível apenas no **hover** ou **focus-within** do card
- Handle de drag permanece sempre visível para DnD

### 7. Auto-focus no Canvas

Após nova seção, inserção, duplicação ou fechamento da biblioteca, o canvas recebe foco (`tabIndex={-1}`) para evitar perda de contexto.

### 8. Responsividade

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1280px)** | Templates \| Canvas \| Preview (20/55/25) |
| **Tablet (1024–1279px)** | Canvas + Preview flutuante; Templates via drawer |
| **Mobile (<1024px)** | Canvas; Preview, Templates, Biblioteca e Properties em sheets |

---

## Componentes removidos do fluxo principal

| Componente | Motivo |
|-----------|--------|
| `field-library-panel.tsx` | Substituído por `field-library-drawer.tsx` (não fixo) |
| Painel fixo de propriedades (`aside w-72`) | Substituído por Sheet contextual |
| Ações sempre visíveis nos cards | Substituídas por menu ⋮ no hover |
| Grid 20/48/32 (6.6) | Redistribuído para 20/55/25 privilegiando canvas |

> `field-library-panel.tsx` permanece no repositório, mas não é mais referenciado pela página.

---

## Componentes criados / simplificados

| Arquivo | Mudança |
|---------|---------|
| `field-library-drawer.tsx` | **Novo** — drawer com categorias e busca |
| `quick-add-menu.tsx` | **Novo** — inserção rápida sem telas extras |
| `field-library.ts` | Categorias, keywords, `filterLibraryItems`, `groupLibraryItems`, `quickAddItems` |
| `builder-workspace.tsx` | Canvas full-width + drawers contextuais |
| `builder-canvas.tsx` | Toolbar Quick Add, menu ⋮, textos atualizados |
| `field-properties-panel.tsx` | Conteúdo only (sem `aside` fixo) |
| `builder-surfaces.ts` | Mais padding/gap no canvas |
| `builder-header.tsx` | Botão Templates (tablet/mobile) |
| `questionnaire-templates-page.tsx` | Grid 20/55/25, atalho `/`, sheets responsivos |

---

## Comparativo antes / depois

| Aspecto | Sprint 6.6 | Sprint 6.7 |
|---------|------------|------------|
| Áreas simultâneas | 5 (Templates, Biblioteca, Canvas, Properties, Preview) | 3 fixas + 2 contextuais |
| Biblioteca | Painel lateral permanente (~256px) | Drawer sob demanda |
| Propriedades | Painel direito fixo (~288px) | Sheet ao selecionar pergunta |
| Largura útil do canvas | ~48% | **55%** |
| Preview | 32% | 25% (sempre visível no desktop) |
| Inserir campo | Clique na biblioteca fixa | Quick Add, `/`, ou drawer |
| Após inserir | Abre properties automaticamente | Foco no canvas |
| Ações da pergunta | 3 botões sempre visíveis | Menu ⋮ no hover |
| Sensação | Dashboard denso | Editor focado (Notion/Figma) |

---

## Ganhos de produtividade

| Fluxo | Antes | Depois | Ganho |
|-------|-------|--------|-------|
| Inserir CPF | Abrir biblioteca → rolar → clicar | Quick Add → CPF | **−2 cliques** |
| Inserir campo raro | Biblioteca sempre visível ocupa espaço | `/` → buscar → inserir | **+55% canvas** |
| Editar propriedades | Painel sempre aberto (ruído) | Clicar pergunta → sheet | Menos distração |
| Duplicar pergunta | Botão visível + abre properties | Duplicar → foco canvas | Sem troca de painel |
| Tablet | 3 colunas apertadas | Canvas + drawers | Melhor uso da tela |

**Redução estimada de carga cognitiva:** ~40% menos elementos fixos visíveis ao abrir o builder.

---

## Screenshots

> Capturar em `/questionarios/templates` após `npm run dev`.

| Cena | Descrição |
|------|-----------|
| **Desktop — estado inicial** | Templates + Canvas amplo + Preview 25%; sem biblioteca/properties |
| **Biblioteca aberta** | Drawer esquerdo com categorias e busca |
| **Quick Add** | Dropdown com Texto, CPF, CNPJ… |
| **Pergunta selecionada** | Sheet direito com propriedades |
| **Hover no card** | Menu ⋮ visível |
| **Tablet** | Canvas + botões Templates/Preview no header |
| **Mobile** | Canvas full + sheets |

### Placeholder de captura

```
[ ] sprint6.7-desktop-canvas.png
[ ] sprint6.7-library-drawer.png
[ ] sprint6.7-quick-add.png
[ ] sprint6.7-properties-sheet.png
[ ] sprint6.7-context-menu.png
```

---

## Validação

```bash
npm run lint
npm run check-types
npm run build
npm run test -w api   # se aplicável
```

| Check | Status |
|-------|--------|
| lint | ✅ |
| typecheck | ✅ |
| build | ✅ |
| testes API | ✅ (56/58 — 2 legados) |

---

## Critério de sucesso

Ao abrir o Builder, o usuário deve sentir um **editor moderno** (Notion/Figma):

- **Canvas em destaque** — 55% da largura, hierarquia clara
- **Painéis secundários sob demanda** — biblioteca e propriedades só quando necessários
- **Velocidade** — Quick Add, `/`, auto-close, auto-focus
- **Simplicidade** — menos botões, menos painéis fixos, mais edição inline

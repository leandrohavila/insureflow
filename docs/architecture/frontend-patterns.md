# Padrões de arquitetura — Frontend (Next.js)

> Escopo: `apps/web`. Stack: React 19, App Router, TanStack Query, componentes UI locais (`components/ui`).

## Camadas

```
app/(dashboard)/          → rotas e páginas
components/               → UI por domínio (leads, crm, questionnaires)
lib/data-access/          → API client, query keys, hooks, normalizers
lib/questionnaires/       → validação, autosave, estado de formulário
components/auth/          → sessão e permissões
app/api/                  → BFF (proxy para Nest em /api/v1)
```

O frontend **não** chama a API Nest diretamente no browser: usa rotas `app/api/*` que encaminham com cookies/tokens de sessão.

---

## Hooks e data-access

**Padrão por módulo** (`lib/data-access/modules/<entity>/`):

| Arquivo | Responsabilidade |
|---------|------------------|
| `types.ts` | Tipos de domínio + tipos “backend” |
| `api.ts` | Funções fetch para `/api/...` |
| `normalizers.ts` | `Backend*` → domínio (defaults, trim, derivados) |
| `hooks.ts` | `useQuery` / `useMutation` |
| `index.ts` | Re-export |

**Convenções de hooks:**

- Listagens: `useX(filters)` → `queryKeys.x.list(filters)`
- Detalhe: `enabled: Boolean(id)`
- Mutations: `onSuccess` atualiza cache; `onSettled` invalida listas (exceto exceções documentadas)

**Session:**

- `SessionProvider` + `useSessionQuery` (`queryKeys.session.current`)
- SSR injeta `initialSession` no `dashboard-shell`

---

## Query keys

**Arquivo canônico:** `apps/web/lib/data-access/query-keys.ts`

**Factory genérica** `entityKeys(root)`:

- `all`, `lists()`, `list(filters)`, `details()`, `detail(id)`

**Árvores customizadas:**

- `crm.deals.*` — aninhado sob `["crm", "deals", ...]`
- `questionnaires.templates.*` — inclui `fields(templateId)` e `field(templateId, fieldId)`
- `questionnaires.submissions.byLead(leadId, { templateId?, limit? })` — cache por lead

**Boas práticas:**

- Objetos `filters` estáveis (evitar recriar inline a cada render sem `useMemo`)
- Invalidação cirúrgica preferida a `invalidateQueries({ queryKey: questionnaires.all })` em autosave

---

## Autosave (questionários)

**Implementado** — `lib/questionnaires/use-questionnaire-draft-autosave.ts`

| Parâmetro | Valor |
|-----------|--------|
| Debounce | 2000 ms |
| Storage key | `insureflow:questionnaire-draft:{leadId}:{templateId}` |
| Payload API | `status: "draft"`, `mode/origin: "INTERNAL"` |
| Mutation meta | `{ autosave: true }` |

**Fluxo:**

1. Abrir dialog → carregar draft remoto (`status=draft`, `limit=1`) + localStorage
2. Alterar respostas → hash de payload → debounce → PATCH ou POST
3. Falha de rede → indicador âmbar; cópia local mantida (**não bloqueia** edição)
4. Fechar dialog → reset de estado de save

**Cache:** `submission-cache.ts` — em autosave, **não** invalida listas globais; faz patch em `byLead` e detail.

---

## Estratégia de cache

| Cenário | Estratégia |
|---------|------------|
| Listas leads/deals/customers | Optimistic update em update/delete |
| Create lead / convert | Invalidate ou set após sucesso (sem optimistic) |
| Questionnaire autosave | Patch síncrono de caches relacionados |
| Questionnaire finalize | Invalidação + atualização de detail/list/byLead |

**Helpers:** `lib/data-access/optimistic.ts` — `snapshotQuery`, `rollbackQuery`, `patchListItem`, `removeListItem`, `upsertListItem`.

**Risco conhecido:** múltiplas queries `byLead` com `templateId` diferentes exigem remoção cruzada ao mudar template (tratado em `submission-cache.ts`).

---

## Modal / Sheet / Dialog

| Padrão | Uso |
|--------|-----|
| `Dialog` | CRUD lead, preenchimento de questionário, admin de templates |
| `Sheet` | Detalhe read-only de submissão (`side=right`) |

**Orquestração (ex.: `leads-page.tsx`):**

- Estado no page: `dialogOpen`, `editingLead`, `questionnaireLead`, `selectedSubmissionId`
- `open={canManage && condition}` no pai — permissão não fica só dentro do filho
- `onOpenChange` limpa entidade selecionada ao fechar

**Formulários:**

- Questionário: `noValidate` no `<form>`; validação JS customizada
- Lead: `required` HTML em nome + guard `trim()` no submit

---

## Optimistic updates

**Implementado em:**

- `leads/hooks.ts` — `useUpdateLead`, `useDeleteLead`
- `crm/hooks.ts` — update/delete deal
- `customers/hooks.ts` — update/delete

**Não usado em:** questionários (patch pós-resposta via `applySubmissionMutationCache`).

---

## Scroll / focus na validação

**Implementado** — `questionnaire-submission-dialog.tsx`:

- `finalizeAttempted` controla exibição de erros por campo
- `focusFirstFieldError` após falha de validação client ou mapeamento server
- Barra de progresso: percentual de required preenchidos (informativo)

**Lead dialog:** sem focus programático além do comportamento nativo do browser.

---

## Arquitetura de formulários

| Domínio | Abordagem |
|---------|-----------|
| Questionário | Estado local `answers` + funções em `questionnaire-field-validation.ts` e `questionnaire-form-state.ts` |
| Lead | `useState` simples por campo |
| CRM deal | Dialog com estado local |

**Sem** react-hook-form / Zod global no fluxo comercial principal.

**Funções de validação (questionário):**

- `buildDraftAnswers` — omite vazios/inválidos (autosave)
- `validateFilledQuestionnaireAnswers` — formato apenas
- `validateQuestionnaireAnswersForFinalize` — required + formato
- `buildSubmitAnswers` — payload de finalize
- `parseQuestionnaireSubmissionErrors` — erros de API → campos

---

## Warnings vs validações bloqueantes

| Situação | Comportamento | Status |
|----------|---------------|--------|
| Autosave com campo inválido preenchido | Omitido do payload | Implementado |
| Falha autosave API | Banner âmbar, continua editando | Implementado |
| Finalizar questionário | Bloqueia botão após 1ª tentativa com erros | Implementado |
| Duplicata CPF/CNPJ em lead | — | **Planejado** (warning-first) |
| Customer documento duplicado | Erro 409 (bloqueante) | Implementado |

Não existe tipo unificado `Warning[]` na API de leads hoje.

---

## Permissões na UI

- `PermissionGate` — esconde ações (`permission` ou `anyOf`)
- `useCanManage("resource:view")` — deriva permissão `:manage` via `@repo/auth`
- `DataTable` filtra `rowActions` por permissão da sessão

**Importante:** gates são **apenas UI**; autorização real está no NestJS.

---

## Referências

- `apps/web/lib/data-access/query-keys.ts`
- `apps/web/lib/data-access/optimistic.ts`
- `apps/web/lib/questionnaires/use-questionnaire-draft-autosave.ts`
- `apps/web/components/questionnaires/questionnaire-submission-dialog.tsx`
- `apps/web/components/auth/session-provider.tsx`
- `apps/web/components/auth/permission-gate.tsx`

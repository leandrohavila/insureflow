# BUG-005 — Estado de erro persistente no LeadDialog

**Data:** 2026-07-22  
**Status:** Corrigido  
**Área:** `apps/web/components/leads/leads-page.tsx`, React Query mutations

---

## Sintoma

Ao abrir **Novo Lead** ou **Editar Lead**, a mensagem **"Erro ao salvar lead"** aparecia imediatamente, sem POST/PATCH ter sido executado na sessão atual.

---

## Causa raiz

### Mutations React Query mantêm `error` entre aberturas

`useCreateLead()` e `useUpdateLead()` são instanciados no nível da página (`LeadsPage`) e **persistem** o estado da mutation (`error`, `isError`, `isSuccess`) até que `.reset()` seja chamado explicitamente.

O `LeadDialog` recebia:

```tsx
error={createLead.error ?? updateLead.error}
```

e renderizava o banner quando `error` era truthy:

```tsx
{error ? (
  <p>Erro ao salvar lead</p>
) : null}
```

**Fluxo que causava o bug:**

1. Usuário submete formulário → mutation falha → `createLead.error` / `updateLead.error` permanece setado.
2. Usuário fecha o modal → apenas `setDialogOpen(false)` e `setEditingLead(null)`.
3. Usuário reabre o modal → mutations **não foram resetadas** → `error` ainda truthy → mensagem aparece antes de qualquer interação.

### Banner da página com o mesmo problema

O banner global também exibia `createLead.error ?? updateLead.error` mesmo com o dialog aberto, duplicando feedback de erro.

### O que **não** era a causa

- **Estado local do formulário:** o `LeadDialog` já resetava `form` via `useEffect` quando `open === true`. O problema era exclusivamente o estado da mutation React Query propagado como prop `error`.
- **`LeadSheetV2`:** não mantém estado de erro de save; delegava edição ao `LeadDialog` via `onEdit`.

---

## Auditoria dos pontos solicitados

| Ponto | Resultado |
|-------|-----------|
| `createLead.isError` | Permanece `true` após falha até `.reset()` |
| `updateLead.isError` | Idem |
| `createLead.error` | Propagado ao dialog sem limpeza na abertura |
| `updateLead.error` | Idem |
| `createLead.reset()` | **Não era chamado** ao abrir/fechar modal |
| `updateLead.reset()` | **Não era chamado** ao abrir/fechar modal |
| `setError()` (form) | Não utilizado — formulário usa `useState` local |
| `reset(form)` / `resetField()` | N/A (não usa react-hook-form) |
| Abertura do modal | Form resetado; mutations **não** |
| Fechamento | Estado local limpo; mutations **não** |
| Troca de registro | `editingLead` atualizado; mutations **não** |

---

## Correção implementada

### 1. Utilitário `resetLeadSaveMutations`

`apps/web/lib/data-access/modules/leads/lead-dialog-mutations.ts` — chama `createLead.reset()` e `updateLead.reset()`.

### 2. `openLeadDialog(lead)` centralizado

Todo fluxo de abertura passa por:

```ts
resetLeadSaveMutations(createLead, updateLead)
setEditingLead(lead)
setDialogOpen(true)
```

### 3. Reset na abertura e na troca de sessão

`useEffect` observa `dialogOpen` + `getLeadDialogSessionKey(editingLead)` (`__new__` vs `lead.id`) e reseta mutations ao alternar entre novo/editar.

### 4. Reset no fechamento

- `LeadDialog.onOpenChange(false)`
- `LeadSheetV2.onOpenChange(false)`
- `onEdit` do sheet (transição sheet → dialog)

### 5. Formulário do dialog

- `buildLeadDialogFormState()` / `EMPTY_LEAD_DIALOG_FORM` extraídos para módulo testável.
- Ao fechar (`open === false`): form volta para `EMPTY_LEAD_DIALOG_FORM`.
- Ao abrir: form hidratado a partir do lead ou defaults.

### 6. Banner da página

`shouldShowPageLeadSaveError()` — erro de create/update só aparece na página quando o dialog **está fechado**.

---

## Garantia do fluxo esperado

```
Abrir modal → nenhuma mensagem vermelha
Salvar → se erro → mensagem aparece
Fechar → reset completo (mutations + form)
Reabrir → erro desaparece
```

---

## Testes adicionados

- `lead-dialog-form.spec.ts` — sessão novo/editar, visibilidade de erro, ciclo abrir/falhar/fechar/reabrir, troca editar→novo.
- `lead-dialog-mutations.spec.ts` — `resetLeadSaveMutations` chama `.reset()` em ambas mutations.

Executar:

```bash
npx vitest run apps/web/lib/data-access/modules/leads/lead-dialog-form.spec.ts apps/web/lib/data-access/modules/leads/lead-dialog-mutations.spec.ts
```

---

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `apps/web/components/leads/leads-page.tsx` | Reset mutations + form lifecycle |
| `apps/web/lib/data-access/modules/leads/lead-dialog-form.ts` | Helpers de form e visibilidade de erro |
| `apps/web/lib/data-access/modules/leads/lead-dialog-mutations.ts` | Reset centralizado |
| `apps/web/lib/data-access/modules/leads/index.ts` | Exports |
| `*.spec.ts` | Testes de contrato |

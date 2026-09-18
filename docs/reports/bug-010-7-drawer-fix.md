# BUG-010.7 — Correção do ciclo de vida do Drawer

**Data:** 2026-07-24  
**Status:** Corrigido e validado  
**Escopo:** fluxo React do Drawer/Dialog de criação de Lead

## Correção aplicada

Arquivos alterados:

- `apps/web/components/leads/leads-page.tsx`
- `apps/web/lib/data-access/modules/leads/hooks.ts`
- `apps/web/lib/performance/bug010-drawer-flow.ts`

Mudanças principais:

- Removido o efeito que executava `resetLeadSaveMutationsState(dialog-open-effect)` enquanto `dialogOpen=true`.
- `LeadDialog.handleSubmit` passou a aguardar `onSubmit(...)` e limpar `submitLocked` em `finally`.
- Criação de Lead passou a fechar o Drawer depois que `mutateAsync` resolve com sucesso.
- `createSubmitLockRef` é liberado no `finally` do fluxo de criação.
- `DialogContent` do `LeadDialog` agora só é renderizado quando `open=true`, evitando popup visível mesmo após `dialogOpen=false`.
- `resetLeadSaveMutationsState()` permanece restrito a abertura, fechamento explícito e unmount.
- `invalidateQueries` continua em background no `useCreateLead.onSuccess`.

## Validação

Fluxo executado:

```text
Novo Lead
Salvar
```

Lead usado:

```text
BUG 0107 Drawer Fix Final 1131
```

Resultado da timeline:

| Tempo | Evento | dialogOpen | submitLocked | mutation.status |
|---:|---|---|---|---|
| 0ms | `submit()` | true | false | |
| 527.3ms | `mutationFn() resolve` | true | true | pending |
| 528.2ms | `onSuccess hook` | true | true | pending |
| 542.9ms | `mutateAsync resolve` | true | true | idle |
| 549.3ms | `after setDialogOpen(false)` | false | true | idle |
| 560.9ms | `after setSubmitLocked(false)` | false | false | idle |
| 983.2ms | `after invalidateQueries` | false | false | success |

## Checklist

- Drawer fecha imediatamente: **sim** (`dialogCount=0` após submit).
- `submitLocked=false`: **sim**.
- Botão volta ao normal: **sim**; não há `Salvando...` após o fechamento.
- Apenas um Lead criado: **sim**; 1 ocorrência na linha da tabela, 2 no body incluindo o toast.
- Lista atualiza corretamente: **sim**; contador passou para `29 registros na captação`.
- `invalidateQueries` em background: **sim**; concluiu após o fechamento (`983.2ms`).
- Loop `dialog-open-effect`: **eliminado**; nenhum evento `resetLeadSaveMutationsState(dialog-open-effect)` apareceu na validação final.

## Conclusão

O fluxo agora finaliza corretamente: `mutateAsync` resolve, `dialogOpen` vira `false`, `submitLocked` volta para `false`, o conteúdo visual do Drawer é desmontado e a invalidação da lista termina em background.

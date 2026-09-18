# BUG-010.4 — Drawer preso em loading

**Data:** 2026-07-24  
**Status:** Auditado, sem correção aplicada  
**Escopo:** criação de Lead em `LeadsPage` / `LeadDialog`

## Arquivos auditados

- `apps/web/components/leads/leads-page.tsx`
- `apps/web/lib/data-access/modules/leads/hooks.ts`
- `apps/web/lib/data-access/modules/leads/api.ts`
- `apps/web/lib/data-access/api-client.ts`

Observação: no código atual não existe um componente exportado como `CreateLeadDialog`; o fluxo equivalente é o `LeadDialog` interno de `leads-page.tsx`, usado para criação e edição.

## Fluxo atual

O `LeadDialog` mantém o botão em `Salvando...` quando:

```text
pending || submitLocked
```

Onde:

- `pending` vem de `createLead.isPending || updateLead.isPending`.
- `submitLocked` é setado para `true` no submit e só volta para `false` quando:
  - o modal fecha (`open=false`);
  - ou `error` é definido.

## Ordem do submit

```text
LeadDialog.handleSubmit()
setSubmitLocked(true)
onSubmit(input)
createLead.mutate(...)
```

No `onSuccess` passado ao `createLead.mutate`:

```text
createLead mutation callback
closeModal() -> setDialogOpen(false)
toast.success() -> setLeadCreateToast(...)
```

Ou seja: se esse callback roda, o modal fecha imediatamente.

## Busca por awaits antes do fechamento

No fluxo de criação de Lead, não há:

```text
await queryClient.invalidateQueries(...)
await refetch()
await Promise.all(...)
```

antes de:

```text
setDialogOpen(false)
setLeadCreateToast(...)
```

O hook `useCreateLead.onSuccess` faz:

```text
void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
```

Esse `void` coloca a invalidação em background. A promise não é retornada pelo `onSuccess`, então ela não deveria manter `createLead.isPending` ativo.

## Ponto que mantém o loading

O único await real antes de `mutation.onSuccess` está dentro da mutation function:

```text
useCreateLead()
mutationFn: createLead

createLead()
await apiClient.post(...)

apiClient.request()
await fetch(...)
await parseResponseBody(response)
```

Para POST `/api/leads`, `parseResponseBody` usa:

```text
response.json()
```

Portanto, se a aba Network mostra a resposta HTTP recebida, mas o drawer continua em `Salvando...`, o gargalo provável está entre:

```text
Response recebida pelo browser
response.json() resolvido pelo JavaScript
mutationFn retornando
mutation.onSuccess executando
```

Não é `invalidateQueries`, porque ela só começa depois de `mutation.onSuccess`.

## Evidência dos traces BUG-010

Nos traces anteriores:

```text
POST concluído
mutation.onSuccess
invalidateQueries start
```

A ordem confirma:

```text
invalidateQueries só acontece depois de mutation.onSuccess
```

Logo, a invalidação não é a causa do drawer ficar preso antes de fechar.

## Hipótese principal

O drawer fica em `Salvando...` porque a mutation ainda está pendente, mesmo com o HTTP já visível como concluído na Network.

O await responsável é:

```text
await apiClient.post(...)
  -> await parseResponseBody(response)
  -> await response.json()
```

ou algum bloqueio de main thread/event loop antes do callback `mutation.onSuccess`.

## Pontos descartados

- `mutation.onSuccess`: fecha imediatamente quando executa.
- `mutation.onSettled`: não existe no `useCreateLead`.
- `finally`: não existe no fluxo de criação.
- `invalidateQueries`: executa em background com `void`.
- `refetch`: não é chamado antes do fechamento.
- `Promise.all`: não aparece no fluxo de criação de Lead.
- `toast.success`: no código atual é `setLeadCreateToast(...)` e vem depois de `setDialogOpen(false)`.

## Próximo passo recomendado

Instrumentar especificamente:

```text
apiClient.post start
fetch resolved
response.json start
response.json end
mutationFn return
mutation.onSuccess enter
setDialogOpen(false)
```

Não aplicar otimização ainda. O objetivo da próxima medição é confirmar se o atraso está em `response.json()` ou em bloqueio de main thread antes do React Query disparar `onSuccess`.

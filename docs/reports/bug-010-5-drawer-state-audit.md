# BUG-010.5 — Drawer permanece em "Salvando..."

**Data:** 2026-07-24  
**Status:** Auditoria React instrumentada, sem correção aplicada  
**Escopo:** somente fluxo React do drawer/modal de criação de Lead

## Arquivos auditados

- `apps/web/components/leads/leads-page.tsx`
- `apps/web/lib/data-access/modules/leads/hooks.ts`
- `apps/web/lib/data-access/modules/leads/lead-dialog-mutations.ts`

No código atual não há um componente exportado como `CreateLeadDialog`. O fluxo equivalente é o `LeadDialog` interno de `leads-page.tsx`, controlado pelo componente pai `LeadsPage`.

## Instrumentação adicionada

Foram adicionados logs `console.log("[DRAWER] ...")` nos pontos solicitados:

- `1-submit`: início do submit no `LeadDialog.handleSubmit`.
- `2-before-mutate`: imediatamente antes de `createLead.mutate(...)`.
- `3-after-mutate`: no `onSettled` local do `mutate(...)`.
- `4-onSuccess`: entrada no `useCreateLead.onSuccess`.
- `5-before-close`: imediatamente antes de `setDialogOpen(false)`.
- `6-after-close`: imediatamente após `setDialogOpen(false)`.
- `7-before-loading-false`: antes de limpar locks/loading locais.
- `8-after-loading-false`: após limpar locks/loading locais.
- `9-before-invalidate`: antes de `queryClient.invalidateQueries(...)`.
- `10-after-invalidate`: após a promise de `invalidateQueries(...)` resolver.

Também foram adicionados watchers:

```text
[DRAWER] dialogOpen =
[DRAWER] mutation.isPending =
[DRAWER] isSubmitting =
```

Observação importante: o código atual usa `createLead.mutate(...)`, não `mutateAsync()`. Para não alterar comportamento nesta etapa, não houve conversão para `mutateAsync`. O ponto `3-after-mutate` foi colocado no `onSettled` local da mutation, que é o equivalente observável sem reescrever o fluxo.

## Quem controla o `open`

O `open` passado ao `LeadDialog` não é uma fonte única simples. Ele é calculado no pai:

```text
canManageLeads &&
dialogOpen &&
(!isLeadSheetV2 || forceLegacyForm || editingLead === null)
```

Fontes envolvidas:

- `dialogOpen`: estado principal do pai.
- `canManageLeads`: permissão.
- `isLeadSheetV2`: feature flag via querystring `?sheet=v2`.
- `forceLegacyForm`: força o formulário legado ao editar.
- `editingLead`: diferencia criação (`null`) de edição.

Para criação, `editingLead === null`, então o `open` efetivo depende principalmente de:

```text
canManageLeads && dialogOpen
```

## Estados que mantêm "Salvando..."

No `LeadDialog`, o estado visual de submit é:

```text
submitPending = pending || submitLocked
```

Onde:

- `pending` vem do pai: `createLead.isPending || updateLead.isPending`.
- `submitLocked` é estado local do `LeadDialog`.

No submit:

```text
setSubmitLocked(true)
onSubmit(...)
```

O `submitLocked` só é limpo quando:

- `open` muda, pelo `useEffect([lead, open, session?.name])`;
- `error` muda para truthy;
- o pai fecha via `onOpenChange(false)`.

Se o callback que chama `setDialogOpen(false)` não executar, o drawer pode continuar aberto com:

```text
mutation.isPending = false
isSubmitting = true
```

porque `submitLocked` permanece `true`.

## Instrução suspeita

A instrução que provavelmente impede o fechamento não é `invalidateQueries`.

O ponto crítico está no pai:

```text
useEffect(() => {
  if (!dialogOpen) return
  resetLeadSaveMutationsState()
}, [dialogOpen, leadDialogSessionKey, resetLeadSaveMutationsState])
```

Esse helper faz:

```text
createLead.reset()
updateLead.reset()
```

Como `resetLeadSaveMutationsState` depende de `createLead` e `updateLead`, se a identidade desses objetos/callbacks mudar durante o ciclo de render com `dialogOpen = true`, o efeito pode rodar enquanto a mutation de criação ainda está em andamento.

Efeito provável:

```text
1. LeadDialog seta submitLocked = true.
2. Pai chama createLead.mutate(...).
3. Enquanto dialogOpen ainda é true, o useEffect chama createLead.reset().
4. O POST ainda conclui e o hook useCreateLead.onSuccess dispara.
5. invalidateQueries dispara os GETs.
6. O callback local do mutate, onde está setDialogOpen(false), pode não executar.
7. Como setDialogOpen(false) não executa, open continua true.
8. Como open continua true e não há error, submitLocked continua true.
9. O drawer permanece em "Salvando...".
```

Isso bate com o problema comprovado:

- POST retorna sucesso.
- Lead é criado.
- JSON chega.
- GETs são disparados.
- Drawer não fecha.

Os GETs podem ser explicados pelo `useCreateLead.onSuccess`, que roda antes do `invalidateQueries`. O fechamento, porém, está no callback local passado ao `createLead.mutate(...)` dentro do componente pai.

## Respostas objetivas

### 1. `setDialogOpen(false)` foi chamado?

Pela leitura estática, ele só é chamado na criação se o `onSuccess` local passado ao `createLead.mutate(...)` executar.

Com o sintoma descrito, a expectativa dos logs é:

```text
[DRAWER] 4-onSuccess
[DRAWER] 9-before-invalidate
[DRAWER] 10-after-invalidate
```

mas ausência de:

```text
[DRAWER] 5-before-close
[DRAWER] 6-after-close
```

Portanto, a hipótese objetiva é: **não, `setDialogOpen(false)` não está sendo alcançado no callback local de criação**.

### 2. `mutation.isPending` voltou para `false`?

Provavelmente sim, ou foi resetado para estado não-pending por `createLead.reset()`.

Mesmo assim, o drawer pode continuar em `Salvando...` porque o loading visual também depende de `submitLocked`, que é local ao `LeadDialog`:

```text
submitPending = pending || submitLocked
```

Se `submitLocked` continuar `true`, `isSubmitting` continua `true` mesmo com `mutation.isPending = false`.

### 3. Quem controla o estado `open` do Drawer?

O pai `LeadsPage`, via `dialogOpen`, combinado com:

```text
canManageLeads
isLeadSheetV2
forceLegacyForm
editingLead
```

O `LeadDialog` não controla `open`; ele recebe `open` por prop e chama `onOpenChange`.

### 4. Qual instrução impede o fechamento do Drawer?

A instrução suspeita é:

```text
resetLeadSaveMutationsState()
```

executada por este efeito enquanto `dialogOpen` está aberto:

```text
useEffect(() => {
  if (!dialogOpen) return
  resetLeadSaveMutationsState()
}, [dialogOpen, leadDialogSessionKey, resetLeadSaveMutationsState])
```

Ela chama:

```text
createLead.reset()
```

e pode quebrar o ciclo local do `mutate(...)` onde está o fechamento.

### 5. Qual é a causa raiz do problema?

A causa raiz provável é a combinação de duas fontes de estado:

```text
React Query mutation state
LeadDialog submitLocked local
```

com um reset automático da mutation enquanto o drawer ainda está aberto.

O reset pode fazer a mutation deixar de entregar o callback local que chama `setDialogOpen(false)`, enquanto o `submitLocked` local permanece `true`. Assim, mesmo após sucesso real do POST e após disparar os GETs via `invalidateQueries`, o estado visual do drawer nunca finaliza.

## Como validar pelos logs

Sequência que confirmaria a causa raiz:

```text
[DRAWER] 1-submit
[DRAWER] isSubmitting = true
[DRAWER] 2-before-mutate
[DRAWER] mutation.isPending = true
[DRAWER] 4-onSuccess
[DRAWER] 9-before-invalidate
[DRAWER] 10-after-invalidate
[DRAWER] mutation.isPending = false
```

com ausência de:

```text
[DRAWER] 5-before-close
[DRAWER] 6-after-close
[DRAWER] dialogOpen = false
[DRAWER] isSubmitting = false
```

Essa sequência indicaria que o sucesso global da mutation ocorreu, mas o callback local responsável por fechar o drawer não foi executado.

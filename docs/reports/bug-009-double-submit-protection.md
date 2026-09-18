# BUG-009 — Double Submit Protection

**Data:** 2026-07-23  
**Status:** Corrigido  
**Escopo:** Criação de Lead via `LeadsPage` / `POST /api/leads`

## Problema

Cliques repetidos no botão **Salvar lead** durante a criação disparavam múltiplas mutations antes de `isPending` bloquear a UI, permitindo múltiplos POSTs e registros duplicados.

## Correção frontend

- O `LeadDialog` agora aplica um lock local síncrono no primeiro submit válido.
- O botão **Salvar lead** troca imediatamente para estado de loading com spinner e fica desabilitado.
- Submits repetidos por clique ou Enter são ignorados enquanto `pending` ou o lock local estiver ativo.
- A página mantém um lock adicional em `LeadsPage` antes de chamar `createLead.mutate`.
- A criação envia um header `Idempotency-Key` por operação de criação.
- Em sucesso, o modal fecha apenas após a mutation concluir e exibe toast de sucesso.
- Em erro, o lock é liberado e a chave é descartada para permitir nova tentativa.

## Correção backend

- O BFF `apps/web/app/api/leads/route.ts` encaminha `Idempotency-Key` para a API Nest.
- O controller de Leads lê o header e o passa para `LeadsService.createLead`.
- `LeadsService` deduplica criações simultâneas por:
  - chave explícita `Idempotency-Key`, com cache curto de 60 segundos para retries da mesma operação;
  - fingerprint do payload enquanto a criação estiver pendente, cobrindo clientes que não enviem header.
- A deduplicação não cria uma regra permanente de unicidade para Leads, preservando o fluxo existente de "Continuar mesmo assim" para documentos duplicados.

## Validação Executada

- `npm test -w apps/api -- leads.service.spec.ts --runInBand`
  - 5 testes passaram.
  - Inclui cobertura para duas criações simultâneas com a mesma chave de idempotência.
  - Inclui cobertura para duas criações simultâneas com o mesmo payload sem header.
- `npm run check-types -w apps/web`
  - Passou.

## Observação

`npm run check-types -w apps/api` não completou por erro já existente em `apps/api/test/leads-create.e2e-spec.ts`: parâmetros `req`, `_res` e `next` com `implicit any`. Esse arquivo não fez parte da correção do BUG-009.

## Critérios do BUG-009

- Clicar rapidamente em **Salvar lead** não deve disparar múltiplos POSTs pelo frontend.
- O botão permanece bloqueado com loading até o término da operação.
- Enter repetido é ignorado enquanto o submit está bloqueado.
- Em sucesso, apenas um Lead é criado e o modal fecha após a resposta.
- Em erro, o usuário pode tentar novamente.
- Requisições simultâneas equivalentes no backend retornam a mesma criação em vez de inserir duplicados.

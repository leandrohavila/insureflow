# BUG-003 — GET /questionnaires/submissions 400 Bad Request

**Data:** 2026-07-22  
**Escopo:** Leads (`LeadQuestionnaireBadge`) e conversão de lead  
**Endpoint:** `GET /api/v1/questionnaires/submissions?leadId=<id>&page=1&limit=5`

---

## Resumo executivo

O 400 vinha do **ValidationPipe global** (`whitelist + forbidNonWhitelisted + @IsInt`) ao validar `ListQuestionnaireSubmissionsQueryDto`. O hook de Leads envia **`page` e `limit` como strings** na query string; o DTO de submissions validava com `@IsInt()` **sem** `@Type(() => Number)`, diferente de todos os outros list endpoints do projeto (leads, deals, customers, quotes).

---

## Causa raiz

| Item | Detalhe |
|------|---------|
| **Campo inválido** | `page` e `limit` (quando presentes na query) |
| **Regra que rejeita** | `@IsInt()` em propriedades ainda tipadas como `string` após o parse da query |
| **Mensagem típica** | `page must be an integer number`, `limit must be an integer number` |
| **Frontend envia errado?** | **Não** — `leadSubmissionListFilters()` monta `{ leadId, page: 1, limit: 5 }` corretamente; `toSubmissionQueryString()` serializa como `?leadId=…&page=1&limit=5` (comportamento HTTP normal: números viram strings) |
| **Backend mudou na Sprint 7?** | **Não** — DTO e ValidationPipe vêm desde `82827b1` (Sprint 6). Sprint 7 alterou engine de validação de **respostas** (POST/PATCH), não o contrato do GET de listagem |

### Por que só aparece com `leadId`?

- `GET ?leadId=<id>` **sozinho** passa (defaults `page=1`, `limit=10`).
- O fluxo de Leads **sempre** inclui paginação via `leadSubmissionListFilters()` → dispara a validação de inteiros em strings.

### Sobre "Erro ao processar lead"

Essa mensagem vem de **`createLead` / `updateLead` / `convertLead`** em `leads-page.tsx`, não do hook de submissions. O 400 de submissions afeta o badge de questionário (estado `Pendente` / loading), em paralelo à conversão.

### Outras rejeições possíveis (testadas, não são o fluxo principal de Leads)

| Cenário | Regra | Mensagem |
|---------|-------|----------|
| `enabled=true` (param desconhecido) | `forbidNonWhitelisted` | `property enabled should not exist` |
| `status=all` ou `status=qualified` | `@IsIn(QUESTIONNAIRE_SUBMISSION_STATUSES)` | `status must be one of the following values: …` |
| `limit=0` | `@Min(1)` | `limit must not be less than 1` |

O BFF agora **filtra** query params para a whitelist do DTO, evitando 400 por parâmetros acidentais (`mine`, `search`, `sheet`, etc.).

---

## Investigação (checklist)

1. **DTO** — `ListQuestionnaireSubmissionsQueryDto` em `questionnaire.dto.ts`
2. **ValidationPipe** — `apps/api/src/main.ts` (global, `forbidNonWhitelisted: true`)
3. **Controller** — `QuestionnairesController.findSubmissions`
4. **Service** — `findSubmissions` não lança 400; falha ocorre antes no pipe
5. **BFF** — `apps/web/app/api/questionnaires/submissions/route.ts`
6. **Hook** — `useLeadQuestionnaireSubmissions` → `leadSubmissionListFilters` → `fetchQuestionnaireSubmissions`

---

## Correção aplicada

1. **`@Type(() => Number)`** em `page`/`limit` de `ListQuestionnaireSubmissionsQueryDto` e `ListQuestionnaireTemplatesQueryDto` (alinhado ao padrão de `lead.dto.ts`, `deal.dto.ts`, etc.)
2. **BFF:** sanitização de query params + repasse de `request` para `backendFetch` (auth)
3. **Hook:** fallback `{ page: 1, limit: 0 }` → `{ page: 1, limit: 1 }` quando `leadId` é nulo
4. **Testes:** `questionnaire-submissions-query.dto.spec.ts` cobre shape do badge e coerção sem `enableImplicitConversion`

---

## Logs temporários (diagnóstico)

Ativar com `BUG003_DEBUG=true` (API/BFF) e `NEXT_PUBLIC_BUG003_DEBUG=true` (browser):

| Camada | O que loga |
|--------|------------|
| Web `api.ts` | `filters` + path montado |
| BFF `route.ts` | `rawSearch`, `forwardedSearch`, params descartados, body do 400 |
| API `main.ts` | árvore completa de `ValidationError` |
| API `QuestionnairesController` | `request.query` bruto + DTO validado |

Remover ou desativar após validação em staging.

---

## Arquivos alterados

- `apps/api/src/modules/questionnaires/dto/questionnaire.dto.ts`
- `apps/api/src/modules/questionnaires/dto/questionnaire-submissions-query.dto.spec.ts`
- `apps/api/src/modules/questionnaires/questionnaires.controller.ts`
- `apps/api/src/main.ts`
- `apps/web/app/api/questionnaires/submissions/route.ts`
- `apps/web/lib/data-access/modules/questionnaires/api.ts`
- `apps/web/lib/data-access/modules/questionnaires/hooks.ts`

---

## Validação pós-correção

```bash
cd apps/api
npm run build
npx jest src/modules/questionnaires/dto/questionnaire-submissions-query.dto.spec.ts
```

**Resultado:** 6/6 testes passando, incluindo:

- `{ leadId, page: '1', limit: '5' }` → aceito
- Coerção com ValidationPipe **sem** `enableImplicitConversion` → aceito (prova do fix `@Type`)
- Params desconhecidos / enums inválidos → ainda rejeitados conforme esperado

**Validação manual recomendada:**

1. Abrir `/leads` — coluna Questionário carrega sem 400 no Network
2. Converter lead — `GET /api/questionnaires/submissions?leadId=…` retorna 200
3. Confirmar que `"Erro ao processar lead"` só aparece se a mutação de conversão falhar de fato

# Sprint — Camada comercial (maio/2026)

> Resumo técnico baseado no estado do repositório (working tree e módulos ativos). Não substitui changelog git.

## Objetivo da sprint

Evoluir CRM operacional (leads, questionários, permissões, sessão) sem refactor amplo, preservando fluxo do corretor.

---

## Entregas implementadas / em consolidação

### Questionários

- Módulo Nest `questionnaires` (templates, fields, submissions).
- BFF Next: `app/api/questionnaires/**`.
- Data-access: hooks, normalizers, `submission-cache.ts`, `lead-submission-status.ts`.
- Dialog de preenchimento com autosave 2s + localStorage.
- Validação finalize vs draft (`questionnaire-field-validation.ts`).
- Integração na página de leads: badge, dialog, detail sheet.

### Leads

- CRUD API + proxy web.
- Conversão transacional com propagação `dealId` em submissões.
- Optimistic update em update/delete.
- UI: tabela, dialogs, ação converter, questionário inline.

### CRM

- Deals API + kanban/lista.
- Permission gates em ações de gestão.
- Normalização owner/initials para cards.

### Auth / sessão

- `SessionProvider` com SSR initial data.
- `PermissionGate`, `useCanManage`.
- Ajuste `PermissionsGuard`: `:manage` satisfaz `:view`.

### Infraestrutura (sem mudança de stack)

- Prisma schema: enums de questionário, FKs lead/deal/customer em submissions.
- BullMQ audit queue mantida.
- Docker compose postgres/redis/api inalterado em conceito.

---

## Bugs / problemas tratados (relatados no desenvolvimento)

| Tema | Sintoma | Direção de correção |
|------|---------|---------------------|
| Cache contamination | Lista de leads/submissions desatualizada após autosave | `autosave: true` + patch `byLead` em `submission-cache.ts` |
| Validação agressiva no draft | Required bloqueando autosave | Required só em `submitted`/`reviewed` no server; `buildDraftAnswers` no client |
| Finalize UX | Erros antes de tentar finalizar | Flag `finalizeAttempted` + `canFinalize` |
| Permissões convert | 403 ao converter | Exigir AND `leads:manage` + `crm:manage`; alinhar seed/UI |
| Prisma client path | Hoisted workspaces | `output` em `node_modules/.prisma/client` no schema |

> Detalhes exatos de commits: ver `git log` quando disponível no ambiente local.

---

## Prisma

- Novos models/enums: `QuestionnaireTemplate`, `QuestionnaireField`, `QuestionnaireSubmission`.
- Relações opcionais `leadId`, `dealId`, `customerId` em submissions.
- Lead `dealId` unique para relação 1:1 pós-conversão.
- Migrations devem ser aplicadas antes de subir API (`prisma migrate deploy`).

**Atenção:** regenerar client após pull (`pnpm`/`npm` script do pacote database).

---

## Autosave

- Debounce: 2000 ms.
- Storage: `insureflow:questionnaire-draft:{leadId}:{templateId}`.
- Meta mutation evita invalidação global de listas.
- Falha API: UI âmbar, edição continua.

---

## Validação amigável

- Draft: omissão silenciosa de inválidos.
- Finalize: bloqueio após primeira tentativa + focus no campo.
- Server: espelha required em submit; mensagens 400 parseadas para campos.

---

## Gaps remanescentes pós-sprint

- Deduplicação lead (ADR-005) não iniciada.
- Timeline comercial inexistente.
- Merge de leads inexistente.
- Documento no lead inexistente.
- Gestão `reviewed` de questionário sem UI.

---

## Próximos passos sugeridos

1. Fechar Fase 1 roadmap (document + warnings API).
2. Resolver TD-05 (permissões `sales` vs questionários).
3. Guard em delete lead (TD-01).
4. Documentar em PR checklist link para `docs/domain/lead-lifecycle.md`.

---

## Referência rápida de arquivos tocados

- `apps/api/src/modules/questionnaires/`
- `apps/api/src/modules/leads/leads.service.ts`
- `apps/web/components/leads/leads-page.tsx`
- `apps/web/lib/questionnaires/`
- `apps/web/lib/data-access/modules/questionnaires/`
- `packages/database/prisma/schema.prisma`

# InsureFlow – Sprint 6.1.5
## Estabilização Final da Arquitetura do CRM

**Data:** 2026-07-08  
**Referências:** [`docs/audits/crm-sprint6-audit.md`](../audits/crm-sprint6-audit.md), [`docs/reports/sprint6-phase1.md`](./sprint6-phase1.md)

---

## Resumo

Sprint de estabilização concluída: ownership direto em negócios (`Deal.ownerUserId`), correção de filtros, endpoint de detalhe de deal, API de LeadShare e cobertura de testes ampliada. **O CRM está pronto para iniciar a Sprint 6.2 (Central de Cotações).**

---

## Migrations executadas

| Migration | Descrição |
|-----------|-----------|
| `20260708153000_deal_owner_user_id` | Adiciona `owner_user_id` em `deals`, índice composto, FK → `users`, **backfill SQL** a partir de `leads.owner_user_id` via `leads.dealId` |

**Comando executado:** `npm run db:migrate` — banco sincronizado com sucesso.

### SQL de backfill (incluso na migration)

```sql
UPDATE "deals" AS d
SET "owner_user_id" = l."owner_user_id"
FROM "leads" AS l
WHERE l."dealId" = d."id"
  AND l."owner_user_id" IS NOT NULL
  AND d."owner_user_id" IS NULL;
```

---

## Arquivos alterados

### Schema e migration

| Arquivo | Alteração |
|---------|-----------|
| `packages/database/prisma/schema.prisma` | `Deal.ownerUserId`, relação `DealOwner`, índice, `User.ownedDeals` |
| `packages/database/prisma/migrations/20260708153000_deal_owner_user_id/migration.sql` | **Nova** |

### Backend – CRM / Ownership

| Arquivo | Alteração |
|---------|-----------|
| `apps/api/src/modules/crm/crm.service.ts` | `findDeal`, enrichment compartilhado, `ownerUserId` em create/convert path, scoping |
| `apps/api/src/modules/crm/crm.controller.ts` | `GET /crm/deals/:id`, actor em `createDeal` |
| `apps/api/src/modules/access/ownership.service.ts` | `buildDealAccessWhere` usa `deal.ownerUserId`, `assertCanAccessDeal` |
| `apps/api/src/modules/leads/leads.service.ts` | `ownerUserId` na conversão lead→deal |

### Backend – Customers (A4)

| Arquivo | Alteração |
|---------|-----------|
| `apps/api/src/modules/customers/customers.service.ts` | Filtro `status` em `buildCustomerWhere` |

### Backend – LeadShare API

| Arquivo | Alteração |
|---------|-----------|
| `apps/api/src/modules/leads/lead-shares.service.ts` | **Novo** – CRUD de compartilhamentos |
| `apps/api/src/modules/leads/dto/lead-share.dto.ts` | **Novo** – DTOs create/update |
| `apps/api/src/modules/leads/leads.controller.ts` | Rotas nested `/leads/:leadId/shares` |
| `apps/api/src/modules/leads/leads.module.ts` | Registro `LeadSharesService` |

### Backend – Testes

| Arquivo | Alteração |
|---------|-----------|
| `apps/api/src/modules/access/ownership-scope.spec.ts` | Scoping `own` com `deal.ownerUserId` |
| `apps/api/src/modules/customers/customers.service.spec.ts` | **Novo** – filtro status |
| `apps/api/src/modules/leads/lead-shares.service.spec.ts` | **Novo** – create/revoke/duplicata |
| `apps/api/src/modules/leads/leads-permissions.spec.ts` | **Novo** – metadata RBAC |

### Frontend – BFF

| Arquivo | Alteração |
|---------|-----------|
| `apps/web/app/api/crm/deals/[id]/route.ts` | `GET` proxy para detalhe do deal |

### Documentação

| Arquivo | Alteração |
|---------|-----------|
| `docs/reports/sprint6-phase1-5.md` | Este relatório |

---

## Endpoints implementados

### GET /crm/deals/:id

- **Permissão:** `crm:view`
- **Resposta:** mesmo shape enriquecido da listagem (`commercialContext`, `ownerUser`, `convertedLead`, etc.)
- **Scoping:** respeita `OWNERSHIP_ENFORCEMENT` via `assertCanAccessDeal`

### LeadShare API

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/leads/:leadId/shares` | `leads:view` | Lista compartilhamentos ativos |
| POST | `/leads/:leadId/shares` | `leads:share` | Cria compartilhamento |
| PATCH | `/leads/:leadId/shares/:shareId` | `leads:share` | Atualiza permission/expiração/revoga |
| DELETE | `/leads/:leadId/shares/:shareId` | `leads:share` | Revoga compartilhamento |

---

## Decisões arquiteturais

1. **`Deal.ownerUserId`** é coluna canônica de ownership; backfill automático na migration; novos deals recebem owner do actor (create) ou do lead (convert).
2. **`buildDealAccessWhere('own')`** prioriza `deal.ownerUserId` com fallback via `convertedLead.ownerUserId` para registros legados.
3. **`assignedTo`** mantido nos DTOs/respostas — compatibilidade retroativa preservada.
4. **LeadShare** implementado como sub-recurso de leads (modelo Prisma existente), sem alteração de schema.
5. **GET deal detail** reutiliza `enrichDealsWithCommercialContext` — zero duplicação de lógica comercial.

---

## Cobertura de testes

### Validação executada

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | ✅ Passou |
| `npm run check-types` | ✅ Passou |
| `npm test` (api) | ⚠️ **56/58 passaram** (2 falhas pré-existentes) |
| `npm run build` | ✅ Passou |
| `npm run db:migrate` | ✅ Migration aplicada |

### Testes novos/atualizados (Sprint 6.1.5)

| Suite | Casos | Foco |
|-------|-------|------|
| `ownership-scope.spec.ts` | +1 atualizado | `buildDealAccessWhere` com `ownerUserId` |
| `customers.service.spec.ts` | 1 | Filtro `status` |
| `lead-shares.service.spec.ts` | 4 | Create, duplicata, user ausente, revoke |
| `leads-permissions.spec.ts` | 4 | RBAC `crm:view`, `leads:share`, `leads:view` |

### Falhas pré-existentes (fora do escopo)

1. `document.util.spec.ts` — normalização CNPJ
2. `app.controller.spec.ts` — expectativa `"Hello World!"` desatualizada

---

## Pendências restantes

| Item | Prioridade | Notas |
|------|------------|-------|
| Corrigir 2 testes legados | Baixa | Hardening geral |
| `ownerTeamId` em `Deal` | Média | Scoping `team` ainda via `convertedLead` |
| UI LeadShare | Média | API pronta; sem tela (Sprint posterior) |
| Frontend consumir `GET /crm/deals/:id` | Baixa | BFF pronto; listagem ainda suficiente para Kanban |
| FK `lead_shares.tenantId` | Baixa | Migration futura |
| Promover `LeadSheetV2` (remover flag) | Média | Paridade com deal sheet |
| Central de Cotações (write UI) | Alta | **Sprint 6.2** |

---

## Confirmação — Pronto para Sprint 6.2

| Critério | Status |
|----------|--------|
| Ownership em leads e deals | ✅ |
| Scoping preparado (shadow/on) | ✅ |
| Deal workspace consolidado (6.1) | ✅ |
| Paginação deals opcional (6.1) | ✅ |
| Refresh token com dataScope (6.1) | ✅ |
| Filtro customers status (A4) | ✅ |
| GET /crm/deals/:id | ✅ |
| LeadShare API | ✅ |
| Migration + backfill ownerUserId | ✅ |
| Lint / typecheck / build | ✅ |

**Conclusão:** A base arquitetural do CRM comercial está estabilizada. A Sprint 6.2 pode iniciar a implementação da **Central de Cotações** (UI write + fluxo completo) sobre APIs já existentes de quotes/proposals.

---

*Relatório gerado ao concluir Sprint 6.1.5.*

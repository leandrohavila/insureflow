# Sprint Comercial 4.2 — Wave 1 (Reativação Comercial)

**Data:** 2026-09-16  
**Worktree:** `C:\Projetos\InsureFlow-wt-sprint40`  
**Branch:** `feature/sprint-comercial-4.2`  
**Base:** `3c9b9a7`  
**Escopo:** preparar base para futura reativação — **sem Wave 2 / fila / Reativar / Adiar / Dashboard / Portal / produção**

---

## 1. Escopo executado

| Item | Status |
|------|--------|
| Motivo obrigatório ao perder lead (API + UI) | ✅ |
| Validar `LeadLossReason.reactivationDays` (sem hardcode de motivo) | ✅ |
| `nextReactivationAt` a partir do motivo (mesmo com canal off) | ✅ |
| Auditoria `lead_lost` com metadata de reativação | ✅ |
| KPIs Agenda: Reativações hoje / atrasadas | ✅ |
| BU ACL na coleta de reativações da Agenda | ✅ |
| ACL config motivos (`settings:*`) / visualização (`crm:view`) | ✅ validado existente |
| Wave 2 / Fila / botões Reativar·Adiar | ❌ fora de escopo |

---

## 2. Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `apps/api/src/modules/leads/leads.service.ts` | Enforce `lossReasonId`; valida `reactivationDays`; agenda data via motivo; audit metadata |
| `apps/api/src/common/utils/lead-reactivation.util.ts` | Precedência motivo > settings; sem fallback mágico 30 no path com motivo |
| `apps/api/src/common/utils/lead-reactivation.util.spec.ts` | Casos canal off + motivo on |
| `apps/api/src/modules/lead-loss-reasons/dto/lead-loss-reason.dto.ts` | `reactivationDays` obrigatório no create |
| `apps/api/src/modules/lead-loss-reasons/lead-loss-reasons.service.ts` | Assert dias quando reativação ligada; remove `?? 30` |
| `apps/api/src/modules/lead-loss-reasons/lead-loss-reasons.service.spec.ts` | Spec alinhada |
| `apps/api/src/modules/commercial-agenda/commercial-agenda.service.ts` | KPIs `reactivationsToday` / `reactivationsOverdue` + BU ACL |
| `apps/web/components/crm/commercial-agenda-workspace.tsx` | Exibe os 2 KPIs (substitui “Leads novos”) |
| `apps/web/lib/data-access/modules/commercial-agenda/api.ts` | Tipos metrics |
| `apps/web/components/leads/sheet-sections/lead-data-section.tsx` | Remove “lost” do select de status |
| `apps/web/components/leads/leads-page.tsx` | Bloqueia `onStatusChange('lost')` |
| `apps/web/components/leads/sheet-sections/lead-conversion-section.tsx` | UI motivo + preview de dias |
| `apps/web/components/settings/lead-loss-reasons-manager.tsx` | Create exige dias válidos |
| `apps/web/lib/data-access/modules/lead-loss-reasons/types.ts` | `reactivationDays` required no create |

---

## 3. Comportamento

### Perda de lead
1. UI: só via “Marcar como perdido” com motivo (select sem opção Perdido no status técnico).  
2. API: `status=lost` sem `lossReasonId` → `400 BadRequest`.  
3. Motivo com `reactivationEnabled` e sem `reactivationDays` ≥ 1 → `400`.  
4. Patch: `nextReactivationAt = now + LeadLossReason.reactivationDays` se motivo habilita reativação (**independente** de `LeadReactivationSetting.enabled` — canal ≠ agenda).  
5. Activity `lead_lost` com metadata (`lossReasonId`, `reactivationDays`, `nextReactivationAt`).

### Agenda
- Itens `REACTIVATION` já vinham de `nextReactivationAt` (dados existentes).  
- Novos metrics: `reactivationsToday`, `reactivationsOverdue`.  
- Query de leads lost agora aplica `buAccess.leadWhere`.

### Configuração
- CRUD motivos continua em `/configuracoes/crm/motivos-perda`.  
- Permissões: list `crm:view` / `settings:view`; write `settings:manage` (padrão CRM).

---

## 4. Testes

| Suite | Resultado |
|-------|-----------|
| `lead-reactivation.util.spec.ts` | ✅ 6 passed |
| `lead-loss-reasons.service.spec.ts` | ✅ 3 passed |

---

## 5. Build / smoke

| Check | Resultado | Nota |
|-------|-----------|------|
| `prisma generate` | ✅ | Worktree |
| `npx nest build` (api) | ⚠️ | Falha **pré-existente**: `@repo/forms-engine` não resolvido no worktree (questionnaires) — **não introduzido pela Wave 1** |
| Smoke local app | ⚠️ parcial | Sem subir stack completa (API+Web+DB) nesta entrega; validação via unit tests + revisão de contrato Agenda/Leads |
| Produção / deploy / push / commit | ❌ não feito | Conforme pedido |

**Smoke lógico (manual checklist):**
1. Criar motivo com N dias → persistido.  
2. Tentar `PATCH lead { status: lost }` sem motivo → 400.  
3. Perder com motivo → `nextReactivationAt` = hoje+N.  
4. Agenda metrics contém `reactivationsToday` / `reactivationsOverdue`.  
5. Trocar BU → reativações filtradas por ACL.

---

## 6. Riscos

| Risco | Mitigação / nota |
|-------|------------------|
| Leads lost legados sem `lossReasonId` | Não reescritos; enforce só em novas transições |
| Motivos antigos com days inválidos | Bloqueados na próxima perda se `reactivationEnabled` |
| `nest build` quebrado por forms-engine no worktree | Build packages monorepo antes de CI; fora do escopo Wave 1 |
| Canal WhatsApp vs data de agenda | Separados de propósito |

---

## 7. Pendências (próximas waves — **não iniciar agora**)

- Wave 2: Fila `/crm/reativacoes`  
- Reativar / Adiar  
- Dashboard dedicado  
- Commit/push sob autorização  

---

## 8. Veredito

Wave 1 **pronta na branch isolada** `feature/sprint-comercial-4.2`: base de dados + enforce + KPIs Agenda + ACL.  
**Não** cria fila, botões operacionais, SaaS nem altera produção.

# Comercial 4.4 — Homologação e Go Live (Waves 1–3)

**Data:** 2026-09-17  
**Worktree:** `InsureFlow-wt-sprint44`  
**Branch:** `feature/sprint-comercial-4.4`  
**HEAD git:** `446a472` (`feat(comercial): wave1 reactivation foundation`)  
**Escopo:** auditoria + testes + builds + smoke — **sem novas features de produto**

---

## 1. Resumo executivo

| Camada | Situação |
|--------|----------|
| **Wave 1 (Perdas)** | ✅ Em **produção** e validada (motivo obrigatório, KPIs Agenda) |
| **Wave 2 (Fila)** | ✅ Código + testes + build locais verdes; **não publicada** (API prod 404) |
| **Wave 3 (Campanhas)** | ✅ Código + testes + build locais verdes (BFF completado na homologação); **não publicada** (API prod 404); **migration não aplicada** em prod |
| **Git** | Waves 2+3 ainda **uncommitted** no worktree |

### Recomendação

# NO GO

**Não publicar Waves 2+3 em produção neste momento.**

Wave 1 permanece OK em produção. Pacote completo 1+2+3 só após as pendências da §6.

---

## 2. Validações realizadas

### 2.1 Wave 1 — Perdas

| Item | Resultado | Evidência |
|------|-----------|-----------|
| Motivo obrigatório | ✅ PASS | API prod: PATCH lost sem motivo → **400** `Motivo de perda é obrigatório…` |
| `reactivationDays` → `nextReactivationAt` | ✅ PASS | `lead-reactivation.util` + `leads.service` (código @ worktree / SHA Wave 1) |
| KPIs Agenda | ✅ PASS | Prod: `reactivationsToday` / `reactivationsOverdue` presentes (valores 0/0 no smoke) |
| Activity `lead_lost` | ✅ PASS | Código + smoke Wave 1 anterior (`comercial-4.2-wave1-production.md`) |

### 2.2 Wave 2 — Fila `/crm/reativacoes`

| Item | Resultado | Evidência |
|------|-----------|-----------|
| Tela + workspace | ✅ PASS | `crm/reativacoes` + `commercial-reactivations-workspace.tsx` |
| Filtros Hoje / Atrasadas / 7 dias / Resp. / Motivo / Origem | ✅ PASS | DTO + UI |
| Abrir Lead / Reativar / Adiar | ✅ PASS | `?lead=` + endpoints reactivate/postpone |
| Eventos `lead_reactivated` / `lead_reactivation_postponed` | ✅ PASS | Service + catalog |
| Nav CRM | ✅ PASS | `navigation.ts` |
| Em produção | ❌ FAIL | `GET /api/v1/commercial-reactivations` → **404** |

### 2.3 Wave 3 — Campanhas `/crm/campaigns/reactivation`

| Item | Resultado | Evidência |
|------|-----------|-----------|
| Lista / detalhe / criar / iniciar / finalizar | ✅ PASS | UI + API |
| Preview / adicionar / remover leads | ✅ PASS* | API + UI Remover; BFF restaurado na homologação |
| Status contato / reativar campanha | ✅ PASS* | `lead_reactivated_campaign` |
| Eventos campaign_* | ✅ PASS | Catalog API+web + service |
| Prisma + migration SQL | ✅ PASS | `20260917120000_reactivation_campaigns` (enums, índices, FKs) |
| Em produção | ❌ FAIL | `GET /api/v1/commercial-reactivation-campaigns` → **404** |
| Migration em prod | ❌ FAIL | Tabelas/campanhas ainda não existem no runtime prod |

\*Durante a auditoria, BFF incompleto e labels web faltantes foram **corrigidos** (restauração Wave 3, sem mudar regra de negócio). Build web revalidado.

### 2.4 Auditoria / timeline / ACL (código)

| Evento | Catalog | Publicado no service |
|--------|---------|----------------------|
| `campaign_created` | ✅ | ✅ |
| `campaign_started` | ✅ | ✅ |
| `campaign_finished` | ✅ | ✅ |
| `campaign_lead_added` | ✅ | ✅ |
| `campaign_lead_removed` | ✅ | ✅ |
| `lead_reactivated` | ✅ | ✅ (fila) |
| `lead_reactivated_campaign` | ✅ | ✅ (campanha) |
| `lead_reactivation_postponed` | ✅ | ✅ |
| `lead_lost` | ✅ | ✅ |

ACL: `BusinessUnitAccessService.leadWhere` / `resolveIds` nas filas e campanhas — coberto por testes `business-unit-acl` + services.

### 2.5 Banco (migration Wave 3)

Arquivo: `packages/database/prisma/migrations/20260917120000_reactivation_campaigns/migration.sql`

| Aspecto | Status |
|---------|--------|
| Enums | ✅ `ReactivationCampaignStatus`, `CampaignLeadContactStatus` |
| Tabelas | ✅ `reactivation_campaigns`, `campaign_leads` |
| Índices | ✅ tenant/status/owner/BU + campaign/lead/contact |
| Unique | ✅ `(campaign_id, lead_id)` |
| FKs / delete | ✅ tenant CASCADE; owner/createdBy RESTRICT; BU SET NULL; campaign/lead CASCADE; addedBy SET NULL |
| Aplicada em prod | ❌ Não |

---

## 3. Resultado dos testes

| Suite | Tests | Resultado |
|-------|------:|-----------|
| `lead-reactivation.util` | 11 | ✅ |
| `lead-loss-reasons.service` | 3 | ✅ |
| `commercial-agenda` | 7 | ✅ |
| `commercial-reactivations.service` | 5 | ✅ |
| `commercial-reactivation-campaigns.service` | 6 | ✅ |
| `activity-event-kinds` | 3 | ✅ |
| `business-unit-acl` | 11 | ✅ |
| `leads-permissions` | 4 | ✅ |
| `navigation.spec` (tsx) | 9 | ✅ |
| **Total** | **59** | **✅ todos verdes** |

---

## 4. Resultado dos builds

| Build | Resultado |
|-------|-----------|
| `npx nest build` | ✅ exit 0 |
| `npx next build --webpack` | ✅ exit 0 · rotas `/crm/reativacoes`, `/crm/campaigns/reactivation`, `/[id]` |

Nota: Turbopack puro falha neste worktree por junction de `node_modules`; webpack é o gate válido aqui.

---

## 5. Resultado smoke test

### 5.1 Produção (2026-09-17)

| Passo | Resultado |
|-------|-----------|
| Login API | ✅ |
| Agenda KPIs reativação | ✅ campos presentes |
| Lost sem motivo | ✅ **400** |
| Fila Wave 2 | ❌ **404** |
| Campanhas Wave 3 | ❌ **404** |

### 5.2 Cenário completo pedido (Lead→Lost→Fila→Adiar→Reativar→Lost→Campanha→Pipeline)

| Trecho | Status |
|--------|--------|
| Lead → Perdido (motivo) | ✅ prod (Wave 1) |
| Fila → Adiar → Fila → Reativar | ❌ não disponível em prod; coberto por testes unitários locais |
| Perdido → Campanha → Reativado → Pipeline | ❌ não disponível em prod; coberto por testes unitários locais |

**Smoke E2E completo: NÃO VERDE em produção.**

---

## 6. Pendências (bloqueadores de GO)

1. **Commit** Waves 2+3 (+ fixes de homologação BFF/labels/Remover) em SHA liberável  
2. **Push / merge** para branch de release acordada  
3. **Migration** `20260917120000_reactivation_campaigns` em produção (`prisma migrate deploy`)  
4. **Deploy** API (Railway) + Web (Vercel) do SHA completo  
5. **Smoke E2E prod** do fluxo Fila + Campanha após deploy  
6. (Opcional) Staging HML com o mesmo pacote antes do cutover

Riscos menores (não bloqueiam commit, acompanhar no go-live):

- Filtro responsável na campanha ainda por ID textual  
- `next build` Turbopack vs webpack no worktree com junctions  

---

## 7. Riscos encontrados

| Risco | Severidade | Nota |
|-------|------------|------|
| Waves 2+3 só no working tree | Alta | Perda de trabalho / deploy parcial Wave 1 only |
| Migration não aplicada | Alta | Campanhas quebram sem tabelas |
| Smoke E2E incompleto em prod | Alta | Não validar fila/campanha live |
| BFF Wave 3 incompleto (pré-fix) | Alta → mitigado | Restaurado na homologação |

---

## 8. Recomendação

| Pacote | Veredito |
|--------|----------|
| Wave 1 (já em prod) | **GO** — manter |
| Waves 2+3 agora | **NO GO** |
| Pacote 1+2+3 após §6 | **GO condicional** — reemitir este relatório com smoke E2E verde |

### Critério para virar GO

- [ ] SHA único contendo Waves 1+2+3  
- [ ] Migration aplicada  
- [ ] Deploy web+API  
- [ ] Smoke: lost→fila→adiar→reativar→lost→campanha→reativar→status ativo  
- [ ] Eventos de auditoria visíveis na timeline  
- [ ] ACL BU ok em smoke multiempresa  

---

## 9. Entrega

1. **Testes:** 59/59 verdes  
2. **Builds:** nest ✅ · next (webpack) ✅  
3. **Smoke:** Wave 1 prod ✅ · Wave 2/3 prod ❌ · E2E completo ❌  
4. **Pendências:** §6  
5. **Relatório:** este arquivo  
6. **Recomendação:** **NO GO** (para publicação do pacote 2+3)

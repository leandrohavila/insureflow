# Sprint 2 — Encerramento (Ownership + RBAC · Leads)

**Status:** ✅ **Aprovada**  
**Data de encerramento:** 2026-06-03  
**Branch:** `feature/rbac-ownership-foundations`  
**Ambiente de validação:** Local (API + Web + Neon dev) · `OWNERSHIP_ENFORCEMENT=shadow`  
**Produção:** Protegida — enforcement `off`, login sem `dataScope` Sprint 2  
**HML Railway/Vercel:** Não executado — limitação de recursos Railway (decisão consciente)

---

## 1. O que foi implementado

### 1.1 Schema e dados (additive, sem breaking change)

| Entrega | Detalhe |
|---------|---------|
| Migration `20260527120000_ownership_foundations` | `Team`, `TeamMember`, `LeadShare`, `Role.defaultDataScope` |
| Colunas em `Lead` | `ownerUserId`, `ownerTeamId` (FKs) — `assignedTo` preservado |
| Seed ownership | Personas V1–V4: admin, gerência, comercial, parceiro |
| Backfill | Script dry-run/execute `assignedTo` → `ownerUserId` |
| Align script | `hml:sprint2:align-owners` — alinha demo seed com ownership |

### 1.2 Backend (API NestJS)

| Entrega | Detalhe |
|---------|---------|
| `OwnershipService` | `resolveContext`, `buildLeadAccessWhere`, `assertCanAccessLead` |
| Feature flag | `OWNERSHIP_ENFORCEMENT`: `off` \| `shadow` \| `on` (env > tenant.settings) |
| Integração leads | list, detail, create, update, delete |
| Shadow logging | `[ownership:shadow]` — divergências sem bloqueio |
| JWT enriquecido | `dataScope`, `teamIds` no payload de sessão |
| Scripts operacionais | `hml:sprint2:db`, `hml:sprint2:validate`, `hml:sprint2:align-owners` |

### 1.3 Frontend (Web Next.js)

| Entrega | Detalhe |
|---------|---------|
| Sessão | `dataScope` e `teamIds` expostos via `/api/auth/me` |
| Leads UI | Filtro **"Meus leads"** condicional por escopo |
| RBAC UI | `PermissionGate` reutilizado; painel de permissões em Configurações |
| Roles oficiais | Mapeamento slugs Sprint 2 (admin, gerencia, comercial, parceiro, …) |

### 1.4 Documentação

- [sprint-2-hml-checklist.md](../architecture/sprint-2-hml-checklist.md)
- [sprint-2-rollout-risks.md](../architecture/sprint-2-rollout-risks.md)
- [sprint-2-hml-validation-report.md](../architecture/sprint-2-hml-validation-report.md)
- [sprint-2-browser-validation-checklist.md](../architecture/sprint-2-browser-validation-checklist.md)
- [sprint-2-ownership-leads.md](./sprint-2-ownership-leads.md)

### 1.5 Explicitamente fora de escopo (Sprint 2)

- Ownership em **deals**, **customers**, **policies**, **activities**
- Enforcement `on` em produção ou HML
- UI admin de usuários / roles / equipes / compartilhamento
- Permissões granulares `view/create/edit/delete` (continua `*:manage` agregado)
- Deploy HML Railway (bloqueado por recursos)

---

## 2. O que foi validado

### 2.1 Critérios de aprovação (local)

| Critério | Resultado | Evidência |
|----------|-----------|-----------|
| Migration aplicada no Neon dev | ✅ OK | `hml:sprint2:db migrate` |
| Seed + personas V1–V4 | ✅ OK | Credenciais seed operacionais |
| Align owners pós-seed | ✅ OK | 4/4 leads alinhados |
| Backfill dry-run | ✅ OK | 4 `alreadySet`, 0 `unmatched`, 0 `orphaned` |
| `hml:sprint2:validate` | ✅ OK | **0 issues** |
| Shadow — admin / gerência / comercial | ✅ OK | Sem warns `legacy≠ownership` |
| Shadow — parceiro (`shared`) | ✅ OK | Divergência documentada e esperada |
| JWT `dataScope` / `teamIds` | ✅ OK | V1–V4 conforme matriz |
| GET `/leads` sem token → 401 | ✅ OK | |
| Produção protegida | ✅ OK | `api.corretoraavila.com.br` sem `dataScope` |
| Browser V1–V4 (manual local) | ✅ OK | Sign-off produto via testes locais |
| HML Railway/Vercel | ⏭ N/A | Não executado — limitação de recursos |

### 2.2 Personas validadas

| Persona | E-mail | Escopo | Comportamento shadow validado |
|---------|--------|--------|-------------------------------|
| V4 Admin | admin@insureflow.com | `tenant` | Lista 4 leads; filtro "Meus" oculto |
| V3 Gerência | gerencia@insureflow.com | `team` | Lista equipe; filtro "Meus" visível |
| V2 Comercial | comercial@insureflow.com | `own` | Carteira própria; create define owner |
| V1 Parceiro | parceiro@insureflow.com | `shared` | Legacy 4 vs ownership 2 — esperado em shadow |

### 2.3 Decisão de encerramento

Sprint 2 considerada **concluída e aprovada** com validação local completa.  
Deploy HML adiado **não bloqueia** merge da fundação — rollout cloud será retomado quando houver capacidade Railway ou via ambiente alternativo acordado.

---

## 3. Riscos conhecidos

| Risco | Severidade | Estado | Mitigação |
|-------|------------|--------|-----------|
| Parceiro em `shadow` vê lista legado (4) vs ownership (2) | Baixa | Aceito | Com `on`, lista restringe a `LeadShare`; documentado |
| `assignedTo` texto inconsistente em dados reais | Média | Monitorar | Backfill dry-run antes de `on`; manter coluna legado |
| Leads sem `ownerUserId` em modo `on` | Média | Mitigado em dev | Backfill obrigatório pré-`on` |
| Gerência sem `TeamMember` | Média | Mitigado em seed | Validar membership no CRUD equipes (Sprint 3) |
| JWT desatualizado após mudança de role | Baixa | Conhecido | Re-login; TTL 15m |
| `.env.local` sobrescrevendo Neon | Média | Corrigido | `APP_ENV=development` + ordem env |
| Ativar `on` cedo demais | Alta | Controlado | Prod permanece `off`; Sprint 3 define piloto |
| HML não validado em cloud | Média | Aceito | Local + Neon dev como proxy; redeploy HML quando possível |
| Permissões agregadas (`leads:manage`) | Baixa | Débito técnico | Sprint 3 granulariza ações |
| Cross-tenant não testado | Baixa | Pendente | Sprint 3 — testes com 2º tenant |
| 403 sem `leads:view` | Baixa | Parcial | Cobrir em Sprint 3 com matriz granular |

---

## 4. Pendências transferidas para Sprint 3

| # | Pendência | Prioridade |
|---|-----------|------------|
| P1 | Enforcement `on` em ambiente piloto (local/HML quando disponível) | Alta |
| P2 | Ownership **deals** + **customers** (schema + service + API) | Alta |
| P3 | UI admin: usuários, grupos/equipes, roles, permissões | Alta |
| P4 | Compartilhamento lead (`LeadShare`) — UI e API CRUD | Alta |
| P5 | Permissões granulares por ação (`view/create/edit/delete/share`) | Alta |
| P6 | Permissões por tela / rota (navigation + guards) | Alta |
| P7 | Visão gerencial por equipe (filtros, dashboards CRM) | Média |
| P8 | Auditoria ownership (`lead.share.*`, `owner.transferred`) | Média |
| P9 | Backfill deals/customers | Média |
| P10 | Deploy HML + smoke cloud (quando Railway disponível) | Média |
| P11 | Merge `feature/rbac-ownership-foundations` → `develop` | Alta (ops) |
| P12 | Produção: manter `off` até sign-off Sprint 3 + janela | Crítica |

---

## 5. Handoff

| Artefato | Local |
|----------|-------|
| Plano Sprint 3 | [sprint-3-plan.md](../architecture/sprint-3-plan.md) |
| Matriz RBAC alvo | [rbac-phase-2-matrix.md](../architecture/rbac-phase-2-matrix.md) |
| Arquitetura ownership | [ownership-architecture.md](../architecture/ownership-architecture.md) |
| Rollout | [rbac-rollout-plan.md](../architecture/rbac-rollout-plan.md) |

**Próximo passo:** iniciar Sprint 3 conforme plano — sem alterar produção até checklist pré-prod da Sprint 3.

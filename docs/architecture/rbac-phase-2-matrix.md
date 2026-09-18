# Matriz de permissões — Módulo × Ação × Escopo (Fase 2)

**Status:** Consolidado (Sprint 1b)  
**Data:** 2026-05-27

**Convenção de chaves (alvo Sprint 2):** `{módulo}.{ação}` em minúsculas.  
**Legado (hoje):** `{módulo}:{ação}` com `:` — ver coluna “Chave atual”.

**Ações canônicas:**

| Ação | Descrição HTTP típica |
|------|------------------------|
| `view` | GET list, GET detail |
| `create` | POST |
| `edit` | PATCH |
| `delete` | DELETE |
| `share` | POST/DELETE compartilhamento (leads) |
| `export` | Export CSV/planilha (futuro) |
| `manage` | Umbrella admin do módulo (evitar onde houver granular) |

---

## 1. Catálogo de permissões por módulo

### 1.1 Dashboard

| Chave alvo | Chave atual | Ação | Escopo aplica? |
|------------|-------------|------|----------------|
| `dashboard.view` | `dashboard:view` | view | não |

### 1.2 Leads

| Chave alvo | Chave atual | Ação | Escopo |
|------------|-------------|------|--------|
| `leads.view` | `leads:view` | view | ✅ own/team/shared/tenant |
| `leads.create` | *(em `leads:manage`)* | create | define owner no create |
| `leads.edit` | *(em `leads:manage`)* | edit | ✅ |
| `leads.delete` | *(em `leads:manage`)* | delete | ✅ |
| `leads.share` | **nova** | share | só registros que o usuário pode “ver” com permissão de share |
| `leads.export` | **nova** | export | ✅ |
| `leads.assign` | **nova** | reassign owner (gerência/admin) | ✅ |

### 1.3 Deals (negócios / pipeline)

| Chave alvo | Chave atual | Ação | Escopo |
|------------|-------------|------|--------|
| `deals.view` | `crm:view` (parcial) | view | ✅ |
| `deals.create` | `crm:manage` | create | ✅ |
| `deals.edit` | `crm:manage` | edit | ✅ |
| `deals.delete` | `crm:manage` | delete | ✅ |
| `deals.export` | **nova** | export | ✅ |

**Regra parceiro:** sem nenhuma permissão `deals.*` nem `crm:view`.

### 1.4 Customers (clientes)

| Chave alvo | Chave atual | Ação | Escopo |
|------------|-------------|------|--------|
| `customers.view` | `clients:view` | view | ✅ |
| `customers.create` | `clients:manage` | create | ✅ |
| `customers.edit` | `clients:manage` | edit | ✅ |
| `customers.delete` | **nova** | delete | ✅ |
| `customers.export` | **nova** | export | ✅ |

### 1.5 Activities (atividades / timeline)

| Chave alvo | Chave atual | Ação | Escopo |
|------------|-------------|------|--------|
| `activities.view` | `crm:view` (implícito) | view | derivado do pai |
| `activities.create` | `crm:manage` | create | ✅ |
| `activities.edit` | `crm:manage` | edit | ✅ |
| `activities.delete` | `crm:manage` | delete | ✅ |

### 1.6 Policies (apólices)

| Chave alvo | Chave atual | Ação | Escopo |
|------------|-------------|------|--------|
| `policies.view` | `policies:view` | view | via customer/deal |
| `policies.create` | `policies:manage` | create | ✅ |
| `policies.edit` | `policies:manage` | edit | ✅ |
| `policies.delete` | **nova** | delete | ✅ |
| `policies.renew` | **nova** | renovação | ✅ operacional |

### 1.7 Questionários, cotações, sinistros (escopo Sprint 2+)

| Módulo | view | create | edit | delete | Notas |
|--------|:----:|:------:|:----:|:------:|-------|
| `questionnaires.*` | `questionnaires:view` | manage | manage | — | Comercial + operacional |
| `quotes.*` | `quotes:view` | manage | manage | — | Comercial |
| `claims.*` | `claims:view` | manage | manage | — | Operacional |

### 1.8 Administração

| Chave alvo | Chave atual | Ação | Escopo |
|------------|-------------|------|--------|
| `users.view` | *(em `users:manage`)* | view | tenant |
| `users.manage` | `users:manage` | CRUD usuários | tenant |
| `roles.view` | **nova** | view | tenant |
| `roles.manage` | **nova** | CRUD roles | tenant |
| `teams.view` | **nova** | view | tenant |
| `teams.manage` | **nova** | CRUD equipes | tenant |
| `settings.view` | `settings:view` | view | tenant |
| `settings.manage` | `settings:manage` | edit | tenant |
| `audit.view` | `audit:view` | view logs | tenant |

### 1.9 Plataforma e módulos excluídos desta sprint

| Módulo | Status documentação |
|--------|---------------------|
| `whatsapp.*` | Fora de escopo implementação |
| `automation.*` | Fora de escopo |
| `finance.*` | Planejado — `financeiro` role |
| `tenants.manage` | Apenas `super_admin` |

---

## 2. Matriz role × permissão (consolidada)

✅ = concedido · ❌ = negado · (v) = só `view` · (o) = escopo `own` · (t) = `team` · (s) = `shared`

### 2.1 `super_admin`

| Área | Permissões |
|------|------------|
| Tudo no produto | ✅ todas |
| Cross-tenant | `tenants.manage` ✅ |
| Ownership | Ignora escopo tenant alvo (operação plataforma) |

### 2.2 `admin`

| Módulo | view | create | edit | delete | share | export | manage |
|--------|:----:|:------:|:----:|:------:|:-----:|:------:|:------:|
| dashboard | ✅ | — | — | — | — | — | — |
| leads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | assign ✅ |
| deals | ✅ | ✅ | ✅ | ✅ | — | ✅ | — |
| customers | ✅ | ✅ | ✅ | ✅ | — | ✅ | — |
| activities | ✅ | ✅ | ✅ | ✅ | — | — | — |
| policies | ✅ | ✅ | ✅ | ✅ | — | ✅ | renew ✅ |
| questionnaires | ✅ | ✅ | ✅ | — | — | — | — |
| quotes | ✅ | ✅ | ✅ | — | — | — | — |
| claims | ✅ | ✅ | ✅ | — | — | — | — |
| users/roles/teams | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| settings | ✅ | — | ✅ | — | — | — | ✅ |
| audit | ✅ | — | — | — | — | export ✅ | — |
| whatsapp/automation | ✅ | ✅ | ✅ | — | — | — | — |

**Escopo:** `tenant`.

### 2.3 `gerencia`

| Módulo | view | create | edit | delete | share | export |
|--------|:----:|:------:|:----:|:------:|:-----:|:------:|
| dashboard | ✅ | — | — | — | — | ✅ |
| leads | ✅ (t) | ✅ (t) | ✅ (t) | ✅ (t) | ✅ | ✅ |
| deals | ✅ (t) | ✅ (t) | ✅ (t) | 🔶 | — | ✅ |
| customers | ✅ (t) | ✅ (t) | ✅ (t) | 🔶 | — | ✅ |
| activities | ✅ (t) | ✅ (t) | ✅ (t) | ✅ (t) | — | — |
| policies | ✅ (t) | 🔶 | ✅ (t) | ❌ | — | ✅ |
| questionnaires | ✅ | ✅ | ✅ | — | — | — |
| quotes | ✅ | ✅ | ✅ | — | — | — |
| claims | (v) | — | — | — | — | — |
| users | (v) | ❌ | ❌ | ❌ | — | — |
| teams | ✅ | 🔶 membros | 🔶 | — | — | — |
| settings | (v) | — | — | — | — | — |
| audit | (v) | — | — | — | — | — |

**Escopo:** `team`. **Não** vê pipeline de outras equipes.

### 2.4 `comercial`

| Módulo | view | create | edit | delete | share | export |
|--------|:----:|:------:|:----:|:------:|:-----:|:------:|
| dashboard | ✅ | — | — | — | — | 🔶 |
| leads | ✅ (o) | ✅ (o) | ✅ (o) | ✅ (o) | ✅ (o) | 🔶 |
| deals | ✅ (o) | ✅ (o) | ✅ (o) | 🔶 | — | — |
| customers | ✅ (o) | 🔶 | 🔶 | ❌ | — | — |
| activities | ✅ (o) | ✅ (o) | ✅ (o) | ✅ (o) | — | — |
| policies | (v) (o) | ❌ | ❌ | ❌ | — | — |
| questionnaires | ✅ | ✅ | ✅ | — | — | — |
| quotes | ✅ | ✅ | ✅ | — | — | — |
| claims | ❌ | ❌ | ❌ | ❌ | — | — |
| users/roles/teams | ❌ | ❌ | ❌ | ❌ | — | — |
| settings | ❌ | — | — | — | — | — |
| audit | ❌ | — | — | — | — | — |

**Escopo:** `own`. Carteira individual.

### 2.5 `operacional`

| Módulo | view | create | edit | delete | share | export |
|--------|:----:|:------:|:----:|:------:|:-----:|:------:|
| dashboard | ✅ | — | — | — | — | — |
| leads | (v) (t) | ❌ | ❌ | ❌ | ❌ | — |
| deals | (v) (t) | ❌ | ❌ | ❌ | — | — |
| customers | ✅ (t) | ✅ (t) | ✅ (t) | 🔶 | — | ✅ |
| activities | ✅ (t) | ✅ (t) | ✅ (t) | 🔶 | — | — |
| policies | ✅ (t) | ✅ (t) | ✅ (t) | 🔶 | — | ✅ |
| policies.renew | — | — | ✅ | — | — | — |
| questionnaires | ✅ | ✅ | 🔶 | — | — | — |
| quotes | (v) | — | — | — | — | — |
| claims | ✅ | ✅ | ✅ | — | — | — |
| CRM pipeline write | ❌ | ❌ | ❌ | ❌ | — | — |

**Escopo padrão:** `team` (configurável para `tenant` em corretoras pequenas).

### 2.6 `financeiro`

| Módulo | view | create | edit | delete | export |
|--------|:----:|:------:|:----:|:------:|:------:|
| dashboard | ✅ | — | — | — | ✅ |
| leads / deals | ❌ | ❌ | ❌ | ❌ | — |
| customers | (v) | — | — | — | ✅ |
| policies | ✅ | — | 🔶 comissão | — | ✅ |
| finance.* (futuro) | ✅ | ✅ | ✅ | 🔶 | ✅ |
| audit | (v) | — | — | — | ✅ |

**Escopo:** `tenant` (leitura financeira). **Sem** pipeline comercial.

### 2.7 `parceiro`

| Módulo | view | create | edit | delete | share |
|--------|:----:|:------:|:----:|:------:|:-----:|
| dashboard | 🔶 mínimo | — | — | — | — |
| leads | ✅ (s) | ❌ | ❌ | ❌ | ❌ |
| leads.comment | **futuro** | — | 🔶 | — | — |
| deals | ❌ | ❌ | ❌ | ❌ | — |
| customers | ❌ | ❌ | ❌ | ❌ | — |
| policies | ❌ | ❌ | ❌ | ❌ | — |
| activities | ❌ | ❌ | ❌ | ❌ | — |
| financeiro | ❌ | ❌ | ❌ | ❌ | — |

**Escopo:** `shared` apenas.

### 2.8 `leitura`

Todas as permissões terminadas em `.view` e `audit.view`, `*.export` onde existir.  
**Nenhum** create/edit/delete/share/assign.

**Escopo:** `tenant` (visualiza tudo, não altera).

---

## 3. Matriz módulo × ação × escopo (referência rápida)

Célula = escopos **permitidos** para aplicar filtro ownership quando a permissão é ✅.

| Módulo | view | create | edit | delete | share | export |
|--------|------|--------|------|--------|-------|--------|
| **leads** | own, team, shared, tenant | own, team, tenant | own, team, tenant | own, team, tenant | own, team, tenant | team, tenant |
| **deals** | own, team, tenant | own, team, tenant | own, team, tenant | own, team, tenant | — | team, tenant |
| **customers** | own, team, tenant | own, team, tenant | own, team, tenant | tenant | — | team, tenant |
| **activities** | derivado | own, team, tenant | own, team, tenant | own, team, tenant | — | — |
| **policies** | own, team, tenant | team, tenant | team, tenant | tenant | — | tenant |

**Derivado (activities):** visível se **qualquer** FK pai (lead/deal/customer/policy) for visível.

---

## 4. Regra `:manage` legado → granular

| Legado | Decomposição alvo |
|--------|-------------------|
| `leads:manage` | `leads.create` + `leads.edit` + `leads.delete` + `leads.share` |
| `crm:manage` | `deals.*` + `activities.create/edit/delete` |
| `clients:manage` | `customers.create` + `customers.edit` |
| `policies:manage` | `policies.create` + `policies.edit` + `policies.renew` |

**Compatibilidade Sprint 2:** quem tem `leads:manage` recebe automaticamente as granulares equivalentes no resolver até migração completa.

---

## 5. Cenários reais da corretora (validação funcional)

### 5.1 Parceiro — “Indicador Premium”

**Perfil:** `parceiro`, escopo `shared`.

| Pode | Não pode |
|------|----------|
| Ver 5 leads que o comercial compartilhou | Ver lista completa de leads |
| Ver detalhe do lead compartilhado (read-only) | Abrir `/crm` / kanban |
| Receber notificação de novo share (futuro) | Ver customer, apólice, comissão |
| | Exportar base do tenant |
| | Criar/editar/excluir lead |

**Permissões mínimas:** `dashboard.view`, `leads.view`.  
**Ownership:** `LeadShare.sharedWithUserId = parceiro`.

### 5.2 Comercial — “Ana Corretora”

**Perfil:** `comercial`, escopo `own`.

| Pode | Não pode |
|------|----------|
| CRUD leads próprios | Ver lead da colega (sem share) |
| Pipeline só com seus deals | Reassign lead de outro (sem `leads.assign`) |
| Clientes originados dos seus deals | Admin de usuários |
| Atividades na sua timeline | Módulo financeiro |

**Fluxo create lead:** `ownerUserId = Ana`, `ownerTeamId = Equipe Comercial SP`.

### 5.3 Gerência — “Carlos Supervisor”

**Perfil:** `gerencia`, escopo `team`, membro `Equipe Comercial SP` (`isLead: true`).

| Pode | Não pode |
|------|----------|
| Ver todos leads/deals com `ownerTeamId = Equipe SP` | Leads da Equipe RJ |
| Reassign dentro da equipe | `users.manage` (opcional tenant) |
| Exportar carteira da equipe | Excluir tenant |

### 5.4 Admin — “Patricia Admin”

**Perfil:** `admin`, escopo `tenant`.

| Pode | Não pode |
|------|----------|
| Tudo no tenant | Dados de outro tenant |
| Gerenciar usuários, roles, equipes | `tenants.manage` (só super_admin) |
| Ver auditoria | — |

### 5.5 Operacional — “Bruno Pós-venda”

**Perfil:** `operacional`, escopo `team`.

| Pode | Não pode |
|------|----------|
| Renovar apólices da equipe | Mover cards no pipeline comercial |
| Editar customer da equipe | Criar lead cold |

### 5.6 Financeiro — “Diana Financeiro”

**Perfil:** `financeiro`, escopo `tenant` (read-heavy).

| Pode | Não pode |
|------|----------|
| Ver apólices e exportar | CRM pipeline |
| Auditoria leitura | Alterar lead/deal |

### 5.7 Leitura — “Diretoria”

**Perfil:** `leitura`, escopo `tenant`, só `.view`.

| Pode | Não pode |
|------|----------|
| Dashboards e listagens | Qualquer POST/PATCH/DELETE |

---

## 6. Dependências para Sprint 2 (implementação)

| # | Dependência | Bloqueante? |
|---|-------------|-------------|
| D1 | Aprovação desta matriz pelo produto | Sim |
| D2 | Migration 1 (teams, owner FKs, lead_shares) | Sim |
| D3 | Seed roles oficiais + permissões novas | Sim |
| D4 | `PermissionResolver` + alias `:` → `.` | Sim |
| D5 | `OwnershipService.build*AccessWhere` | Sim |
| D6 | Feature flag `ownershipEnforcement` | Recomendado |
| D7 | UI admin usuários/roles | Não (pode ser Sprint 3) |
| D8 | Sync `@repo/auth` PERMISSIONS | Sim |

---

## 7. Riscos (Fase 2)

| Risco | Mitigação |
|-------|-----------|
| Granularidade excessiva | Manter alias `manage`; migrar UI aos poucos |
| Parceiro com `crm:view` no seed | Remover explicitamente do role `parceiro` |
| Gerência sem `ownerTeamId` nos dados | Backfill + obrigatoriedade no create |
| Divergência doc vs seed | Script `validate-permission-catalog.ts` |

---

## 8. Referências

- Papéis e escopos: [rbac-roles-and-scopes.md](./rbac-roles-and-scopes.md)
- Ownership por entidade: [rbac-ownership-matrix.md](./rbac-ownership-matrix.md)
- Backend/frontend plan: [rbac-enforcement-plan.md](./rbac-enforcement-plan.md)
- Auditoria: [rbac-audit-plan.md](./rbac-audit-plan.md)
- Rollout: [rbac-rollout-plan.md](./rbac-rollout-plan.md)

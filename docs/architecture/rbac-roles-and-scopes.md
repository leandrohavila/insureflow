# Papéis oficiais e escopos de acesso — Corretora

**Status:** Consolidado (Sprint 1b — Fase 2)  
**Data:** 2026-05-27  
**Relacionado:** [rbac-phase-2-matrix.md](./rbac-phase-2-matrix.md) · [ownership-architecture.md](./ownership-architecture.md)

**Não implementado:** migrations, `OwnershipService`, enforcement em API/Web.

---

## 1. Papéis da corretora (catálogo oficial)

Slugs estáveis em `Role.slug` (`isSystem: true`). Nome exibido (`Role.name`) pode ser customizado por tenant.

| Slug | Nome (UI) | Público-alvo | `defaultDataScope` | Notas |
|------|-----------|--------------|-------------------|--------|
| `super_admin` | Super Admin | Plataforma InsureFlow | `tenant` | Cross-tenant; **não** é perfil da corretora no dia a dia |
| `admin` | Administrador | TI / dono da corretora | `tenant` | Usuários, roles, configurações, dados completos |
| `gerencia` | Gerência comercial | Head comercial, supervisores | `team` | Vê e opera carteira da equipe |
| `comercial` | Comercial | Corretores, SDR, hunters | `own` | Carteira individual |
| `operacional` | Operacional | Pós-venda, emissão, renovações | `team` ou `tenant` | Foco clientes/apólices; sem pipeline comercial agressivo |
| `financeiro` | Financeiro | Financeiro / comissões | `tenant` | Leitura ampla + módulo financeiro (futuro); **sem** CRM comercial |
| `parceiro` | Parceiro externo | Indicadores, parceiros comerciais | `shared` | Só leads compartilhados |
| `leitura` | Somente leitura | Diretoria, auditoria interna | `tenant` | Apenas ações `view` / `export` onde permitido |

### 1.1 Mapeamento legado → oficial

| Legado (seed / `@repo/auth`) | Oficial | Ação na Sprint 2 |
|------------------------------|---------|------------------|
| `sales` | `comercial` | Renomear slug + migrar `UserRole` |
| `viewer` | `leitura` | Idem |
| `broker` | `comercial` | Mesclar permissões |
| `underwriter` | `operacional` | Mesclar permissões |

### 1.2 Combinação de papéis

| Regra | Motivo |
|-------|--------|
| `parceiro` **não** deve coexistir com `comercial` no mesmo usuário | Conflito de escopo `shared` vs `own` |
| `super_admin` só em usuários de plataforma | Isolamento SaaS |
| Múltiplos papéis permitidos exceto conflitos acima | JWT: união de permissões; escopo = **mais permissivo** na ordem `shared < own < team < tenant` |

**Ordem de precedência de escopo (mais permissivo vence):**  
`shared` (1) < `own` (2) < `team` (3) < `tenant` (4)

---

## 2. Escopos oficiais (`DataScope`)

### 2.1 Definições

| Escopo | Significado | Pergunta respondida |
|--------|-------------|---------------------|
| **`own`** | Registros em que o usuário é **dono** (`ownerUserId = sub`) | “É da minha carteira?” |
| **`team`** | Registros da **equipe** (`ownerTeamId ∈ equipes do usuário`) | “É da minha equipe?” |
| **`shared`** | Registros **compartilhados** explicitamente (hoje: `LeadShare`) | “Me compartilharam este lead?” |
| **`tenant`** | **Todos** os registros do tenant (respeitando `tenantId`) | “Sou admin/auditor do tenant?” |

**Importante:** escopo **não substitui** permissão. Ex.: `comercial` com `leads:view` + escopo `own` → lista só seus leads. Sem `leads:view` → 403 mesmo com escopo `tenant`.

### 2.2 Exemplos reais

| Cenário | Escopo | O que aparece na listagem de leads |
|---------|--------|-------------------------------------|
| João (comercial) criou 40 leads | `own` | 40 leads (`ownerUserId = João`) |
| Maria (gerente) equipe Sul | `team` | Leads com `ownerTeamId = Equipe Sul` |
| Indicador XYZ (parceiro) | `shared` | 3 leads com `LeadShare` ativo para XYZ |
| Ana (admin) | `tenant` | Todos os leads da corretora |
| João tenta abrir lead da Maria sem share | `own` | **404** no detail (não 403, para não vazar ID) |

### 2.3 Impacto backend

| Aspecto | Comportamento |
|---------|---------------|
| Listagens | `WHERE tenantId = :t AND (... buildAccessWhere(scope) ...)` |
| Detail / PATCH / DELETE | `assertCanAccess*` antes da operação |
| Create | Define `ownerUserId = sub`, `ownerTeamId = primaryTeam` |
| Parceiro | Subquery / join em `lead_shares`; **sem** branch `own` |
| Agenda global | Activities filtradas por leads/deals/customers **visíveis** |

### 2.4 Impacto frontend

| Aspecto | Comportamento |
|---------|---------------|
| Menu | Rotas ocultas sem permissão de módulo (ex. parceiro sem `crm:view`) |
| Tabs filtro | “Meus” / “Equipe” / “Todos” só se escopo permitir |
| Select responsável | Só admin/gerência reassign cross-user |
| Empty states | Mensagem por escopo (“Sua carteira está vazia”) |
| Botão compartilhar | `leads:share` + role comercial/gerência/admin |

---

## 3. Tabela role × escopo × permissão (resumo)

Legenda permissão: ✅ concedida · 🔶 parcial · ❌ negada · — módulo fora do perfil

### 3.1 Escopo efetivo

| Role | Escopo padrão | Pode elevar para `tenant`? |
|------|---------------|----------------------------|
| `super_admin` | `tenant` (+ cross-tenant) | N/A |
| `admin` | `tenant` | já é tenant |
| `gerencia` | `team` | só com permissão extra `records.scope.tenant` (opcional) |
| `comercial` | `own` | não |
| `operacional` | `team` | configurável por tenant |
| `financeiro` | `tenant` (leitura) | já é tenant |
| `parceiro` | `shared` | não |
| `leitura` | `tenant` | já é tenant (read-only) |

### 3.2 Visão por persona (cenários validados)

Detalhamento completo em [rbac-phase-2-matrix.md § Cenários](./rbac-phase-2-matrix.md#5-cenários-reais-da-corretora-validação-funcional).

---

## 4. Validação funcional da corretora (checklist)

Usar em **local/HML** quando Sprint 2 implementar enforcement (flag `shadow` depois `on`).

| # | Persona | Teste | Resultado esperado |
|---|---------|-------|-------------------|
| V1 | Parceiro | Login → menu | Sem Pipeline/CRM, sem Clientes, sem Financeiro |
| V2 | Parceiro | Lista leads | Apenas IDs em `LeadShare` |
| V3 | Parceiro | URL `/crm` | 403 ou redirect `/unauthorized` |
| V4 | Parceiro | URL lead não compartilhado | 404 |
| V5 | Comercial | Lista leads | Só `ownerUserId` próprio |
| V6 | Comercial | Pipeline | Só deals próprios / equipe do lead |
| V7 | Comercial | Cliente de outro corretor | 404 |
| V8 | Gerência | Lista leads | `ownerTeamId` da equipe |
| V9 | Gerência | Lead de outra equipe | 404 |
| V10 | Admin | Qualquer recurso do tenant | 200 |
| V11 | Leitura | PATCH lead | 403 |
| V12 | Financeiro | Pipeline CRM | Sem acesso (menu oculto + 403 API) |
| V13 | Operacional | Apólices da equipe | 200 conforme escopo team |

---

## 5. Referências

- Matriz permissões: [rbac-phase-2-matrix.md](./rbac-phase-2-matrix.md)
- Matriz ownership por entidade: [rbac-ownership-matrix.md](./rbac-ownership-matrix.md)
- Auditoria: [rbac-audit-plan.md](./rbac-audit-plan.md)
- Plano rollout: [rbac-rollout-plan.md](./rbac-rollout-plan.md)

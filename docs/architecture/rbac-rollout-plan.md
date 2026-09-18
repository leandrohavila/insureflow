# Plano de rollout — RBAC + Ownership

**Status:** Consolidado (Sprint 1b)  
**Ordem:** local → HML → produção. **Sem migrations destrutivas** na Fase 2 inicial.

---

## 1. Fases de entrega

| Fase | Conteúdo | Ambiente |
|------|----------|----------|
| **1b (atual)** | Docs: matrizes, roles, escopos, cenários | — |
| **2a** | Migration additive + seed roles/perms + flag `off` | local |
| **2b** | `OwnershipService` leads + shadow mode | local → HML |
| **2c** | deals, customers, activities + flag `on` HML | HML |
| **2d** | Produção com backup + flag `shadow` → `on` | prod |
| **3** | UI admin users/roles, auditoria interceptor | HML → prod |

---

## 2. Ambientes

| Ambiente | Uso | `ownershipEnforcement` |
|----------|-----|------------------------|
| **Local** | Dev diário, testes V1–V13 | `on` após 2b |
| **HML / staging** | Validação corretora, personas | `shadow` → `on` |
| **Produção** | Clientes reais | `off` → `shadow` → `on` |

Variáveis: `APP_ENV`, `DATABASE_URL` — ver [environments.md](../infra/environments.md).

---

## 3. Checklist pré-HML

- [ ] Matriz de permissões aprovada ([rbac-phase-2-matrix.md](./rbac-phase-2-matrix.md))
- [ ] Migration 1 aplicada (`prisma migrate deploy`)
- [ ] Seed: roles `parceiro`, `comercial`, `gerencia`, …
- [ ] Usuários teste por persona (5 contas)
- [ ] Backfill dry-run report (sem `--execute`)
- [ ] Testes e2e V1–V13 verdes
- [ ] `assignedTo` vs `ownerUserId` divergência < limiar acordado

---

## 4. Checklist pré-produção

- [ ] HML estável ≥ 1 semana com flag `on`
- [ ] Backup Neon completo
- [ ] Janela de deploy comunicada
- [ ] Rollback: flag `off` documentado + runbook
- [ ] Monitorar 403/404 rate pós-deploy
- [ ] Suporte informado (parceiros só veem shares)

---

## 5. Rollback

| Nível | Ação | Tempo |
|-------|------|-------|
| 1 | `Tenant.settings.ownershipEnforcement = off` | minutos |
| 2 | Revert deploy API/Web | < 30 min |
| 3 | Migration forward-only — **não** drop columns | — |

---

## 6. Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Comercial perde visão de carteira | Alto | shadow + backfill |
| Parceiro vê pipeline | Crítico | negar `deals.view` no seed |
| Performance listagens | Médio | índices + EXPLAIN HML |
| Drift permissões doc/seed | Médio | script validate catalog |
| JWT desatualizado após mudança role | Baixo | refresh sessão / TTL 15m |

---

## 7. Dependências Sprint 2

Ver [rbac-phase-2-matrix.md § Dependências](./rbac-phase-2-matrix.md#6-dependências-para-sprint-2-implementação).

---

## 8. Validação funcional (resumo)

Executar checklist completo em [rbac-roles-and-scopes.md § Validação](./rbac-roles-and-scopes.md#4-validação-funcional-da-corretora-checklist) com planilha de evidências (screenshot + HAR opcional).

---

## 9. Comunicação corretora

| Audiência | Mensagem |
|-----------|----------|
| Comercial | “Passará a ver só sua carteira; gerência vê equipe.” |
| Gerência | “Novos filtros por equipe.” |
| Parceiro | “Acesso apenas aos leads compartilhados.” |
| Admin | “Gestão de usuários e auditoria em evolução.” |

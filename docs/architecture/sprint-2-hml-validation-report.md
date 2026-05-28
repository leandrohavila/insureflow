# Sprint 2 — Relatório de validação HML (Fase 3)

**Branch:** `feature/rbac-ownership-foundations`  
**Ambiente:** HML / staging  
**Flag API:** `OWNERSHIP_ENFORCEMENT=shadow`  
**Produção:** `OWNERSHIP_ENFORCEMENT=off` (inalterado)  
**Enforcement `on`:** bloqueado até sign-off deste relatório

| Campo | Valor |
|-------|--------|
| Data | _preencher após execução_ |
| Responsável | |
| PR | https://github.com/leandrohavila/insureflow/compare/develop...feature/rbac-ownership-foundations |
| API URL HML | _Railway HML — pós deploy branch_ |
| Web URL HML | _Vercel preview/HML_ |
| Commit deployado | `feature/rbac-ownership-foundations` @ _SHA_ |
| Flag API HML | `OWNERSHIP_ENFORCEMENT=shadow` |
| Flag produção | `OWNERSHIP_ENFORCEMENT=off` (confirmado) |
| Script API | `pnpm hml:sprint2:validate` → `sprint-2-hml-validation-run.json` |
| Runbook | [sprint-2-hml-runbook.md](./sprint-2-hml-runbook.md) |

---

## 1. Banco de dados

| Etapa | OK | Notas |
|-------|----|-------|
| `prisma migrate deploy` | [ ] | migration `20260527120000_ownership_foundations` |
| `pnpm db:seed` | [ ] | roles + personas |
| Backfill dry-run | [ ] | anexar JSON abaixo |
| Backfill `--execute` | [ ] | somente se dry-run consistente |

### Backfill dry-run (colar JSON)

```json

```

### Métricas backfill

| Métrica | Valor |
|---------|-------|
| Total leads | |
| Já com `ownerUserId` | |
| Atualizados (execute) | |
| Unmatched `assignedTo` | |
| Órfãos (sem assignedTo) | |

---

## 2. Shadow logs (`[ownership:shadow]`)

Período monitorado: ___ a ___

| # | Timestamp | User | Scope | legacy | ownership | intersection | Lead ID (se access denied) | Ação |
|---|-----------|------|-------|--------|-----------|--------------|----------------------------|------|
| 1 | | | | | | | | |

### Resumo divergências

| Tipo | Qtd | Severidade | Plano correção |
|------|-----|------------|----------------|
| Contagem lista legacy ≠ ownership | | | |
| `ownerUserId` vazio | | | |
| Lead órfão | | | |
| Shared incorreto | | | |
| Filtro mine inconsistente | | | |

---

## 3. Personas (shadow — sem bloqueio API)

> Em **shadow**, listagem/detalhe seguem comportamento **legado**; ownership é calculado e logado.  
> Validar também JWT (`dataScope`, `teamIds`) e UI por escopo.

### V1 — Parceiro (`parceiro@insureflow.com`)

| Cenário | Esperado (UI/JWT) | Observado | OK |
|---------|-------------------|-----------|-----|
| Login | `dataScope=shared` | | [ ] |
| Lista leads | legado visível; shadow loga diferenças | | [ ] |
| Detalhe lead compartilhado | 200 | | [ ] |
| Detalhe lead não compartilhado | 200 (shadow); anotar log denied | | [ ] |
| Filtro "Meus leads" | oculto | | [ ] |
| Create/edit/delete | conforme permissões RBAC | | [ ] |

### V2 — Comercial

| Cenário | Esperado | Observado | OK |
|---------|----------|-----------|-----|
| Login | `dataScope=own` | | [ ] |
| Lista | legado + mine filter | | [ ] |
| Create lead | `ownerUserId` preenchido | | [ ] |
| Shadow | sem denied indevido em leads próprios | | [ ] |

### V3 — Gerência

| Cenário | Esperado | Observado | OK |
|---------|----------|-----------|-----|
| Login | `dataScope=team`, `teamIds` preenchido | | [ ] |
| Lista equipe | shadow compara team vs legacy | | [ ] |

### V4 — Admin

| Cenário | Esperado | Observado | OK |
|---------|----------|-----------|-----|
| Login | `dataScope=tenant` | | [ ] |
| Lista | vê tenant (legado) | | [ ] |
| Filtro "Meus leads" | oculto | | [ ] |

---

## 4. Frontend

| Item | OK | Notas |
|------|----|-------|
| PermissionGate oculta ações sem permissão | [ ] | |
| "Meus leads" só own/team | [ ] | |
| UX multiusuário (troca de sessão) | [ ] | |

---

## 5. Segurança

| Teste | OK | Notas |
|-------|----|-------|
| Usuário sem `leads:view` → 403 / redirect | [ ] | |
| URL direta lead alheio (API) | [ ] | shadow: 200; anotar log |
| API manual sem token | [ ] | 401 |
| Isolamento tenant | [ ] | |
| Produção `OWNERSHIP_ENFORCEMENT=off` confirmado | [ ] | |

---

## 6. Regressão

| Módulo | Sem ownership filter | OK |
|--------|------------------------|-----|
| Deals | [ ] | |
| Customers | [ ] | |
| Policies | [ ] | |
| `assignedTo` preservado | [ ] | |

---

## 7. Decisão

| Opção | Marcar |
|-------|--------|
| Aprovado para próxima fase (`on` em HML piloto) | [ ] |
| Reprovado — correções necessárias | [ ] |
| Aprovado shadow contínuo (sem `on`) | [ ] |

### Plano de correção (se reprovado)

1. 
2. 

### Readiness enforcement futuro

- [ ] Backfill HML completo
- [ ] Divergências shadow < limiar acordado
- [ ] V1–V4 documentados
- [ ] Sign-off produto/ops

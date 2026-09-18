# Relatório — dry-run `prod:clean-demo-data` (produção)

**Preencher após** `npm run prod:clean-demo-data` (sem `--execute`), colando o output do terminal nas secções indicadas.

- Checklist pré-execução: [prod-clean-pre-execute-checklist.md](prod-clean-pre-execute-checklist.md)
- Runbook limpeza: [prod-clean-demo-data.md](prod-clean-demo-data.md)

---

## 0. Estado do relatório e validação remota

| Item | Estado |
|------|--------|
| **Contagens reais (Neon)** | _Pendente — exige `npm run prod:clean-demo-data` na máquina do operador com `DATABASE_URL` de produção._ |
| **Backup / rollback (Neon)** | _Operador: marcar no §7 após criar branch / dump / documentar PITR._ |

### Validação automatizada (sem acesso à BD — API + web públicos)

Executada na sessão de validação do repositório em **2026-05-27T01:19:34Z** (UTC):

| Verificação | Resultado |
|---------------|-----------|
| `npm run prod:domain:smoke` | **OK** (todos os checks) |
| `GET /api/v1/health` | **200** |
| `GET /api/v1/health/db` | **200** |
| `GET /api/v1/health/redis` | **200** |

**Login humano** `leandro@corretoraavila.com.br` + **CRM no browser**: _confirmar manualmente antes do `--execute`._

---

## Metadados

| Campo | Valor |
|-------|--------|
| Data / hora dry-run (local) | _(preencher após dry-run)_ |
| Operador | |
| `TENANT_SLUG` usado | `insureflow` (default) |
| Origem `DATABASE_URL` | `.env.production` / variável shell (não commitar) |

---

## 1. Output bruto (colar terminal)

```
(colar aqui o bloco completo do npm run prod:clean-demo-data)
```

---

## 2. Tabelas afetadas e contagens

| # | Tabela | Registros a remover |
|---|--------|---------------------|
| 1 | `questionnaire_submissions` | |
| 2 | `activities` | |
| 3 | `policies` | |
| 4 | `deals` | |
| 5 | `leads` | |
| 6 | `customers` | |
| 7 | `questionnaire_templates` | |
| 7b | `questionnaire_fields` (cascade com templates) | _(informativo no script)_ |
| 8 | `refresh_tokens` | |
| 9 | `audit_logs` | |

**Total estimado de linhas removidas** (soma 1–6, 7, 8–9; fields em cascade não entram no total do script): ________

**`users` no tenant após operação (preservados — apenas contagem informativa no dry-run):** ________

---

## 3. Ordem de `DELETE` na transação

Ordem fixa no código (respeita FKs):

1. `questionnaire_submissions`
2. `activities`
3. `policies`
4. `deals`
5. `leads`
6. `customers`
7. `questionnaire_templates` → remove em cascade `questionnaire_fields` filhos
8. `refresh_tokens`
9. `audit_logs`

---

## 4. Dependências FK (resumo)

| Dependência | Nota |
|-------------|------|
| `QuestionnaireSubmission` → `QuestionnaireTemplate` | `onDelete: Restrict` — apagar submissions **antes** de templates |
| `Policy` → `Customer` (obrigatório), `Deal?` | `policies` removidos **antes** de `customers` e `deals` |
| `Activity` → `User`, `Lead?`, `Deal?`, `Customer?`, `Policy?` | `performedBy` → user **preservado**; demais FKs opcionais |
| `Deal` ↔ `Lead` | `lead.dealId` único; deals após policies, antes de leads na ordem do script |
| `Customer` → `Deal?` | `sourceDealId`; customers após deals |
| `QuestionnaireTemplate` → `QuestionnaireField` | Cascade ao apagar template (passo 7) |

---

## 5. Riscos e impacto operacional

| Risco | Impacto |
|-------|-----------|
| Sem backup Neon | Perda irreversível de dados operacionais |
| `refresh_tokens` | Todas as sessões invalidadas — re-login |
| CRM / questionários | Listagens vazias até novo cadastro |

---

## 6. Entidades preservadas (confirmação)

| Entidade | Preservada? |
|----------|---------------|
| Tenant `insureflow` | Sim |
| Users (incl. `leandro@corretoraavila.com.br`, `admin@insureflow.com`) | Sim |
| Roles, permissions, RBAC | Sim |
| `tenant.settings` | Sim (não alterado pelo delete) |
| Migrations / schema / `_prisma_migrations` | Sim |
| Redis / BullMQ (infra de rede e serviço) | Sim (script Prisma não acede Redis) |
| Jobs/filas antigas no Redis | Não removidos pelo script (opcional limpeza manual) |

---

## 7. Rollback preparado (preencher antes de `--execute`)

| Item | OK? |
|------|-----|
| Branch `recovery-pre-clean-*` ou dump `pg_dump` | ☐ |
| Timestamp UTC início operação anotado | ☐ |
| PITR disponível (se aplicável) | ☐ |

**Timestamp UTC referência (backup criado em):** ____________________

---

## 8. Comando futuro (NÃO executar até autorização)

**PowerShell (uma linha por variável — recomendado):**

```powershell
$env:CONFIRM_PROD_CLEAN = "YES-I-UNDERSTAND"
npm run prod:clean-demo-data -- --execute
```

**PowerShell (forma compacta, equivalente):**

```powershell
$env:CONFIRM_PROD_CLEAN="YES-I-UNDERSTAND"
npm run prod:clean-demo-data -- --execute
```

**Bash:**

```bash
CONFIRM_PROD_CLEAN=YES-I-UNDERSTAND npm run prod:clean-demo-data -- --execute
```

Requer a **mesma** `DATABASE_URL` usada no dry-run.

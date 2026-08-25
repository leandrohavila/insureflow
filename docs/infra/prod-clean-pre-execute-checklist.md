# Pré-limpeza produção — validação final (sem `--execute`)

Objetivo: **rollback seguro** + **revisão de impacto** antes de apagar dados demo do tenant `insureflow`.

**Parar aqui** até autorização explícita para:

`CONFIRM_PROD_CLEAN=YES-I-UNDERSTAND npm run prod:clean-demo-data -- --execute`

Runbook da limpeza: [prod-clean-demo-data.md](prod-clean-demo-data.md)

---

## 1. Backup Neon — checklist

Marque **antes** de qualquer `--execute`:

- [ ] Método de recovery escolhido e documentado: **branch** e/ou **pg_dump** e/ou **PITR** (conforme plano Neon).
- [ ] **Branch recovery** criada a partir da branch que alimenta `DATABASE_URL` de produção (ver nome sugerido abaixo).
- [ ] **OU** `pg_dump` concluído, ficheiro verificado (tamanho > 0) e armazenado **fora** do Git (cofre/disco seguro).
- [ ] **OU** PITR disponível no projeto e processo de restore conhecido pela equipa.
- [ ] Connection string de produção **não** colada em tickets/chats públicos.
- [ ] Anotado o **timestamp UTC** de referência (secção 1.4) — essencial se usar PITR.

### 1.1 Branch recovery recomendada

| Campo | Valor sugerido |
|-------|----------------|
| Console | [Neon → projeto produção → Branches](https://console.neon.tech) |
| Ação | **Create child branch** na branch atual de produção |
| Nome | `recovery-pre-clean-<YYYY-MM-DD>` (ex.: `recovery-pre-clean-2026-05-27`) |
| Finalidade | Snapshot lógico imediato; comparação de contagens; eventual cópia manual de dados |

### 1.2 Instrução `pg_dump` (conexão **direct**, não pooled)

Use a URL **direct** do Neon (host `*.neon.tech` sem `pooler` / sem `-pooler`, conforme o painel **Connection string → direct**).

**PowerShell (Windows):**

```powershell
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmm'Z'")
$env:PGPASSWORD = "<PASSWORD>"   # ou use URI com password embutida
pg_dump --dbname="<POSTGRESQL_URI_DIRECT>" -Fc --no-owner -f "C:\Backups\insureflow-prod-pre-clean-$stamp.dump"
```

**Bash:**

```bash
STAMP=$(date -u +%Y%m%d-%H%MZ)
pg_dump "$DATABASE_URL_DIRECT" -Fc --no-owner -f "./insureflow-prod-pre-clean-${STAMP}.dump"
```

- `-Fc`: formato custom (restore com `pg_restore`).
- Guarde o ficheiro com permissões restritas.

### 1.3 Estratégia de rollback

| Situação | Ação recomendada |
|----------|------------------|
| Erro logo após `--execute` | **PITR** para instante **anterior** ao timestamp da secção 1.4 (se disponível no plano). |
| Dump recente válido | Restaurar para instância nova ou janela de manutenção; **não** misturar com restore parcial sem plano. |
| Branch `recovery-pre-clean-*` | Comparar contagens; recuperação manual de linhas só se plano explícito (lento, propenso a erro). |

O script **não** implementa rollback automático.

### 1.4 Timestamp UTC da operação (preencher na hora)

Registe **no início** da janela em que for rodar o `--execute` (e, se possível, no fim):

| Evento | Timestamp UTC (ISO 8601) |
|--------|----------------------------|
| Backup / branch criada | `___________________________` |
| Dry-run revisado | `___________________________` |
| Início `--execute` (se autorizado) | `___________________________` |
| Fim `--execute` | `___________________________` |

Exemplo de formato: `2026-05-27T14:30:00Z`.

---

## 2. Validação manual — login real e front

Executar **na sua máquina** (não automatizável aqui):

- [ ] `https://corretoraavila.com.br` abre (SSL OK).
- [ ] Login com **leandro@corretoraavila.com.br** (senha de produção) — sucesso.
- [ ] CRM carrega (ex.: negócios, clientes, atividades) sem erro de UI.
- [ ] API pública: `GET https://api.corretoraavila.com.br/api/v1/health` → **200**.
- [ ] `GET .../api/v1/health/db` → **200**.
- [ ] `GET .../api/v1/health/redis` → **200**.

Automatizado (pode rodar no repo):

```bash
API_URL=https://api.corretoraavila.com.br WEB_URL=https://corretoraavila.com.br npm run prod:domain:smoke
```

---

## 3. Dry-run local **somente** (sem `--execute`)

Na raiz do monorepo, com `DATABASE_URL` ou `DATABASE_URL_DIRECT` do **Neon de produção** (`.env.production` ou variável de ambiente):

```bash
npm run prod:clean-demo-data
```

**Não** passar `--execute`. O comando por defeito já é dry-run.

Relatório explícito (mesmo efeito de contagens + modo report):

```bash
node scripts/prod-clean-demo-data.cjs --report
```

---

## 4. Relatório completo do dry-run (colar output abaixo)

Após `npm run prod:clean-demo-data`, copie o output para o template de relatório: [prod-dry-run-report-template.md](prod-dry-run-report-template.md) (secções 1–2).

### 4.1 Tabelas afetadas e ordem `DELETE` (transação)

| # | Tabela | Contagem (dry-run) |
|---|--------|-------------------|
| 1 | `questionnaire_submissions` | |
| 2 | `activities` | |
| 3 | `policies` | |
| 4 | `deals` | |
| 5 | `leads` | |
| 6 | `customers` | |
| 7 | `questionnaire_templates` (+ `questionnaire_fields` em cascade) | templates: ___ / fields (informativo): ___ |
| 8 | `refresh_tokens` | |
| 9 | `audit_logs` | |

**Total linhas** (soma das linhas 1–6, 7 templates, 8–9; fields em cascade não entram no total do script): ________

### 4.2 Dependências FK (resumo)

- `questionnaire_submissions` → `questionnaire_templates` (`Restrict` no template → submissions primeiro).
- `activities` → `users` (preservado), opcionalmente `lead`, `deal`, `customer`, `policy`.
- `policies` → `customers`; `deals` opcional.
- `deals` ↔ `leads` (`lead.dealId` único).
- `customers` ↔ `deals` (`sourceDealId` opcional).
- `questionnaire_templates` → cascade em `questionnaire_fields`.

### 4.3 Registros preservados (não são apagados por este script)

| Área | Preservado? |
|------|-------------|
| `tenants` (incl. `insureflow`) | Sim |
| `users` (incl. `leandro@corretoraavila.com.br`, `admin@insureflow.com`) | Sim |
| `roles`, `permissions`, `role_permissions`, `user_roles` | Sim |
| `tenant.settings` JSON | Sim (não alterado pelo delete; `prod:seed:clean` é opcional e **só** após limpeza) |
| `_prisma_migrations`, schema | Sim |
| Redis / BullMQ (infra e filas) | Sim — script não acede Redis |
| Filas / jobs antigos no Redis | Não limpos automaticamente (opcional manual) |

### 4.4 Riscos

| Risco | Impacto |
|-------|---------|
| Sem backup | Dados demo perdidos sem recovery |
| `refresh_tokens` apagados | **Todas** as sessões deslogam; re-login necessário |
| CRM / questionários vazios | Esperado até novo cadastro |

### 4.5 Impacto operacional esperado

- Utilizadores continuam existindo; **perdem só sessões** (tokens).
- CRM e questionários ficam **vazios** para o tenant alvo.
- API e front **inalterados** em código; smoke deve continuar verde após limpeza.

---

## 5. Confirmação de preservação (checklist explícito)

- [ ] Tenant **`insureflow`** — linha em `tenants` **não** removida.
- [ ] Admins / **users** — nenhum `DELETE` em `users`.
- [ ] **Roles** e **permissions** — intactos.
- [ ] **Configs** — `tenant.settings` não é apagado pelo script de limpeza.
- [ ] **Migrations** / histórico Prisma — sem `migrate reset`.
- [ ] **BullMQ / Redis** — infraestrutura intacta; filas não são truncadas por este script.
- [ ] **Prisma internals** — `_prisma_migrations` e schema não tocados.

---

## 6. Paragem obrigatória

**Não** executar até nova ordem:

`CONFIRM_PROD_CLEAN=YES-I-UNDERSTAND npm run prod:clean-demo-data -- --execute`

---

## 7. Autorização explícita (preencher depois)

Só avançar com `--execute` quando a equipa confirmar por escrito, por exemplo:

> Autorizo a execução de `prod:clean-demo-data` com `--execute` em produção, após backup verificado e dry-run revisto.

Data / responsável: ___________________

---

## Pós-limpeza (só após `--execute` e validação)

1. `API_URL=... WEB_URL=... npm run prod:domain:smoke`
2. Health `/api/v1/health`, `/health/db`, `/health/redis` → 200
3. Login admin + CRM vazio
4. Opcional: `npm run prod:seed:clean`

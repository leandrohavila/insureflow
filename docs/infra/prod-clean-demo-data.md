# Limpeza de dados demo — produção

**Checklist pré-`--execute` (backup, dry-run, relatório):** [prod-clean-pre-execute-checklist.md](prod-clean-pre-execute-checklist.md)

Prepara o tenant **`insureflow`** para operação real da corretora, removendo apenas dados operacionais de demonstração/homologação.

## Preservado (nunca apagado)

- Migrations Prisma e schema
- `tenants`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`
- Admins: `leandro@corretoraavila.com.br`, `admin@insureflow.com` (e demais usuários)
- Configurações estruturais do tenant (atualizadas opcionalmente via `prod:seed:clean`)

## Removido (por tenant)

| Ordem | Tabela | Conteúdo |
|-------|--------|----------|
| 1 | `questionnaire_submissions` | Respostas demo |
| 2 | `activities` | Atividades / follow-ups |
| 3 | `policies` | Apólices demo (`DEV-*`, etc.) |
| 4 | `deals` | Negócios pipeline |
| 5 | `leads` | Leads fake |
| 6 | `customers` | Clientes fake |
| 7 | `questionnaire_templates` | Templates demo (+ fields em cascade) |
| 8 | `refresh_tokens` | Sessões (usuários permanecem) |
| 9 | `audit_logs` | Logs funcionais não críticos |

## Backup e rollback (Neon) — antes do `--execute`

### Opção A — Branch de recuperação (recomendado)

1. [Neon Console](https://console.neon.tech) → projeto de **produção** → **Branches**.
2. Na branch que serve `DATABASE_URL`, crie uma **child branch** (ex.: `recovery-pre-clean-YYYY-MM-DD`).
3. A branch é um snapshot lógico no momento da criação — útil para comparar dados ou restaurar manualmente (copiar tabelas) se necessário.

### Opção B — Dump lógico (`pg_dump`)

Use o host **direct** (não pooled) da Neon. Guarde o ficheiro **fora** do Git (ex.: cofre):

```bash
# Exemplo — ajuste host, user, database
pg_dump "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require" -Fc -f "insureflow-prod-pre-clean.dump"
```

### Opção C — Point-in-time restore (PITR)

Se o plano Neon incluir **PITR**, na consola restaure a branch de produção para um instante **imediatamente anterior** à limpeza (anote o horário UTC ao iniciar o `--execute`).

### Rollback na prática

- O script **não** cria backup automático.
- Rollback confiável: **restore** a partir do dump, **PITR**, ou recuperação manual a partir de uma branch de recovery (conforme capacidades do plano Neon).

### Checklist imediato antes de `CONFIRM_PROD_CLEAN=... --execute`

- [ ] Branch de recovery criada **ou** `pg_dump` concluído e ficheiro verificado.
- [ ] Horário UTC de início anotado (PITR).
- [ ] `npm run prod:domain:smoke` verde no momento da operação.
- [ ] Dry-run executado com a **mesma** `DATABASE_URL` que será usada no `--execute`.

## Fora do schema atual

Não existem tabelas dedicadas para: contatos, empresas, tarefas, agenda, pipelines (stages são strings em `deals`), cotações, sinistros, uploads, notificações. Interações estão em `activities`. Filas BullMQ ficam no Redis (limpar manualmente se necessário).

## Comandos

```bash
# 1. Relatório + dry-run (padrão — não altera dados)
npm run prod:clean-demo-data

# 2. Apenas relatório explícito
node scripts/prod-clean-demo-data.cjs --report

# 3. Executar (após backup Neon + confirmação)
CONFIRM_PROD_CLEAN=YES-I-UNDERSTAND npm run prod:clean-demo-data -- --execute

# 4. Seed mínima pós-limpeza (pipeline em tenant.settings)
npm run prod:seed:clean
```

Requer `DATABASE_URL` ou `DATABASE_URL_DIRECT` apontando ao **Neon de produção**:

- Ficheiro **`.env.production`** na raiz do monorepo (recomendado, não commitar), **ou**
- Variável de ambiente já definida na shell antes de `npm run` (o script não sobrescreve se já existir).

## Rollback (resumo)

Ver secção **Backup e rollback (Neon)** acima. Não há rollback automático no script.

## Validação pós-limpeza

```bash
API_URL=https://api.corretoraavila.com.br WEB_URL=https://corretoraavila.com.br npm run prod:domain:smoke
```

Manual: login admin, CRM vazio, sem erro FK, health/db/redis 200.

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Perda irreversível de CRM demo | Backup Neon |
| Logout de todas as sessões | Esperado (`refresh_tokens`) |
| Multi-tenant | Script atua só em `TENANT_SLUG` (default `insureflow`) |

**Não execute em produção sem confirmação explícita da corretora.**

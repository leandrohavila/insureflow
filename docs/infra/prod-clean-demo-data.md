# Limpeza de dados demo — produção

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

Requer `.env.production` com `DATABASE_URL` ou `DATABASE_URL_DIRECT` (Neon).

## Rollback

- **Único rollback confiável:** restore de branch/snapshot Neon **antes** do `--execute`.
- O script não gera backup automático.

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

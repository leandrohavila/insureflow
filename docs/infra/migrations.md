# Migration strategy

Política de evolução do schema PostgreSQL via Prisma — forward-only.

## Comandos

| Comando | Onde | Quando |
|---------|------|--------|
| `npm run db:migrate` | Local | Nova migration durante desenvolvimento |
| `npm run db:deploy` | CI / release | Aplicar migrations pendentes |
| `npm run db:validate` | CI | Validar schema + migrations folder |
| `npm run db:generate` | Local / postinstall | Regenerar Prisma Client |

## Fluxo de desenvolvimento

1. Alterar `packages/database/prisma/schema.prisma`
2. `npm run db:migrate` — gera SQL em `prisma/migrations/`
3. Commitar schema + pasta migration no PR
4. CI roda `db:validate` + builds
5. Merge → deploy aplica `migrate deploy`

## Regras

- **Nunca** editar migration já aplicada em qualquer ambiente
- **Nunca** `prisma db push` em staging/produção
- **Nunca** `migrate dev` contra Neon prod/staging
- Migrations destrutivas (`DROP`, `ALTER` com lock) → backup + checklist
- Rollback = nova migration corretiva ou restore Neon PITR

## Neon / connection pooling

Prisma CLI (`migrate deploy`) usa conexão **direct** quando `DATABASE_URL_DIRECT` está definida — ver `packages/database/prisma.config.ts`.

Runtime da API usa `DATABASE_URL` pooled (host `-pooler`).

## Versionamento

Estado aplicado registrado em `_prisma_migrations`. Verificar após deploy:

```sql
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;
```

# Release checklists

## Migration checklist

Antes de mergear PR com `prisma/migrations/`:

- [ ] Migration testada localmente (`npm run db:migrate`)
- [ ] `prisma migrate deploy` testado contra branch Neon isolada
- [ ] Migration é **forward-only** (sem editar SQL já aplicado)
- [ ] Sem `DROP` destrutivo sem backup documentado
- [ ] Seed não alterado de forma incompatível com dados existentes
- [ ] `npm run db:validate` passa no CI
- [ ] Rollback plano documentado no PR (nova migration ou restore)

## Deploy checklist

### API (Railway)

- [ ] `DATABASE_URL` (pooled) configurada
- [ ] `JWT_SECRET` ≥ 32 chars (novo ou rotacionado)
- [ ] `CORS_ORIGIN` inclui URL do frontend em produção (ex.: `https://corretoraavila.com.br`, `https://www.corretoraavila.com.br`)
- [ ] `REDIS_URL` configurada (se filas ativas)
- [ ] **Start Command vazio** no serviço API (usa **CMD** do `apps/api/Dockerfile`: `node scripts/start-release.cjs` com `WORKDIR` `apps/api` — migrate + boot). Não usar `node scripts/start-release.cjs` na raiz do repo (503 no edge).
- [ ] `PORT` = `4000` (variável ou `railway.toml` `[deploy.env]`)
- [ ] Healthcheck: `GET /api/v1/health` → 200
- [ ] Healthcheck DB: `GET /api/v1/health/db` → 200
- [ ] Swagger `/docs` acessível (opcional, restringir em prod)

### Web (Vercel)

- [ ] Root directory: `apps/web`
- [ ] `AUTH_SECRET` ≥ 32 chars
- [ ] `API_INTERNAL_URL` aponta para Railway API
- [ ] Build passa (`turbo build --filter=web`)
- [ ] Login funciona (auth + cookies)
- [ ] BFF `/api/*` proxy responde

### Pós-deploy

- [ ] Smoke test CRM (listar deals, leads)
- [ ] Verificar logs Railway/Vercel sem erros Prisma
- [ ] Confirmar migration version: `_prisma_migrations` atualizada

## Pre-deploy smoke (local — baseline operacional CRM)

Antes de promover para DEV cloud (`develop` → Railway/Vercel):

```bash
npm run dev:local:check    # env + health API/Web
npm run dev:local:smoke    # login API (+ rotas web se WEB_URL setado)
```

| Check | Rota / ação |
|-------|-------------|
| Login | `/login` — credenciais seed |
| Health API | `GET /api/v1/health` → 200 |
| Health DB | `GET /api/v1/health/db` → 200 |
| Negócios | `/crm/negocios` — kanban, sheet, menu *Registrar atividade* |
| Clientes | `/crm/clientes` — portfolio, `CustomerDialog` (CPF/CNPJ, telefone, e-mail) |
| Atividades | `/crm/atividades` |
| Registrar atividade | tipo obrigatório, botão desabilitado sem chip, modal isolado (pointer/teclado) |
| Quick actions | ligação / observação / WhatsApp / follow-up no sheet |
| Timeline | histórico operacional no sheet lead/negócio |
| Adicionar | contatos, empresas, clientes — botões do header com navegação |

Pós-deploy cloud: `npm run dev:cloud:smoke` com `API_URL` e `WEB_URL` preenchidos.

## Rollback checklist

### Web (Vercel)

1. Promover deployment anterior no dashboard Vercel
2. Confirmar env vars inalteradas
3. Smoke test login + CRM

### API (Railway)

1. Redeploy deployment anterior (imagem/commit)
2. **Não** reverter migrations automaticamente
3. Se migration causou problema:
   - Opção A: nova migration corretiva (preferido)
   - Opção B: restore Neon PITR + redeploy API compatível
4. Validar `/api/v1/health/db`

### Database

1. Identificar timestamp pré-deploy
2. Neon: Restore branch ou PITR
3. Atualizar `DATABASE_URL` se branch nova
4. Redeploy API na versão compatível com schema restaurado
5. Comunicar equipe — dados pós-restore podem ser perdidos

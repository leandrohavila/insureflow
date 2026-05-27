# Go-live produção — `corretoraavila.com.br`

Checklist **production-first**. Homologação (HML) fora de escopo.

**Status:** go-live **concluído** em 2026-05-27 (smoke `prod:domain:smoke` 100% OK).

---

## URLs de produção

| Papel | URL | Status |
|-------|-----|--------|
| Web (apex) | https://corretoraavila.com.br | Vercel **Valid**, deploy Ready |
| Web (www) | https://www.corretoraavila.com.br | **308** → apex (`apps/web/vercel.json`) |
| API | https://api.corretoraavila.com.br | Railway **Active**, custom domain OK |
| API (referência) | https://insureflow-production-08c5.up.railway.app | Smoke / fallback |

---

## 1. Railway — API (`insureflow`)

| # | Item | Status |
|---|------|--------|
| 1 | Start Command vazio (CMD Dockerfile) | OK |
| 2 | Public Networking ON | OK |
| 3 | Dockerfile `apps/api/Dockerfile`, config `/railway.toml` | OK |
| 4 | Custom domain `api.corretoraavila.com.br` | **Active** |
| 5 | `PORT=4000`, health `/api/v1/health` | OK |
| 6 | `CORS_ORIGIN` | `https://corretoraavila.com.br,https://www.corretoraavila.com.br` |
| 7 | `REDIS_URL` (Railway Redis) | OK — `/api/v1/health/redis` 200 |
| 8 | Neon `DATABASE_URL` | OK — `/api/v1/health/db` 200 |

**CORS (obrigatório após alterar variável):** redeploy do serviço API. Validar:

```bash
curl -sS -D - -o NUL -H "Origin: https://corretoraavila.com.br" \
  "https://api.corretoraavila.com.br/api/v1/health" | grep -i Access-Control-Allow-Origin
```

Esperado: `Access-Control-Allow-Origin: https://corretoraavila.com.br`

CLI (opcional):

```bash
npx @railway/cli variable set CORS_ORIGIN="https://corretoraavila.com.br,https://www.corretoraavila.com.br" -s insureflow
npx @railway/cli redeploy -s insureflow -y
```

---

## 2. Vercel — Web (projeto `web`, root `apps/web`)

| # | Item | Status |
|---|------|--------|
| 1 | Domínio `corretoraavila.com.br` | Adicionado, alias produção |
| 2 | Domínio `www.corretoraavila.com.br` | Adicionado |
| 3 | Redirect www → apex | **308** em `vercel.json` |
| 4 | `API_INTERNAL_URL` | `https://api.corretoraavila.com.br` |
| 5 | `AUTH_SECRET` | Production (≥ 32 chars) |
| 6 | Região | `gru1` |
| 7 | Último deploy produção | Ready (build Next.js 16 + turbo) |

---

## 3. DNS / SSL (Registro.br)

| TIPO | HOST | VALOR | Status |
|------|------|-------|--------|
| A | `@` | `76.76.21.21` | OK → Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | OK |
| CNAME | `api` | `<target Railway>` (ex. `p3h635d4.up.railway.app`) | OK |
| TXT | `_railway-verify.api` | `railway-verify=<token>` | OK |

Nameservers podem permanecer no Registro.br (`e.sec.dns.br`) — não exige delegação à Vercel quando usa registro **A** + **CNAME**.

---

## 4. Validação automatizada

```bash
# API + custom domain + CORS
CUSTOM_API_URL=https://api.corretoraavila.com.br \
RAILWAY_URL=https://insureflow-production-08c5.up.railway.app \
npm run prod:railway:diagnose

# Health
curl -sS -w "\nHTTP:%{http_code}\n" https://api.corretoraavila.com.br/api/v1/health
curl -sS -w "\nHTTP:%{http_code}\n" https://api.corretoraavila.com.br/api/v1/health/db
curl -sS -w "\nHTTP:%{http_code}\n" https://api.corretoraavila.com.br/api/v1/health/redis

# Smoke completo (web + API + CORS + BFF)
API_URL=https://api.corretoraavila.com.br WEB_URL=https://corretoraavila.com.br npm run prod:domain:smoke
```

**Resultado esperado (2026-05-27):** todos os checks **OK**.

---

## 5. Checklist go-live concluído

- [x] Railway: custom domain Active, CORS produção, health/db/redis 200
- [x] Registro.br: A @, CNAME www, CNAME api + TXT Railway
- [x] Vercel: domínios apex + www, redirect 308, `API_INTERNAL_URL`, deploy Ready
- [x] `npm run prod:domain:smoke` 100% OK
- [x] Login BFF + sessão JWT (`/api/auth/me`)
- [ ] Login manual com `leandro@corretoraavila.com.br` (senha definida no seed admin)
- [ ] CRM navegável em produção (rotas protegidas redirecionam sem login)

---

## 6. Observações de produção

1. **Domínios Vercel:** devem estar em **Settings → Domains** do projeto `web`; DNS sozinho não basta.
2. **`API_INTERNAL_URL` vazio** no deploy quebra BFF — validar após cada alteração de env (redeploy).
3. **CORS:** só afeta chamadas browser direto à API; BFF server-side usa `API_INTERNAL_URL` sem CORS.
4. **Railway Fallback:** se `X-Railway-Fallback: true` no custom domain, revisar TXT + Active no painel ([custom-domain.md](custom-domain.md)).
5. **Admin produção:** `npm run prod:seed:admin` com `.env.production` (não commitar secrets).
6. **Atividades CRM (2026-05-27):** após deploy da API + web que incluem o ajuste de `PATCH /activities/:id`, atividades **órfãs** (sem `leadId`/`dealId`/`customerId`/`policyId`, p.ex. após exclusão manual de entidades) voltam a ser **concluídas/editadas/excluídas** sem erro 400 de vínculo. `assertRelations` só roda quando o body altera FKs; conclusão por status preserva FKs no payload quando existem. Timeline agregada (Contact/Company) passou a usar as mesmas mutations da timeline do negócio.

---

## 7. Fase 2 — Ambiente real da corretora

Limpar dados demo **sem** apagar schema, RBAC ou admins:

1. Ler [prod-clean-demo-data.md](prod-clean-demo-data.md)
2. `npm run prod:clean-demo-data` (dry-run / relatório)
3. Backup Neon → confirmação explícita → `--execute`
4. Opcional: `npm run prod:seed:clean`

---

## 8. Referências

- [custom-domain.md](custom-domain.md)
- [prod-clean-demo-data.md](prod-clean-demo-data.md)
- [release-checklists.md](release-checklists.md)

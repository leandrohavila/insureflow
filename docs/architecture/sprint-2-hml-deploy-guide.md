# Sprint 2 — Guia de deploy HML real (Fase 8)

**Branch:** `feature/rbac-ownership-foundations`  
**API flag:** `OWNERSHIP_ENFORCEMENT=shadow`  
**Produção:** `OWNERSHIP_ENFORCEMENT=off` (serviço `insureflow` / `api.corretoraavila.com.br` — **não alterar**)

---

## Pré-requisitos

- [ ] PR aberto: https://github.com/leandrohavila/insureflow/compare/develop...feature/rbac-ownership-foundations
- [ ] Neon **HML/dev** (não produção) com URL pooled + direct
- [ ] Redis no Railway HML (plugin ou Upstash)
- [ ] Conta Railway + Vercel com acesso ao projeto

**Estado atual (2026-05-28):** `insureflow-api-dev.up.railway.app` e `insureflow-web-dev.vercel.app` retornam **404** — é necessário **redeploy** desta branch.

---

## 1. Railway — API HML

### Opção A — Redeploy do serviço dev existente

1. Railway → projeto InsureFlow → serviço API dev (`insureflow-api-dev` ou equivalente).
2. **Settings → Source:**
   - Branch: `feature/rbac-ownership-foundations`
   - Root Directory: `/` (vazio)
   - Config file: `/railway.toml`
3. **Variables** (copiar de `.env.development`, **não** de produção):

| Variável | Valor HML |
|----------|-----------|
| `DATABASE_URL` | Neon pooled (HML) |
| `DATABASE_URL_DIRECT` | Neon direct (migrations CI/manual) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` ou URL interna |
| `JWT_SECRET` | secret ≥ 32 chars (HML) |
| `CORS_ORIGIN` | URL Vercel HML + `http://localhost:3000` |
| `OWNERSHIP_ENFORCEMENT` | **`shadow`** |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |

4. **Não** definir `OWNERSHIP_ENFORCEMENT` no serviço de **produção**.

5. Deploy → aguardar health:

```powershell
curl -sS https://<API_HML>/api/v1/health
curl -sS https://<API_HML>/api/v1/health/db
```

Esperado: HTTP 200, `"status":"ok"`.

### Opção B — Novo serviço `insureflow-api-hml`

Duplicar serviço, branch `feature/rbac-ownership-foundations`, domínio `*.up.railway.app` dedicado.

---

## 2. Vercel — Web HML

1. Projeto `insureflow-web` (ou preview).
2. **Deployments →** deploy branch `feature/rbac-ownership-foundations`  
   ou configurar **Preview** para essa branch.
3. **Environment Variables** (Preview / HML):

| Variável | Exemplo |
|----------|---------|
| `AUTH_SECRET` | ≥ 32 chars (HML) |
| `API_INTERNAL_URL` | `https://<API_HML>` |
| `API_URL` | mesmo (fallback BFF) |

4. Após deploy, anotar URL: `https://insureflow-web-dev.vercel.app` ou preview `*.vercel.app`.

5. Atualizar **CORS** na API Railway:

```env
CORS_ORIGIN=https://<WEB_HML>,http://localhost:3000
```

6. Smoke web + CORS:

```powershell
$env:API_URL = "https://<API_HML>"
$env:WEB_URL = "https://<WEB_HML>"
node scripts/hml-deploy-verify.cjs
```

---

## 3. Banco HML (Neon — não produção)

```powershell
cd c:\Projetos\InsureFlow
$env:APP_ENV = "development"   # ou staging se usar .env.staging

npm run hml:sprint2:db migrate
npm run hml:sprint2:db seed
npm run hml:sprint2:align-owners
npm run hml:sprint2:db backfill-dry
# se alreadySet = total:
npm run hml:sprint2:validate
```

Credenciais seed: ver [sprint-2-hml-checklist.md](./sprint-2-hml-checklist.md).

---

## 4. Verificação pós-deploy

```powershell
$env:API_URL = "https://<API_HML>"
$env:WEB_URL = "https://<WEB_HML>"
npm run hml:deploy:verify
npm run hml:sprint2:validate
```

Shadow logs: Railway → Logs → filtrar `[ownership:shadow]`.

---

## 5. Browser validation

Checklist: [sprint-2-browser-validation-checklist.md](./sprint-2-browser-validation-checklist.md)

---

## 6. Rollback

| Componente | Ação |
|------------|------|
| Railway HML | Redeploy commit anterior ou branch `develop` |
| Vercel | Promover deployment anterior |
| Flag | Remover `OWNERSHIP_ENFORCEMENT` ou `off` |
| Produção | **Nunca** aplicar seed/backfill Sprint 2 sem janela |

---

## 7. Sign-off

Preencher [sprint-2-hml-validation-report.md](./sprint-2-hml-validation-report.md) § Fase 8 com URLs reais e checklist browser.

**Bloqueado:** `OWNERSHIP_ENFORCEMENT=on` até sign-off completo.

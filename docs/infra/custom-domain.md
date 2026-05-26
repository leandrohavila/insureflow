# Domínio customizado — produção `corretoraavila.com.br`

Runbook **production-first** para Vercel (web), Railway (API), DNS no Registro.br e SSL. Homologação fica **documentada e reservada**, sem criar registros agora.

## Zona e URLs finais (produção)

| Papel | URL |
|-------|-----|
| Site (canônico) | `https://corretoraavila.com.br` |
| Site (alias) | `https://www.corretoraavila.com.br` → redirect 308 para apex |
| API | `https://api.corretoraavila.com.br` |

## 1. Plano DNS completo (Registro.br — somente produção)

Valide **sempre** os valores exibidos no painel **Vercel → Domains** e **Railway → Custom Domain** antes de publicar a zona (a Vercel pode pedir registro alternativo em alguns casos).

### 1.1 Registros obrigatórios agora

| # | Tipo | Nome (host) | Valor | TTL | Destino |
|---|------|-------------|-------|-----|---------|
| 1 | `A` | `@` (raiz / apex) | `76.76.21.21` | 3600 (ou mínimo permitido) | Vercel — `corretoraavila.com.br` |
| 2 | `CNAME` | `www` | `cname.vercel-dns.com.` | 3600 | Vercel — `www.corretoraavila.com.br` |
| 3 | `CNAME` | `api` | `<TARGET_RAILWAY>` | 3600 | Railway — substitua `<TARGET_RAILWAY>` pelo hostname que o painel mostrar (ex.: `xxxx.up.railway.app`) |

**Sobre o registro 3:** em **Railway → serviço da API → Settings → Networking → Custom domains** adicione `api.corretoraavila.com.br`. O painel exibe o **CNAME target** exato — use esse valor no Registro.br (não invente).

### 1.2 Reservado para homologação (não criar ainda)

Quando existir ambiente HML, a mesma zona poderá receber (sem mudar arquitetura):

| Tipo | Nome | Destino típico |
|------|------|----------------|
| `CNAME` | `homolog` | Vercel (projeto ou branch de staging) |
| `CNAME` | `api-hml` | Railway (serviço ou ambiente de homolog) |

Até lá, **não** crie esses registros — evita apontar subdomínios para lugar errado.

### 1.3 Nameservers

- **Opção A (simples):** manter DNS no Registro.br (ou no provedor da zona) e criar só os três registros acima.
- **Opção B:** delegar a zona à Vercel (nameservers Vercel) — então a API `api` precisa ser criada na zona gerida pela Vercel apontando para o CNAME da Railway.

## 2. Checklist exato — Registro.br

1. [ ] Login em [registro.br](https://registro.br) → **Meus domínios** → `corretoraavila.com.br`.
2. [ ] Titular = CNPJ da corretora (mesmo processo de qualquer `.com.br`).
3. [ ] **Servidores DNS:** se ainda forem os padrão Registro.br, use **DNS** ou **Editar zona** conforme a tela (alguns titulares usam “Zona DNS”).
4. [ ] Criar registro **`A`** na raiz `@` → `76.76.21.21` (confirmar no wizard da Vercel).
5. [ ] Criar **`CNAME`** `www` → `cname.vercel-dns.com` (com ou sem ponto final, conforme o painel).
6. [ ] No **Railway**, adicionar custom domain `api.corretoraavila.com.br` e copiar o **target** do CNAME.
7. [ ] Criar **`CNAME`** `api` → target Railway copiado.
8. [ ] Aguardar propagação (15 min a 48 h); TTL menor acelera testes.
9. [ ] Na **Vercel**, adicionar domínios e aguardar status **Valid** / certificado emitido.
10. [ ] Na **Railway**, aguardar domínio **Active** e SSL.

## 3. Vercel — domínios (manual no dashboard ou CLI)

**Dashboard (recomendado):** projeto `web` (root `apps/web`) → **Settings → Domains**:

1. Add `corretoraavila.com.br` (produção).
2. Add `www.corretoraavila.com.br`.
3. Definir **Primary** = `corretoraavila.com.br` e redirect de `www` → apex (comportamento nativo da Vercel ao configurar redirect).

**CLI (opcional):** na raiz do app web, com `VERCEL_TOKEN` e link ao projeto:

```bash
npx vercel domains add corretoraavila.com.br
npx vercel domains add www.corretoraavila.com.br
```

Siga as instruções de verificação DNS que a Vercel mostrar (às vezes pede TXT de verificação antes do `A`/`CNAME`).

## 4. Railway — custom domain API

1. Serviço **API** → **Settings → Networking → Public Networking** (ou equivalente).
2. **Custom Domain** → `api.corretoraavila.com.br`.
3. Criar no Registro.br o `CNAME` `api` conforme o target exibido.
4. Aguardar SSL **Active**.

### 4.1 Checklist exato — painel Railway (serviço **API**)

Marque na ordem que fizer sentido para o seu layout de menu:

| # | Onde no Railway | O que validar |
|---|-----------------|---------------|
| 1 | Projeto → serviço **correto** (único que faz deploy do `apps/api/Dockerfile`) | Nome do serviço bate com a API Nest (não web, não Redis, não Postgres). |
| 2 | **Settings → Deploy** (ou **Build / Deploy**) → **Custom Start Command** / **Start Command** | Campo **vazio** ou “Use Dockerfile”. **Não** pode ser `node scripts/start-release.cjs` sem `cd apps/api` — o CMD da imagem já roda em `WORKDIR /app/apps/api`. |
| 3 | **Settings → Deploy** → **Healthcheck Path** | `/api/v1/health` (ou herdado do `railway.toml`). |
| 4 | **Settings → Networking** (ou **Networking**) → **Public Networking** | **Ligado**; existe URL `https://<algo>.up.railway.app` para o mesmo serviço. |
| 5 | **Settings → Networking** → **Custom domains** | `api.corretoraavila.com.br` listado com status **Active** (SSL emitido). |
| 6 | **Variables** (ou **Settings → Variables**) | `PORT` = `4000` (ou confiar no `[deploy.env]` do `railway.toml`); `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` preenchidos. |
| 7 | **Deployments** → último deploy → **View logs** | Após boot: `[start-release] Starting API...` e `HTTP + Swagger`; sem `Cannot find module` nem exit logo após migrate. |

**Confirmações técnicas (repo):**

- `apps/api/src/main.ts`: `await app.listen(port, '0.0.0.0')`.
- `railway.toml` na raiz: **sem** chave `startCommand` em `[deploy]`; `healthcheckPath = "/api/v1/health"`.
- `apps/api/Dockerfile`: `EXPOSE 4000`, `WORKDIR /app/apps/api`, `CMD ["node", "scripts/start-release.cjs"]`.

### 4.2 Checklist exato — Registro.br (zona `corretoraavila.com.br`)

| # | Tipo | Nome (host) | Valor | Observação |
|---|------|-------------|-------|------------|
| 1 | **A** | `@` | `76.76.21.21` | Apex → Vercel (confirmar no assistente de domínios da Vercel se o IP mudou). |
| 2 | **CNAME** | `www` | `cname.vercel-dns.com` | `www.corretoraavila.com.br` → Vercel. |
| 3 | **CNAME** | `api` | *Target copiado do Railway* | Só o valor que o painel mostra ao adicionar `api.corretoraavila.com.br` (ex.: `xxxx.up.railway.app`). |

Não criar registros de homologação até a fase HML.

## 5. Variáveis de ambiente (após DNS válido)

### Railway (API)

```env
CORS_ORIGIN=https://corretoraavila.com.br,https://www.corretoraavila.com.br
```

Quando homolog existir, acrescente (futuro):

```env
# futuro
# CORS_ORIGIN=https://corretoraavila.com.br,...,https://homolog.corretoraavila.com.br
```

### Vercel (`apps/web`)

| Variável | Valor |
|----------|--------|
| `API_INTERNAL_URL` | `https://api.corretoraavila.com.br` |
| `AUTH_SECRET` | ≥ 32 caracteres |
| `NODE_ENV` | `production` |

Redeploy API após alterar `CORS_ORIGIN`; redeploy web após `API_INTERNAL_URL`.

## 6. Validar SSL / HTTPS

```bash
curl -sI "https://corretoraavila.com.br" | head -n 5
curl -sI "https://www.corretoraavila.com.br" | head -n 5
curl -sI "https://api.corretoraavila.com.br/api/v1/health" | head -n 5
```

Esperado: `HTTP/2 200` (ou 307/308 só no `www` se redirect). Navegador: cadeado válido, sem mixed content.

## 7. Smoke test (repositório)

```bash
API_URL=https://api.corretoraavila.com.br \
WEB_URL=https://corretoraavila.com.br \
npm run prod:domain:smoke
```

Cobre: `/api/v1/health`, `/api/v1/health/db`, CORS com `Origin` = `WEB_URL`, login API, BFF `/api/auth/login`, cookies, `/api/auth/me` (JWT/sessão), GETs em rotas web.

## 8. Checklist pós-go-live

- [ ] `corretoraavila.com.br` e `www` na Vercel **Valid**
- [ ] `api.corretoraavila.com.br` na Railway **Active**
- [ ] Railway **Start Command** vazio (CMD do Dockerfile)
- [ ] `GET https://<serviço>.up.railway.app/api/v1/health` → **200** antes de depender só do custom domain
- [ ] `CORS_ORIGIN` inclui apex + `www`
- [ ] `API_INTERNAL_URL` na Vercel = URL da API
- [ ] `npm run prod:railway:diagnose` → health **200** com JSON `insureflow-api`
- [ ] `npm run prod:domain:smoke` passa
- [ ] Login manual + página CRM protegida por sessão

### 8.1 Redeploy após merge em `develop`

1. Push para `origin/develop` (ou merge na branch que o Railway observa).
2. Railway: aguardar build + deploy **Succeeded** no serviço API.
3. Se só alterou variáveis no painel: **Redeploy** manual no último deployment estável.
4. Validar logs e curls (seção 6 e 7).

### 8.2 Diagnóstico esperado após propagação DNS

| Teste | Esperado |
|-------|----------|
| `curl -sS "https://api.corretoraavila.com.br/api/v1/health"` | HTTP **200**, corpo JSON com `"status":"ok"`, `"service":"insureflow-api"` |
| `curl -sS "https://api.corretoraavila.com.br/api/v1/health/db"` | HTTP **200**, `"database":"connected"` (se Neon OK) |
| `npm run prod:railway:diagnose` | DNS `api` → CNAME para `*.up.railway.app`; health **200** |
| `npm run prod:domain:smoke` (com `API_URL` + `WEB_URL`) | Todos **OK** (CORS, BFF login, cookies, rotas web) |

**Curl final (copiar/colar):**

```bash
curl -sS -w "\nHTTP:%{http_code}\n" "https://api.corretoraavila.com.br/api/v1/health"
curl -sS -w "\nHTTP:%{http_code}\n" "https://api.corretoraavila.com.br/api/v1/health/db"
```

**Smoke final:**

```bash
API_URL=https://api.corretoraavila.com.br WEB_URL=https://corretoraavila.com.br npm run prod:domain:smoke
```

## 9. Outros domínios da marca

`avilacorretora.com.br` pode continuar existindo na Locaweb ou outro DNS; este runbook assume **produção InsureFlow** na zona **`corretoraavila.com.br`**. Redirects entre marcas são opcionais (página estática ou outro projeto Vercel).

## 10. Troubleshooting 503 no `api.*` (Railway edge)

Sintoma: HTTPS responde, mas `GET /api/v1/health` → **503** sem JSON `{ service: "insureflow-api" }`.

| Causa | Como confirmar | Correção |
|-------|----------------|----------|
| **Start command errado** | Logs: `Cannot find module` / exit imediato | **Painel:** Start Command vazio. **Repo:** sem `startCommand` em `railway.toml`; usar CMD do Dockerfile (`WORKDIR apps/api`, `node scripts/start-release.cjs`). |
| **PORT** | App não escuta na porta do proxy | `PORT=4000` no serviço; app usa `process.env.PORT` e `0.0.0.0` |
| **Migrate falhou** | Logs: `[start-release] Running prisma migrate deploy` → erro | Corrigir `DATABASE_URL` / `DATABASE_URL_DIRECT` Neon |
| **Domínio no serviço errado** | Outro serviço no projeto Railway | Custom domain só no serviço **API** |
| **Public Networking off** | Sem URL `*.up.railway.app` | Habilitar networking no serviço API |
| **DNS** | CNAME `api` não aponta para o target do serviço API | Ajustar Registro.br |

```bash
npm run prod:railway:diagnose
```

## 11. Referências

- [environments.md](environments.md)
- [release-checklists.md](release-checklists.md)

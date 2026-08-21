# INFRA-002 — Docker da API e validação do release

**Data:** 21 de agosto de 2026  
**Branch:** `release/crm-operacao-avila`  
**Base:** `47702a5`  
**Não executado:** deploy, push, `git add`/`commit`, seed, `migrate reset`, alteração de `main`/produção.  
**Migrate no boot de validação:** `prisma migrate deploy` rodou **só** contra Postgres **local** (`host.docker.internal:5432/insureflow`) e reportou `No pending migrations to apply`. Neon cloud **não** foi usado.

---

## Classificação

# READY FOR PUSH

O image `insureflow-api:infra002` constrói, o Nest sobe sem `MODULE_NOT_FOUND`, e `/api/v1/health` (container, porta 4001) retorna 200. O typecheck da **API** passa. O typecheck da **web** ainda falha por erros **pré-existentes** (`asChild` / `string | undefined` em telas CRM-006.4) — **não** foram introduzidos por esta correção e **não** entram no Dockerfile da API.

Próximo passo: `git add` apenas os arquivos desta tarefa, commit, **push** de `release/crm-operacao-avila` (quando autorizado). Depois, Railway conforme `docs/reports/infra-001-deploy-checklist.md`.

---

## 1. Causa do problema

O `apps/api/Dockerfile` copiava só `packages/database` e `apps/api`.

A API (`apps/api/package.json`) depende de `@repo/forms-engine` (`main`/`exports` apontam para `packages/forms-engine/dist`). O `prebuild` chama `scripts/ensure-workspace-packages.cjs`, que tenta gerar `forms-engine` e `forms-library`. Sem o fonte desses pacotes no contexto Docker:

- `npm ci` / `tsc` / `ensure-workspace-packages` falham (`Cannot find package`, workspace incompleto)
- mesmo que o Nest compilasse, o runner não tinha `packages/forms-engine/dist` para o `require` em runtime

O `forms-engine` estende `@repo/typescript-config/library-build.json` — esse package também era obrigatório no **build**.

O lockfile npm lista **todos** os workspaces (`apps/*`, `packages/*`). Só copiar dois `package.json` quebra `npm ci`. Por isso o Dockerfile agora copia os `package.json` de **todos** os workspaces, e o **fonte** só do que a API compila.

O estágio `deps` antigo **não era usado** (`COPY --from=deps` inexistente) e o `postinstall` (`prisma generate`) falharia ali sem o schema. Foi removido; um único `builder` faz `npm ci`.

---

## 2. Correção aplicada

- Incluir no contexto: `forms-engine`, `forms-library`, `typescript-config`, e os `package.json` dos demais workspaces (web, docs, auth, ui, eslint-config) para o lockfile.
- Compilar na ordem: Prisma Client → forms-engine → forms-library → Nest API.
- Copiar `forms-engine` e `forms-library` (com `dist`) para o runner, junto com `database` (schema + migrations do `start-release.cjs`).
- `DATABASE_URL` dummy **só no builder** para `prisma generate` — sem migrate nesse estágio.
- `.dockerignore` para não mandar `node_modules`, `dist` local, `.env`, logs.

Preservado: npm (não pnpm), `CMD ["node", "scripts/start-release.cjs"]`, Prisma, Nest, `WORKDIR /app/apps/api`, porta 4000. Sem alteração de código de negócio.

---

## 3. Packages necessários no container

| Package | No builder | No runner | Motivo |
|---------|------------|-----------|--------|
| `api` | fonte + `dist` | `dist` + scripts | Nest |
| `@repo/database` | fonte | fonte (schema/migrations) | generate + `migrate deploy` no boot |
| `@repo/forms-engine` | fonte → `dist` | `dist` | dependência runtime da API (questionários) |
| `@repo/forms-library` | fonte → `dist` | `dist` | `ensure-workspace-packages` + workspace |
| `@repo/typescript-config` | sim | não | `tsc` dos forms |
| `web`, `docs`, `@repo/auth`, `@repo/ui`, `@repo/eslint-config` | só `package.json` | não | `npm ci` / lockfile |

---

## 4. Resultado do Docker build

```
docker build -f apps/api/Dockerfile -t insureflow-api:infra002 .
exit 0
```

- Prisma Client **6.19.3** gerado  
- `tsc` forms-engine OK  
- `tsc` forms-library OK  
- `nest build` OK (prebuild pulou generate; dist dos forms já existia)  
- Image: `insureflow-api:infra002` (~4,5 min neste workstation)

---

## 5. Resultado do boot

Container contra **Postgres/Redis locais** (`host.docker.internal`), porta host **4001** (a API de dev já usa 4000):

```
[start-release] prisma migrate deploy → 27 migrations, No pending migrations to apply
[redis] Conexão OK (PING PONG)
[prisma] Conexão Neon/PostgreSQL OK
Nest application successfully started
```

Sem `MODULE_NOT_FOUND`, `Cannot find package`, erro de Prisma Client ou de forms-*. Rotas de questionários, importador e agenda mapeadas.

Container **parado** após o teste (`docker stop insureflow-api-infra002`).

---

## 6. Resultado do health

| Endpoint | Host | HTTP |
|----------|------|------|
| `/api/v1/health` | `127.0.0.1:4001` | **200** `{"status":"ok","service":"insureflow-api"}` |
| `/api/v1/health/db` | idem | **200** `database: connected` |
| `/api/v1/health/redis` | idem | **200** `host.docker.internal:6379` |

---

## 7. Resultado dos typechecks

| Comando | Resultado |
|---------|-----------|
| `npm run check-types -w api` | **OK** (`tsc --noEmit`) |
| `npm run check-types -w web` | **Falha** (pré-existente): `asChild` inexistente no `Button` e `string \| undefined` em `commercial-agenda-workspace.tsx`, `commercial-import-*.tsx`, `renewal-portfolio-workspace.tsx` |

Workspaces npm: `-w api` e `-w web` (não `apps/api` / `apps/web`).

---

## 8. Testes executados

| Suite | Resultado |
|-------|-----------|
| `@repo/forms-engine` | 2 suites, **32 passed** |
| `@repo/forms-library` | 1 suite, **6 passed** |
| `api` `commercial-import.mapping` | **8 passed** |

Nenhuma funcionalidade homologada foi alterada.

---

## 9. Arquivos alterados (esta tarefa)

Não foi feito `git add` / commit / push.

| Arquivo | Tipo |
|---------|------|
| `apps/api/Dockerfile` | modificado |
| `.dockerignore` | novo |
| `docs/reports/infra-002-docker-release.md` | novo (este relatório) |

Outros dirty no working tree (docs antigos, `tsc.log`, screenshots) **não** fazem parte desta correção.

`git diff --stat` (Dockerfile):

```
apps/api/Dockerfile | 40 ++++++++++++++++++++++++++--------------
 1 file changed, 26 insertions(+), 14 deletions(-)
```

---

## 10. Próximo passo recomendado

Quando autorizado:

```powershell
git add -- apps/api/Dockerfile .dockerignore docs/reports/infra-002-docker-release.md
git commit -m "fix(infra): include forms workspaces in API Docker build"
git push -u origin release/crm-operacao-avila
```

Em seguida, INFRA-001 no Railway: o **primeiro** Deploy do container ainda executa `migrate deploy` no Neon. Só então publicar.

---

## Git (pedido da Fase 6 — sem stage)

```
## release/crm-operacao-avila
 M apps/api/Dockerfile
?? .dockerignore
?? docs/reports/infra-002-docker-release.md
```

(plus other unrelated dirty paths already on the branch)

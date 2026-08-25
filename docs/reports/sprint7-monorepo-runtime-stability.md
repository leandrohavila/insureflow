# Sprint 7.3.7 — Monorepo Runtime Stability

**Data:** 2026-07-22  
**Status:** Concluído

---

## 1. Causa raiz

### Erro observado

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'.../packages/forms-engine/src/validation/index'
imported from .../packages/forms-engine/src/index.ts
```

### Resposta direta às perguntas de diagnóstico

| Pergunta | Resposta |
|----------|----------|
| O arquivo existe? | **Sim** — `packages/forms-engine/src/validation/index.ts` |
| Foi renomeado/movido? | **Não** |
| Export incorreto? | **Não** — barrels corretos em TypeScript |
| Path incorreto no import? | **Não** em tempo de compilação TS |
| Package exports incorreto? | **Sim — causa principal** |
| Build incorreto? | **Sim — não havia build** |
| Watch incorreto? | **Sim — Nest watch não compila workspace deps** |
| tsconfig incorreto? | **Contribuinte** — `NodeNext` + exports apontando para `src/` |

### Mecanismo da falha

1. `@repo/forms-engine` exportava **`./src/index.ts`** (TypeScript bruto) via `package.json#exports`.
2. NestJS (`nest start --watch`) compila apenas `apps/api/src` → `dist/`.
3. Em runtime, Node resolve `@repo/forms-engine` para o **fonte TS** via symlinks npm workspaces.
4. Node aplica regras **ESM/NodeNext** que exigem extensão explícita (`.js`) em imports relativos.
5. `export * from "./validation/index"` **sem extensão** → `ERR_MODULE_NOT_FOUND`.

### Fatores agravantes (BUG-008)

- Container Docker `insureflow-api` na porta 4000 servia build de **2026-07-01** (DTO stale).
- Desenvolvimento local apontava para `:4000` mas não executava código-fonte atual.

---

## 2. Arquitetura antiga

```
┌─────────────────────────────────────────────────────────────┐
│  package.json exports: "./src/index.ts"  (sem build)        │
├─────────────────────────────────────────────────────────────┤
│  @repo/forms-engine ──symlink──► Node runtime (TS bruto)    │
│  @repo/forms-library ──symlink──► Next transpile parcial    │
│  @repo/auth ──symlink──► Next transpilePackages             │
│  @repo/database ──symlink──► index.ts + prisma generate     │
│  @repo/ui ──symlink──► TSX bruto                            │
├─────────────────────────────────────────────────────────────┤
│  API (Nest watch) ──► compila só apps/api ──► require TS src│
│  Web (Next) ──► transpilePackages: [@repo/auth] apenas      │
│  Docker api ──► build antigo na :4000                       │
└─────────────────────────────────────────────────────────────┘
```

**Problemas:**

- Pacotes compartilhados **sem `dist/`** nem script `build`
- Turbo `build` não incluía forms-engine/forms-library
- `typescript-config/base.json` usa `NodeNext` — correto para TS check, **incompatível** com runtime Node carregando `.ts` direto
- `@repo/design-system` **não existe como pacote** — design system vive em `apps/web/components/design-system` e `apps/web/lib/design-system` (app-local, OK)

---

## 3. Arquitetura nova

```
┌─────────────────────────────────────────────────────────────┐
│  Pacotes buildáveis (CJS → dist/)                           │
├─────────────────────────────────────────────────────────────┤
│  @repo/forms-engine                                           │
│    build: tsc -p tsconfig.build.json                          │
│    exports: "./dist/index.js" + "./dist/index.d.ts"           │
│    dev: tsc --watch                                           │
├─────────────────────────────────────────────────────────────┤
│  @repo/forms-library (depende forms-engine)                   │
│    idem                                                       │
├─────────────────────────────────────────────────────────────┤
│  @repo/database — prisma generate (sem mudança)               │
│  @repo/auth — TS bruto + Next transpilePackages (web only)    │
│  @repo/ui — TSX bruto + Next bundler (web only)              │
└─────────────────────────────────────────────────────────────┘

Dev flow:
  docker compose up -d postgres redis     # sem API docker
  turbo dev                               # build deps + watch paralelo
    ├── @repo/forms-engine#dev (tsc --watch)
    ├── @repo/forms-library#dev (tsc --watch)
    ├── api#dev (nest --watch)
    └── web#dev (next dev)

API prestart:dev:
  ensure-prisma-client.cjs + ensure-workspace-packages.cjs
```

---

## 4. Decisões técnicas

| Decisão | Justificativa |
|---------|---------------|
| **Emit CJS via `tsc`** para forms-engine/library | NestJS API usa CommonJS; compatibilidade máxima sem bundler |
| **`library-build.json`** shared tsconfig | `module: CommonJS`, `moduleResolution: Node10`, `target: ES2022` |
| **exports → `dist/`** | Node resolve JS compilado; fim do ERR_MODULE_NOT_FOUND |
| **Scripts `build` + `dev` (watch)** | Turbo pipeline + watch incremental sem rebuild manual |
| **`ensure-workspace-packages.cjs`** | Garante dist/ antes de `start:dev` / `nest build` |
| **Docker API em profile `docker-api`** | Evita conflito na :4000 em dev local |
| **`GET /api/v1/health/runtime`** | Prova commit, pid, runtime=local em runtime |
| **Next `transpilePackages`** estendido | Fallback seguro para forms-engine/library |
| **Não migrar @repo/auth/@repo/ui agora** | Usados só pelo Next (bundler); fora do caminho crítico da API |

---

## 5. Impactos

| Área | Impacto |
|------|---------|
| **API** | Resolve `@repo/forms-engine` via `dist/` — sobe com `start:dev` |
| **Web** | Consome `dist/` ou transpila; questionários, field/block library OK |
| **CI** | `turbo build` compila forms packages antes de api/web |
| **Docker dev** | API container opt-in (`--profile docker-api`) |
| **DX** | `npm run dev` na raiz sobe stack completa com watch |

---

## 6. Riscos

| Risco | Mitigação |
|-------|-----------|
| Esquecer rebuild após mudança em forms-engine | `tsc --watch` no turbo dev; `ensure-workspace-packages` no prestart |
| API não recarrega quando só dist/ de pacote muda | Nest watch monitora api/src; reiniciar api após mudanças em pacotes (aceitável) |
| `@repo/auth` ainda exporta TS bruto | Next transpilePackages; migrar para dist/ em sprint futura se API precisar |
| Prisma EPERM no Windows durante build com API rodando | Parar API antes de `prisma generate` ou usar ensure script |

---

## 7. Validação executada

| Comando | Resultado |
|---------|-----------|
| `npm run build -w @repo/forms-engine` | ✅ |
| `npm run build -w @repo/forms-library` | ✅ |
| `npm run test -w @repo/forms-engine` | ✅ 32/32 |
| `npm run start:dev -w api` | ✅ Compila sem ERR_MODULE_NOT_FOUND |
| `GET /api/v1/health/runtime` | ✅ `runtime: "local"`, commit SHA |
| `npm run dev:local:validate` (ENV-001) | ✅ Todos os checks |
| `turbo check-types` (forms packages) | ✅ |
| `turbo build --filter=api` | ⚠️ Prisma EPERM com API em execução (Windows file lock) |

---

## 8. Recomendações futuras

1. **Migrar `@repo/auth` para build dist** — consistência e suporte SSR/edge.
2. **Project references TypeScript** — quando estabilizar, habilitar `composite` + `tsc -b` na raiz.
3. **Considerar tsup** — se pacotes crescerem, bundling único reduz surface de imports.
4. **CI gate** — `npm run dev:local:validate` em pipeline de dev setup.
5. **Remover `/health/runtime`** antes de produção ou proteger atrás de flag (endpoint temporário ENV-001).

---

## Arquivos alterados (principais)

| Arquivo | Mudança |
|---------|---------|
| `packages/typescript-config/library-build.json` | Novo — tsconfig para pacotes Node buildáveis |
| `packages/forms-engine/package.json` | exports → dist, build/dev scripts |
| `packages/forms-engine/tsconfig.build.json` | Emit CJS |
| `packages/forms-library/*` | Idem |
| `scripts/ensure-workspace-packages.cjs` | Novo |
| `apps/api/package.json` | prestart:dev + dev script |
| `turbo.json` | build outputs + dev dependsOn ^build |
| `docker-compose.yml` | profile docker-api |
| `apps/web/next.config.js` | transpilePackages forms |
| `apps/api/src/common/utils/runtime-info.util.ts` | Boot + runtime metadata |
| `apps/api/src/modules/health/health.controller.ts` | GET /health/runtime |

---

## Comandos finais (objetivo da sprint)

```bash
docker compose up -d postgres redis
npm run start:dev -w api    # ou: npm run dev (raiz)
npm run dev -w web
npm run dev:local:validate
```

Sem rebuild manual. Sem Docker servindo código antigo. Sem ERR_MODULE_NOT_FOUND.

# BUG-008 — Auditoria do ambiente de execução

**Data:** 2026-07-22  
**Status:** Causa raiz identificada (sem correção aplicada)

---

## Resumo executivo

O código-fonte, `dist/` local e testes unitários estão **corretos**. Porém o POST `/api/v1/leads` **não atinge o código local** — ele vai para um **container Docker** (`insureflow-api`) na porta **4000**, com imagem buildada em **2026-07-01**, contendo um `CreateLeadDto` **antigo** onde `status` é **obrigatório** (`@IsIn` sem `@IsOptional`).

---

## 1. URL usada pelo backendFetch

**Arquivo:** `apps/web/lib/api/backend.ts`

```typescript
export function getBackendApiBaseUrl() {
  return process.env.API_INTERNAL_URL ?? process.env.API_URL ?? "http://localhost:4000"
}
```

**`.env.local` (web):**

```
API_INTERNAL_URL=http://localhost:4000
```

**URL completa para criar lead:**

```
POST http://localhost:4000/api/v1/leads
```

Log adicionado: `[BUG008] backendFetch URL completa { baseUrl, path, fullUrl, ... }`

---

## 2. Processo ouvindo a porta 4000

| PID | Processo | Papel |
|-----|----------|-------|
| **32484** | `com.docker.backend` | Docker Desktop — publica **0.0.0.0:4000** |
| **31496** | `wslrelay` | Relay WSL → `[::1]:4000` |

**Container Docker:**

```
NAMES            PORTS                                         IMAGE
insureflow-api   0.0.0.0:4000->4000/tcp, [::]:4000->4000/tcp   insureflow-api
```

- **Criado:** 2026-07-01T17:47:01Z (~3 semanas atrás)
- **NODE_ENV:** `production`
- **cwd no container:** `/app/apps/api`
- **Comando:** `node dist/main` (imagem Docker buildada)

**Não há** processo `node nest start --watch` local na porta 4000.

---

## 3. Commit/código em execução

| Camada | Commit / versão |
|--------|-----------------|
| **Repositório local (git HEAD)** | `0c8385b` — fix(web): add leads:share label... |
| **Container Docker** | Imagem de **2026-07-01** — **anterior** ao BUG-004 |
| **Next.js (porta 3000)** | PID 45620 — `next start-server.js` (código local atual) |

---

## 4. Prova: DTO no container vs DTO local

### Local (`apps/api/dist/...` após build recente)

```javascript
(0, class_transformer_1.Transform)(optional_value_util_1.optionalEmptyValue),
(0, class_validator_1.IsOptional)(),
(0, class_validator_1.IsIn)(exports.LEAD_STATUSES),
], CreateLeadDto.prototype, "status", void 0);
```

### Docker (`insureflow-api` — em execução)

```javascript
(0, swagger_1.ApiProperty)({ example: 'new', enum: exports.LEAD_STATUSES, default: 'new' }),
(0, class_validator_1.IsIn)(exports.LEAD_STATUSES),
], CreateLeadDto.prototype, "status", void 0);
```

**Diferenças críticas no container:**

| Decorator | Local (correto) | Docker (stale) |
|-----------|-----------------|----------------|
| `@ApiPropertyOptional` | Sim | **Não** — usa `@ApiProperty` |
| `@Transform(optionalEmptyValue)` | Sim | **Não** |
| `@IsOptional()` | Sim | **Não** |
| `@IsIn(LEAD_STATUSES)` | Sim | Sim |

Com o DTO antigo, payload **sem** `status` falha `@IsIn` porque `undefined` não está em `LEAD_STATUSES`.

---

## 5. Proxy / PM2 / outros

| Verificação | Resultado |
|-------------|-----------|
| PM2 | **Não instalado** |
| Docker na 4000 | **Sim** — `insureflow-api` |
| Railway remoto | Configurado em `.env.development` (`API_INTERNAL_URL=https://insureflow-api-dev.up.railway.app`) mas **não** usado quando `.env.local` aponta para localhost |
| Next.js BFF | Porta 3000 — repassa para `API_INTERNAL_URL` |

---

## 6. Fluxo real do POST

```
Browser
  → POST http://localhost:3000/api/leads (Next.js BFF)
    → backendFetch("POST /api/v1/leads")
      → POST http://localhost:4000/api/v1/leads
        → Docker container insureflow-api (DTO ANTIGO)
          → ValidationPipe rejeita status ausente
```

Os logs `[BUG007]` adicionados ao **código-fonte local** **não aparecem** enquanto o container Docker antigo estiver servindo a porta 4000.

---

## 7. Instrumentação BUG-008 adicionada

### API boot (`bug008-runtime-audit.util.ts` + `main.ts`)

```
[BUG008] process.pid=
[BUG008] process.cwd()=
[BUG008] NODE_ENV=
[BUG008] PORT=
[BUG008] git.commit=
[BUG008] main.__filename=
[BUG008] LeadsController.__filename=
[BUG008] CreateLeadDto.__filename=
[BUG008] dist CreateLeadDto status has @IsOptional=... has optionalEmptyValue=...
```

> Só visível após **rebuild + restart** do processo que realmente serve a porta 4000.

### backendFetch (terminal Next.js)

```
[BUG008] backendFetch URL completa { baseUrl, fullUrl, API_INTERNAL_URL, ... }
```

### ValidationPipe (terminal API)

```
[BUG008] body bruto recebido
[BUG008] typeof body.status
[BUG008] body.hasOwnProperty("status")
[BUG008] Object.keys(body)
[BUG008] ValidationPipe process.pid / process.cwd()
```

---

## 8. Como confirmar em runtime

1. Reproduzir POST criar lead.
2. Terminal **Next.js**: confirmar `[BUG008] backendFetch URL completa` → `http://localhost:4000/api/v1/leads`.
3. Terminal **API**: se logs `[BUG008]` **não aparecem**, a requisição **não** está no processo instrumentado (confirma Docker stale).
4. `docker logs insureflow-api --tail 50` — ver se há rejeição de validação (sem BUG008).
5. Comparar boot: `docker logs insureflow-api 2>&1 | head -20` — data **2026-07-01**, sem `[BUG008]`.

---

## 9. Conclusão (prova)

| Pergunta | Resposta |
|----------|----------|
| Qual processo responde ao POST? | **Container Docker `insureflow-api`** (não o `src/` local) |
| Por que testes passam? | Testam DTO **local** com `@IsOptional` |
| Por que ValidationPipe rejeita? | Container usa DTO **pré-BUG-004** — `status` obrigatório via `@IsIn` |
| O body chega sem status? | Provavelmente sim — rejeição é por **DTO stale**, não por body incorreto |

**Correção futura (fora do escopo BUG-008):** rebuild Docker (`docker compose build api && docker compose up -d api`) **ou** parar Docker e rodar `npm run start:dev` na API **ou** apontar `API_INTERNAL_URL` para processo local em outra porta.

---

## Arquivos instrumentados

- `apps/api/src/common/utils/bug008-runtime-audit.util.ts` (novo)
- `apps/api/src/main.ts`
- `apps/api/src/common/pipes/bug007-validation.pipe.ts`
- `apps/web/lib/api/backend.ts`

# BUG-007 — Auditoria: qual DTO o ValidationPipe usa em POST /leads

**Data:** 2026-07-22  
**Status:** Instrumentado (sem correção)

---

## 1. Controller que atende POST /leads

| Campo | Valor |
|-------|--------|
| **Classe** | `LeadsController` |
| **Arquivo** | `apps/api/src/modules/leads/leads.controller.ts` |
| **Decorator rota** | `@Controller('leads')` + `@Post()` |
| **URL completa** | `POST /api/v1/leads` (prefixo global `api` + versionamento URI `v1`) |
| **Método** | `createLead(@CurrentUser() user, @Body() dto: CreateLeadDto)` |
| **Permissão** | `@RequirePermissions('leads:manage')` |
| **HTTP status** | `@HttpCode(HttpStatus.CREATED)` → 201 |

---

## 2. DTO importado pelo Controller

```typescript
import {
  ConvertLeadDto,
  CreateLeadDto,
  FindLeadDuplicatesQueryDto,
  LEAD_STATUSES,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.dto';
```

| Campo | Valor |
|-------|--------|
| **Classe usada no `@Body()`** | `CreateLeadDto` |
| **Import path (relativo)** | `./dto/lead.dto` |
| **Caminho absoluto no repo** | `apps/api/src/modules/leads/dto/lead.dto.ts` |

**Não há re-export intermediário.** Import direto do arquivo fonte.

---

## 3. É o mesmo arquivo alterado no BUG-004?

**Sim.** Existe **apenas uma** definição de `CreateLeadDto` em todo o monorepo:

```
apps/api/src/modules/leads/dto/lead.dto.ts  →  export class CreateLeadDto
```

O BUG-004 aplicou `@Transform(optionalEmptyValue)` no campo `status` (linhas 135–139). O arquivo compilado em `dist/` reflete a mesma alteração.

---

## 4. Conteúdo do DTO (fonte — campo `status`)

```typescript
@ApiPropertyOptional({ example: 'new', enum: LEAD_STATUSES, default: 'new' })
@Transform(optionalEmptyValue)
@IsOptional()
@IsIn(LEAD_STATUSES)
status?: LeadStatus;
```

Helper `optionalEmptyValue` (`apps/api/src/common/dto/optional-value.util.ts`):

```typescript
export function optionalEmptyValue({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}
```

---

## 5. Conteúdo compilado (dist após `npm run build`)

**Arquivo:** `apps/api/dist/modules/leads/dto/lead.dto.js`

Trecho relevante do decorator de `status`:

```javascript
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'new', enum: exports.LEAD_STATUSES, default: 'new' }),
    (0, class_transformer_1.Transform)(optional_value_util_1.optionalEmptyValue),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.LEAD_STATUSES),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "status", void 0);
```

**Controller compilado** importa o mesmo módulo:

```javascript
const lead_dto_1 = require("./dto/lead.dto");
// ...
__metadata("design:paramtypes", [Object, lead_dto_1.CreateLeadDto])
```

---

## 6. Busca por DTOs duplicados / barrel / build antigo

| Nome procurado | Encontrado? |
|----------------|-------------|
| `CreateLeadDto` | **1 arquivo** — `lead.dto.ts` |
| `LeadCreateDto` | **Não** |
| `CreateLeadRequestDto` | **Não** |
| `create-lead.dto.ts` | **Não** |
| Barrel `dto/index.ts` reexportando DTO antigo | **Não** |
| Outro módulo Nest com POST leads | **Não** |

### Runtime da API

| Modo | Comportamento |
|------|----------------|
| `npm run start:dev` | `nest start --watch` — compila **src/** em memória/webpack; **não usa dist/** |
| `npm run start:prod` | `node dist/main` — usa **dist/** gerado pelo último `nest build` |

Se `start:prod` rodar com build desatualizado, poderia servir DTO antigo. Em dev (`start:dev`), o watch recompila a partir de `src/`.

---

## 7. ValidationPipe global

**Arquivo:** `apps/api/src/main.ts`

Configuração (via `Bug007ValidationPipe` — wrapper temporário):

```typescript
{
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}
```

O Nest infere `metatype: CreateLeadDto` a partir do tipo do parâmetro `@Body() dto: CreateLeadDto` via `emitDecoratorMetadata`.

---

## 8. Testes unitários do DTO (prova estática)

`apps/api/src/modules/leads/dto/lead.dto.spec.ts` — mesmo `ValidationPipe` config:

- `{ name: 'Marina Costa' }` **sem** `status` → **passa**, `result.status === undefined`
- `{ name: '...', status: '' }` → **passa**, status omitido
- `{ name: '...', status: 'all' }` → **rejeita**

Conclusão estática: com o DTO atual, **`status` ausente do JSON não deveria falhar validação**. Se falha em runtime, o payload provavelmente **contém** `status` (valor inválido) ou o processo API não recarregou o código BUG-004.

---

## 9. Logs temporários `[BUG007]` adicionados

### Bootstrap (`main.ts`)

```
[BUG007] CreateLeadDto class=CreateLeadDto file=apps/api/src/modules/leads/dto/lead.dto.ts
[BUG007] LeadsController POST /leads uses CreateLeadDto from ./dto/lead.dto
```

### ValidationPipe (`bug007-validation.pipe.ts`) — **executa ANTES do controller**

Quando `metatype === CreateLeadDto`:

```
[BUG007] ValidationPipe metatype CreateLeadDto
[BUG007] ValidationPipe metatype === CreateLeadDto true
[BUG007] raw body keys [...]
[BUG007] raw dto.status <valor recebido ou undefined>
[BUG007] raw body JSON {...}
```

Se passar:

```
[BUG007] ValidationPipe passed
[BUG007] DTO {...}
[BUG007] dto.status ...
[BUG007] body keys [...]
```

Se falhar:

```
[BUG007] ValidationPipe REJECTED CreateLeadDto ...
[BUG007][validation] statusError=true ...  (exceptionFactory)
```

### Controller (`leads.controller.ts`) — **só se ValidationPipe passou**

```
[BUG007] DTO {...}
[BUG007] dto.status ...
[BUG007] body keys [...]
[BUG007] controller CreateLeadDto === imported class true|false
```

> **Importante:** Se a validação falhar, os logs do **controller NÃO aparecem**. Os logs do **ValidationPipe** provam qual classe foi usada e qual body chegou.

---

## 10. Como reproduzir e identificar a classe instanciada

1. Reiniciar API (`start:dev` ou rebuild + `start:prod`).
2. Confirmar no boot: `[BUG007] CreateLeadDto class=CreateLeadDto`.
3. Enviar POST criar lead (UI ou curl).
4. No terminal API, localizar sequência `[BUG007]`.

| Último log visível | Interpretação |
|--------------------|---------------|
| `raw dto.status` com valor inválido (ex. `""`, `"all"`, `null`) | Payload **contém** status — não é omissão |
| `ValidationPipe REJECTED` | Falha em `CreateLeadDto` — ver `statusError` no warn |
| `ValidationPipe passed` + logs controller | DTO validado; problema está após validação |
| Nenhum log `[BUG007] ValidationPipe` | Request não chegou a POST `/api/v1/leads` ou metatype diferente |

---

## 11. Hipótese para BUG-007 (pré-runtime)

Com o DTO atual e testes passando, **ValidationPipe não deveria validar `status` quando a chave está ausente**. Causas prováveis a confirmar pelos logs:

1. **Payload real inclui `status`** — ex. string vazia de formulário, valor default do frontend, proxy alterando body.
2. **Processo API stale** — `start:prod` com `dist/` antigo sem `@Transform(optionalEmptyValue)`.
3. **Confusão de endpoint** — erro de outro DTO/campo interpretado como `status`.

---

## Arquivos instrumentados (remover após diagnóstico)

- `apps/api/src/common/pipes/bug007-validation.pipe.ts` (novo)
- `apps/api/src/main.ts`
- `apps/api/src/modules/leads/leads.controller.ts`

# Auditoria — Contrato de criação de Leads

**Data:** 2026-07-22  
**Escopo:** LeadDialog → createLead → BFF → API → Prisma

---

## Resumo

O contrato estava **alinhado na maioria dos campos**, com duas fragilidades:

1. **`@IsOptional()` não ignora string vazia** — clientes legados ou forms que enviam `""` falhavam em `email`, `status`, etc.
2. **BFF não repassava `request`** ao `backendFetch` no POST (auth via cookie).

Correções aplicadas **sem alterar regras de negócio**: normalização de opcionais no DTO, builder de payload no frontend, `@HttpCode(201)` explícito, testes de contrato.

---

## Tabela de contrato

| Campo | Front envia | DTO espera | Prisma grava | Correto? |
|-------|-------------|------------|--------------|----------|
| **name** | `string` trim (obrigatório) | `@IsString` `@MaxLength(160)` **obrigatório** | `name String` | ✅ |
| **email** | omitido ou email trim | `@IsOptional` `@IsEmail` | `email String?` | ✅ (fix: `""` → undefined) |
| **phone** | omitido ou string (máscara BR) | `@IsOptional` `@IsString` `@MaxLength(40)` | `phone String?` | ✅ |
| **company** | omitido ou string trim (`empresa`) | `@IsOptional` `@IsString` `@MaxLength(160)` | `company String?` | ✅ |
| **source** | omitido ou string trim (`origem`) | `@IsOptional` `@IsString` `@MaxLength(80)` | `source String?` | ✅ |
| **documentType** | `"cpf"` \| `"cnpj"` se doc informado | `@IsOptional` `@IsIn(['cpf','cnpj'])` | `documentType String?` | ✅ |
| **document** | dígitos (CPF/CNPJ validado no front) | `@IsOptional` `@IsString` — normalizado no service | `document String?` (só dígitos) | ✅ |
| **status** | **omitido** na criação (default backend) | `@IsOptional` `@IsIn(LEAD_STATUSES)` | `status String @default("new")` | ✅ (fix BUG-004) |
| **notes** | omitido ou string trim | `@IsOptional` `@IsString` `@MaxLength(1000)` | `notes String?` | ✅ |
| **assignedTo** | **nome legível** (ex.: sessão `name`) | `@IsOptional` `@IsString` — rótulo, não FK | `assignedTo String?` (rótulo canônico) | ✅ |
| **ownerUserId** | ❌ não enviado | ❌ não no DTO | `owner_user_id String?` (cuid) | ✅ server-side |
| **ownerTeamId** | ❌ não enviado | ❌ não no DTO | `owner_team_id String?` | ✅ server-side |
| **ownerId** | ❌ não existe no contrato | — | — | N/A (usar `ownerUserId`) |
| **responsibleId** | ❌ não existe no contrato | — | — | N/A (usar `assignedTo` + `ownerUserId`) |
| **tenantId** | ❌ não enviado | ❌ não no DTO | do JWT (`user.tenantId`) | ✅ |
| **lastContactAt** | ❌ não enviado | ❌ não no DTO | `now()` no create | ✅ |

### assignedTo — o que é?

| Formato | Aceito no POST? | Uso |
|---------|-----------------|-----|
| Nome legível (`"Ana Costa"`) | ✅ (caso LeadDialog) | Resolvido para `ownerUserId` via `resolveOwnerUserIdFromAssignedTo` |
| E-mail | ✅ | Idem |
| userId (cuid) | ✅ | Idem |
| UUID | ✅ se for o `User.id` | Não é UUID fixo — é **cuid** do Prisma |
| username | ⚠️ só se coincidir com `User.name` | Não há campo username separado |

**Persistência:** `assignedTo` grava o **rótulo canônico** (`User.name` ou email); `ownerUserId` grava o **cuid** do usuário responsável.

---

## Fluxo validado

```
LeadDialog.handleSubmit
  → buildCreateLeadPayload (api.ts)
  → POST /api/leads (BFF, body JSON intacto + auth cookie)
  → POST /api/v1/leads (NestJS + CreateLeadDto + ValidationPipe)
  → LeadsService.createLead (default status, resolve owner, normalize doc)
  → prisma.lead.create
```

---

## Arquivos alterados

- `apps/api/src/common/dto/optional-value.util.ts` — helper `@Transform`
- `apps/api/src/modules/leads/dto/lead.dto.ts` — opcionais normalizados
- `apps/api/src/modules/leads/leads.controller.ts` — `@HttpCode(201)`
- `apps/api/src/modules/leads/dto/lead.dto.spec.ts` — testes DTO
- `apps/api/src/modules/leads/leads.service.spec.ts` — testes Prisma layer
- `apps/api/test/leads-create.e2e-spec.ts` — e2e HTTP 201/400
- `apps/web/lib/data-access/modules/leads/create-lead-payload.ts` — builder contrato
- `apps/web/lib/data-access/modules/leads/create-lead-payload.spec.ts` — testes front
- `apps/web/lib/data-access/modules/leads/api.ts` — usa builder
- `apps/web/app/api/leads/route.ts` — repassa `request` ao backendFetch

---

## Testes

```bash
# DTO + Service
cd apps/api
npx jest src/modules/leads/dto/lead.dto.spec.ts src/modules/leads/leads.service.spec.ts

# E2E HTTP (ValidationPipe + Controller + 201)
npx jest --config ./test/jest-e2e.json test/leads-create.e2e-spec.ts

# Frontend payload
npx vitest run apps/web/lib/data-access/modules/leads/create-lead-payload.spec.ts
```

**Esperado:** HTTP 201, `status: "new"`, `assignedTo` resolvido, sem campos fantasma no JSON.

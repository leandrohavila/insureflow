# Padrões de arquitetura — Backend (NestJS)

> Escopo: `apps/api`. Persistência: Prisma (`packages/database`).

## Estrutura de módulos

```
apps/api/src/
├── main.ts                 # prefix api, URI versioning v1
├── app.module.ts           # guards globais, imports
├── common/
│   ├── decorators/         # @CurrentUser, @Public, @RequirePermissions
│   ├── guards/             # JwtAuthGuard, PermissionsGuard
│   └── interfaces/
├── infrastructure/prisma/  # PrismaModule, PrismaService
└── modules/
    ├── auth/
    ├── leads/
    ├── crm/
    ├── questionnaires/
    ├── customers/
    ├── audit-logs/
    ├── queue/              # BullMQ audit worker
    └── ...
```

**Convenção por feature:**

- `*.module.ts` — imports/exports
- `*.controller.ts` — rotas HTTP, decorators de permissão
- `*.service.ts` — regras de negócio e Prisma
- `dto/*.dto.ts` — class-validator + Swagger

**Prefixo de rota:** `/api/v1/<recurso>` (definido em `main.ts`).

---

## Services

**Responsabilidades:**

- Montar `where` sempre com `tenantId`
- Validar pertencimento antes de update/delete (`findFirst({ id, tenantId })`)
- Transações (`$transaction`) para operações multi-tabela (ex.: conversão de lead)
- Mapear erros Prisma → HTTP (`ConflictException`, `NotFoundException`, `BadRequestException`)

**O que evitar no service:**

- Lógica de apresentação
- Conhecimento de cookies/JWT além do `tenantId` / `userId` recebidos

---

## Padrões Prisma

| Padrão | Uso |
|--------|-----|
| `findFirst({ where: { id, tenantId } })` | Leitura segura multi-tenant |
| `create({ data: { tenantId, ... } })` | Sempre incluir tenant na criação |
| `$transaction([...])` ou callback async | Contagem + lista paginada; conversão lead |
| `include` / `select` tipados com `satisfies Prisma.*Include` | Questionários, CRM com lead convertido |
| Strings para enums de negócio (Lead status, Deal stage) | Validados no DTO, não no schema |
| Enums Prisma | Questionários, TenantStatus |

**Cliente gerado:** `packages/database` → output em `node_modules/.prisma/client`.

**Migrations:** `packages/database/prisma/migrations/`.

---

## Isolamento de tenant

1. JWT contém `tenantId` (`JwtAccessPayload`)
2. Controllers usam `@CurrentUser()` e passam `user.tenantId` ao service
3. Queries nunca usam só `id` sem `tenantId` (exceto tabelas globais: `Permission`)
4. Referências cruzadas (lead em submission) validadas com `ensure*BelongsToTenant`

**Cascade:** `onDelete: Cascade` de `Tenant` para entidades filhas.

**Não implementado:** org units, múltiplos tenants por usuário, admin cross-tenant nestes módulos.

---

## Estratégia de validação

**Camada DTO (class-validator):**

- Tipos, tamanhos máximos, enums via `@IsIn`
- Paginação: `page`, `limit` com defaults

**Camada service (regras de domínio):**

- Questionários: validação de `answers` por tipo de campo; required condicional por `status`
- Templates: apenas `active` aceita submissões
- Conversão: conflito se já convertido

**Swagger:** `@ApiProperty` nos DTOs para documentação OpenAPI (`/api/docs`).

---

## Estratégia de warnings

| Área | Comportamento atual |
|------|---------------------|
| Leads | Sem array `warnings` na resposta |
| Customers | Bloqueio `409` em documento duplicado |
| Questionários | `400` com mensagens de campo em validação |

**Direção aprovada (ADR-003, ADR-005):** respostas `200` + `warnings[]` para duplicidade de lead; bloqueio apenas em invariantes duros (merge inválido, tenant mismatch).

**Não implementado** no código de leads.

---

## Cache e invalidação

- **API stateless** — sem cache Redis de leitura de domínio comercial
- **Redis:** fila BullMQ para auditoria (`AUDIT_QUEUE`)
- Invalidação é responsabilidade do **cliente** (TanStack Query)

---

## Soft delete / arquivamento

| Entidade | Padrão |
|----------|--------|
| `QuestionnaireTemplate` | Archive se tem submissions; senão delete físico |
| `QuestionnaireSubmission` | Status `archived` (sem delete guard) |
| `Deal` | `status: archived` via PATCH |
| `Customer` | `status: archived` |
| `Lead` | Delete físico; status `lost` como descarte comercial |

**Auditoria:** `AuditLog` assíncrono via fila — compliance, não timeline operacional do corretor.

---

## Permissões

**Guard global:** `PermissionsGuard` (após `JwtAuthGuard`).

**Regras:**

- `@RequirePermissions('a', 'b')` → **AND** (todas necessárias)
- `:manage` satisfaz `:view` do mesmo recurso
- `@Public()` bypass

**Exemplo crítico:** `POST leads/:id/convert` → `leads:manage` + `crm:manage`.

---

## Filas e side effects

- `AuditLogsService.enqueue` — fire-and-forget para persistência de auditoria
- Falha na fila logada no worker; não reverte transação principal

---

## BFF (Next.js)

Rotas em `apps/web/app/api/**` proxy para `API_URL/api/v1/**` — mantém cookies e esconde host interno.

---

## Referências

- `apps/api/src/main.ts`
- `apps/api/src/common/guards/permissions.guard.ts`
- `apps/api/src/modules/leads/leads.service.ts`
- `apps/api/src/modules/questionnaires/questionnaires.service.ts`
- `packages/database/prisma/schema.prisma`

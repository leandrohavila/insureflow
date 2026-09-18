# Plano de auditoria — RBAC e Ownership

**Status:** Planejado (Sprint 1b)  
**Implementação:** Sprint 2+ (interceptor + eventos de domínio)

---

## 1. Objetivos

| Objetivo | Pergunta respondida |
|----------|---------------------|
| Rastreabilidade | Quem fez o quê e quando? |
| Compliance | Quem viu dados sensíveis? |
| Ownership | Quem transferiu carteira / compartilhou lead? |
| Segurança | Tentativas de acesso negado (opcional) |

**Modelo existente:** `AuditLog` + fila BullMQ (`AuditLogsService.enqueue`).

---

## 2. Taxonomia de eventos

### 2.1 Formato

```
{domain}.{resource}.{action}
```

Exemplos: `auth.login.success`, `lead.share.created`, `lead.owner.transferred`.

### 2.2 Autenticação e sessão

| action | resource | severity | metadata |
|--------|----------|----------|----------|
| `login.success` | `auth` | info | tenantSlug, roles |
| `login.failure` | `auth` | warning | email (hash parcial), reason |
| `logout` | `auth` | info | — |
| `token.refresh` | `auth` | info | — |

### 2.3 Visualização (read audit) — Sprint 3+

| action | resource | Quando |
|--------|----------|--------|
| `record.viewed` | `lead` / `deal` / `customer` | GET detail (amostragem ou roles sensíveis) |

**Nota:** volume alto — habilitar só para `financeiro`, `leitura`, ou flag tenant.

### 2.4 Mutações CRUD

| action | resource | metadata |
|--------|----------|----------|
| `created` | `lead`, `deal`, … | snapshot mínimo (sem PII completo) |
| `updated` | * | `changedFields[]` |
| `deleted` | * | id, subject/title |

### 2.5 Ownership e compartilhamento

| action | resource | metadata |
|--------|----------|----------|
| `owner.assigned` | `lead` | `fromUserId`, `toUserId`, `toTeamId` |
| `owner.transferred` | `deal` / `customer` | idem |
| `share.created` | `lead` | `sharedWithUserId`, `permission`, `expiresAt` |
| `share.revoked` | `lead` | `sharedWithUserId`, `revokedBy` |
| `team.member.added` | `team` | `userId`, `isLead` |
| `team.member.removed` | `team` | `userId` |

### 2.6 RBAC admin

| action | resource | metadata |
|--------|----------|----------|
| `role.permissions.updated` | `role` | `added[]`, `removed[]` |
| `user.roles.updated` | `user` | `roleIds[]` |
| `user.deactivated` | `user` | — |

### 2.7 Acesso negado (opcional)

| action | resource | severity | metadata |
|--------|----------|----------|----------|
| `access.denied` | `lead` / … | warning | `reason: permission|ownership`, `requiredPermission` |

---

## 3. Quem pode ver auditoria

| Role | `audit.view` | Escopo |
|------|:------------:|--------|
| admin | ✅ | tenant |
| leitura | ✅ | tenant |
| financeiro | ✅ | tenant (subset financeiro futuro) |
| gerencia | 🔶 | só equipe (fase 3) |
| comercial | ❌ | — |
| parceiro | ❌ | — |

---

## 4. Implementação planejada

### 4.1 Interceptor Nest

```typescript
@Audit('lead', 'updated')
@Patch(':id')
updateLead(...) {}
```

- Enfileira após sucesso (não em dry-run).
- Inclui `userId`, `tenantId`, `ip`, `userAgent`, `requestId`.

### 4.2 Eventos explícitos no domínio

Ownership/share **sempre** auditados no service (não só interceptor genérico):

- `LeadsService.shareWithPartner`
- `LeadsService.transferOwnership`

### 4.3 Retenção

| Ambiente | Retenção sugerida |
|----------|-------------------|
| HML | 30 dias |
| Produção | 12–24 meses (config `Tenant.settings.auditRetentionDays`) |

---

## 5. UI (futuro)

- `/configuracoes/auditoria` — filtros: usuário, ação, recurso, data.
- Export CSV — `audit.export` permission.
- Sem PII desnecessário na listagem (mascarar documento).

---

## 6. Referências

- Schema: `AuditLog` em `packages/database/prisma/schema.prisma`
- Service: `apps/api/src/modules/audit-logs/`

# Correção P1 — Empresa Principal Obrigatória

**Data:** 2026-08-30  
**Issue:** Usuários ativos podiam existir sem empresa ou sem `currentBusinessUnitId` válido  
**Status:** Corrigido

---

## Regra de negócio

Todo **usuário ativo** deve possuir:

1. **Pelo menos 1** empresa vinculada (`user_business_units`)
2. **Exatamente 1** empresa principal válida (`currentBusinessUnitId ∈ businessUnitIds`)

Usuários **inativos** podem permanecer sem empresa (legado), mas **não podem ser reativados** sem vínculo e principal consistentes.

---

## Implementação

Utilitário central: `apps/api/src/modules/users/users-business-units.util.ts`

| Função | Responsabilidade |
|--------|------------------|
| `assertAtLeastOneBusinessUnit` | Rejeita lista vazia |
| `resolvePrimaryBusinessUnitId` | Primary ∈ lista; default = `[0]` |
| `assertValidPrimaryForActiveUser` | Valida ativo + primary consistente |
| `extractBusinessUnitIds` | Extrai IDs de memberships |

---

## Endpoints e regras

| Operação | Endpoint | Regra aplicada |
|----------|----------|----------------|
| **CREATE USER** | `POST /users` | `businessUnitIds` obrigatório (`ArrayMinSize(1)`); primary resolvida e gravada |
| **UPDATE USER** | Fluxo de edição → `PUT .../business-units` | Lista vazia bloqueada (= remoção da última empresa) |
| **ACTIVATE USER** | `PATCH /users/:id/status` | Se `isActive: true`, exige memberships + primary válida |
| **SET BUSINESS UNITS** | `PUT /users/:id/business-units` | Lista vazia bloqueada; primary sempre recalculada e consistente |

`PATCH /users/:id` (perfil) não altera empresas; a proteção contra remoção da última empresa ocorre em **setBusinessUnits**.

---

## Consistência de `currentBusinessUnitId`

Após create e setBusinessUnits:

```
currentBusinessUnitId = primaryBusinessUnitId (se ∈ lista)
                       ou businessUnitIds[0]
```

Nunca fica `null` quando há memberships. Primary fora da lista é corrigida automaticamente para a primeira empresa.

---

## DTOs (validação de entrada)

| DTO | Campo | Antes | Depois |
|-----|-------|-------|--------|
| `CreateUserDto` | `businessUnitIds` | Opcional | **Obrigatório**, min 1 |
| `SetUserBusinessUnitsDto` | `businessUnitIds` | Podia ser `[]` | **Min 1** |

Mensagens de erro:

- `"Usuário ativo deve ter ao menos uma empresa vinculada"`
- `"Usuário ativo deve ter uma empresa principal válida"`

---

## UI (web)

`governance-user-form-dialog.tsx`:

- Create: exige ≥ 1 empresa antes de submeter
- Edit: impede salvar com zero empresas (evita remoção da última)

`CreateUserInput.businessUnitIds` passou a ser obrigatório no tipo.

---

## Testes automatizados

```bash
npm run test -w api -- --testPathPatterns=users
```

**Resultado:** 36/36 testes passando (4 suites).

| Arquivo | Cobertura |
|---------|-----------|
| `users-business-units.util.spec.ts` | Regras puras (primary, ativo, lista vazia) |
| `users-business-units.service.spec.ts` | create, setBusinessUnits, activate |
| `users.service.spec.ts` | Regressão P0 + create com BU |
| `users-super-admin-guard.util.spec.ts` | Regressão P0 |

---

## Matriz de cenários

| Cenário | Resultado |
|---------|-----------|
| Criar usuário sem empresa | **400** |
| Criar usuário com 2 empresas + primary válida | OK, `currentBusinessUnitId` = primary |
| Criar usuário com primary inválida | OK, primary = primeira da lista |
| setBusinessUnits com `[]` | **400** |
| Ativar usuário sem BU / sem primary | **400** |
| Ativar usuário com BU + primary consistente | OK |
| Inativar usuário (sem BU) | OK (sem validação de BU) |

---

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `users-business-units.util.ts` | **Novo** |
| `users-business-units.util.spec.ts` | **Novo** |
| `users-business-units.service.spec.ts` | **Novo** |
| `users.service.ts` | Guards em create, setStatus, setBusinessUnits |
| `dto/user.dto.ts` | `ArrayMinSize(1)` em BUs |
| `governance-user-form-dialog.tsx` | Validação client-side |
| `governance/types.ts` | `businessUnitIds` obrigatório no create |

---

## Build

```bash
npm run build -w api → OK
```

---

## Referências

- Gap original: `docs/reports/governance-users-final-audit.md` (item 3 — REPROVADO)
- Correção P0 (super_admin): `docs/reports/fix-super-admin-escalation.md`

---

## Observação — dados legados

Usuários ativos **já existentes** no banco sem empresa não são migrados automaticamente. Tentativas de re-save via UI/API falharão até vínculo ser corrigido manualmente (setBusinessUnits) ou usuário ser inativado.

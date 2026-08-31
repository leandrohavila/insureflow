# Correção P0 — Escalada de Privilégio `super_admin`

**Data:** 2026-08-30  
**Issue:** Admin com `users:manage` podia criar/promover/remover `super_admin`  
**Status:** Corrigido

---

## Problema

A auditoria em `governance-users-final-audit.md` identificou que `validateRoleIds()` aceitava qualquer slug go-live, incluindo `super_admin`, sem verificar se o **ator** tinha privilégio de plataforma.

`users:manage` sozinho **não** é suficiente para operações envolvendo `super_admin`.

---

## Regra implementada

Somente quem satisfaz **pelo menos uma** condição pode gerenciar `super_admin`:

| Condição | Exemplo |
|----------|---------|
| `roles` inclui `super_admin` | Usuário logado é super admin |
| `permissions` inclui `tenants:manage` | Token com permissão de plataforma |

Funções em `apps/api/src/modules/users/users-super-admin-guard.util.ts`:

- `canManageSuperAdmin(actor)` — predicate
- `assertCanManageSuperAdmin(actor)` — lança `403 ForbiddenException`
- `requiresSuperAdminActorForRoleChange({ currentSlugs, nextSlugs })` — detecta promoção, remoção ou edição envolvendo `super_admin`

---

## Endpoints protegidos

| Método | Rota | Guard aplicado |
|--------|------|----------------|
| POST | `/users` | Bloqueia se `roleIds` inclui `super_admin` e actor não qualificado |
| PATCH | `/users/:id` | Bloqueia edição de perfil se **alvo** já possui `super_admin` |
| PUT | `/users/:id/roles` | Bloqueia se alvo tem `super_admin`, ou novo conjunto inclui/remove `super_admin` |
| GET | `/users/assignable-roles` | Oculta `super_admin` na lista para actors não qualificados (defesa em profundidade) |

O controller passa o actor completo (`sub`, `roles`, `permissions`) via `toActor()` em `users.controller.ts`.

---

## Matriz de cenários

| Cenário | Actor | Resultado |
|---------|-------|-----------|
| Criar usuário `operador` | `admin` + `users:manage` | Permitido |
| Criar usuário `super_admin` | `admin` + `users:manage` | **403** |
| Criar usuário `super_admin` | `super_admin` | Permitido |
| Criar usuário `super_admin` | `admin` + `tenants:manage` | Permitido |
| Promover para `super_admin` | `admin` | **403** |
| Remover `super_admin` de usuário | `admin` | **403** |
| Editar roles de usuário `super_admin` | `admin` | **403** |
| Editar perfil (PATCH) de `super_admin` | `admin` | **403** |
| Qualquer operação acima | `super_admin` | Permitido |
| Listar roles atribuíveis | `admin` sem `tenants:manage` | `super_admin` **omitido** |

Mensagem de erro: `"Somente super administradores podem gerenciar o perfil super_admin"`.

---

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `users-super-admin-guard.util.ts` | **Novo** — regras puras de autorização |
| `users-super-admin-guard.util.spec.ts` | **Novo** — 10 testes unitários |
| `users.service.ts` | Guards em create/update/setRoles; filtro em listAssignableRoles |
| `users.controller.ts` | Passa `UserManagementActor` para mutações |
| `users.service.spec.ts` | **Novo** — 12 testes de serviço |

---

## Testes automatizados

```bash
npm run test -w api -- --testPathPatterns=users
```

**Resultado:** 22/22 testes passando (2 suites).

Cobertura principal:

- Unit: `canManageSuperAdmin`, `requiresSuperAdminActorForRoleChange`
- Service: create, setRoles (promover/remover/editar), update, assignable-roles filter

---

## Verificação de build

```bash
npm run build -w api      → OK
npm run check-types -w api → OK
```

---

## Observações

1. **PATCH** protege edição de **dados** de contas `super_admin`; troca de roles continua exclusiva do PUT `/roles`.
2. Endpoints de senha, status e business-units **não** foram alterados neste P0 — escalada era via roles; status/senha de super_admin por admin comum permanece possível (avaliar P1 se necessário).
3. UI herda proteção: `assignable-roles` deixa de expor `super_admin` para admins comuns; tentativas diretas à API retornam 403.

---

## Referência cruzada

- Auditoria original: `docs/reports/governance-users-final-audit.md` (item 2 — REPROVADO)
- Esta correção fecha o gap P0 de escalada horizontal/vertical via role `super_admin`

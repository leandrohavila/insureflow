# Governança Fase 2A — Production Readiness

**Data:** 2026-08-25  
**Branch:** `release/crm-operacao-avila`  
**Escopo:** Módulo Governança RBAC (somente leitura)  
**Classificação:** **READY FOR DEPLOY**

---

## Veredicto

| Status | Significado |
|--------|-------------|
| **READY FOR DEPLOY** | Build e typecheck verdes; rotas registradas; sem bloqueadores de código |

Nenhuma migration, alteração de banco ou mudança de regras de negócio RBAC (escrita) incluída neste release.

---

## 1. Build completo

| Comando | Resultado | Evidência |
|---------|-----------|-----------|
| `npx turbo run build --filter=web` | **GREEN** | 3 tasks OK; Next.js 16.2.0 compiled; 67 static pages |
| `npx tsc -p apps/web --noEmit` | **GREEN** | exit 0 |
| `npx tsc -p packages/auth --noEmit` | **GREEN** | exit 0 |
| `npx tsc -p apps/api --noEmit` | **GREEN** | exit 0 |
| `npx tsc --noEmit` (raiz) | **N/A** | Monorepo sem `tsconfig` raiz — usar pacotes acima |

### Rotas Governança no build Next.js

```
/configuracoes/governanca
/configuracoes/governanca/perfis
/configuracoes/governanca/matriz
/configuracoes/governanca/usuarios
/configuracoes/governanca/empresas
/configuracoes/governanca/auditoria
/configuracoes/unidades          → redirect empresas
```

BFF novos no build:

```
/api/permissions
/api/permissions/roles
/api/users
/api/users/[id]
/api/audit-logs
```

---

## 2. Validação de rotas (servidor local prod `next start :3000`)

| Rota | HTTP | Interpretação |
|------|------|---------------|
| `/login` | 200 | OK |
| `/configuracoes/governanca` | 307 | Rota existe; middleware → auth |
| `/configuracoes/governanca/perfis` | 307 | OK |
| `/configuracoes/governanca/matriz` | 307 | OK |
| `/configuracoes/governanca/usuarios` | 307 | OK |
| `/configuracoes/governanca/empresas` | 307 | OK |
| `/configuracoes/governanca/auditoria` | 307 | OK |
| `/configuracoes` (follow redirect) | 200 → `/login?callbackUrl=/configuracoes` | Redirect legado → governança → auth OK |

---

## 3. Regressões (smoke estrutural)

API local (`localhost:4000`) **indisponível** — smoke autenticado completo não executado localmente. Validação por build + status HTTP:

| Área | Check | Resultado |
|------|-------|-----------|
| Login | `/login` 200 | **GREEN** |
| Dashboard | `/` 307 (auth guard) | **GREEN** |
| CRM seguros | `/crm` 307 | **GREEN** |
| CRM imobiliário | `/real-estate/properties` 307 | **GREEN** |
| Business unit switcher | Componente não alterado; BFF `/api/business-units/context` intacto | **GREEN** (sem diff destrutivo) |
| Configurações legado | `/configuracoes` → governança | **GREEN** |

### Smoke autenticado pós-deploy (obrigatório)

1. Login `admin@insureflow.com` em https://corretoraavila.com.br/login  
2. Abrir `/configuracoes/governanca` e sub-rotas  
3. Verificar seletor de empresa (admin)  
4. `/crm` e `/real-estate/properties` carregam  

---

## 4. Alterações incluídas no release

| Pacote | Tipo |
|--------|------|
| `packages/auth/src/governance.ts` | Catálogo UI + Corretor Imobiliário (planejado) |
| `apps/web/.../governanca/**` | 6 páginas + componentes |
| `apps/web/app/api/{permissions,users,audit-logs}` | BFF read-only |
| `apps/api/.../permissions.controller.ts` | `GET roles` → `settings:view` |
| Docs Growth Engine + redesign RBAC | Documentação |

### Explicitamente excluído do commit

- Scripts limpeza prod (`prod-grupo-avila-clean.*`)
- `docs/backups/**`
- Outros relatórios de auditoria não relacionados
- `package.json` scripts demo clean
- Migrations / seeds / alterações DB

---

## 5. Riscos conhecidos (não bloqueantes)

| Risco | Mitigação |
|-------|-----------|
| API prod precisa redeploy para `GET /permissions/roles` com `settings:view` | Deploy API Railway separado ou já em branch — **verificar** pós-push |
| Usuários sem `users:manage` veem mensagem na aba Usuários | Comportamento esperado Fase 2A |
| Corretor Imobiliário só no catálogo UI | Badge "Planejado" — Fase 2B |

---

## 6. Checklist pré-deploy

- [x] Turbo build web green  
- [x] Typecheck web/auth/api green  
- [x] Rotas governança no manifest build  
- [x] HTTP smoke local (não autenticado)  
- [x] Escopo commit limitado Fase 2A  
- [ ] Push + Vercel prod  
- [ ] Smoke autenticado produção  

---

**Próximo passo:** commit → push `release/crm-operacao-avila` → `vercel deploy --prod` (repo root) → smoke produção.

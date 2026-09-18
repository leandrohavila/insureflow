# Relatório — Redesign Governança RBAC (Fase 2A)

**Data:** 2026-08-25  
**Status:** Implementado (somente leitura)  
**Referência:** Aprovação mockup com ajustes + `docs/reports/rbac-governance-audit.md`

---

## Sumário executivo

Implementado o módulo **Configurações → Governança**, substituindo a aba **Acesso** (tokens técnicos). Fase 2A é **100% somente leitura** na matriz de perfis — **nenhuma alteração no banco de permissões ou roles**.

Incluídos: catálogo de domínios, perfil **Corretor Imobiliário** (planejado no catálogo), separação Grupo Ávila por BU, documentação Growth Engine e preparação arquitetural para **Parceiros**.

---

## 1. Estrutura de navegação entregue

```
Configurações
├── Governança          ← substitui "Acesso"
│   ├── Visão Geral     /configuracoes/governanca
│   ├── Perfis          /configuracoes/governanca/perfis
│   ├── Matriz          /configuracoes/governanca/matriz
│   ├── Usuários        /configuracoes/governanca/usuarios
│   ├── Empresas        /configuracoes/governanca/empresas
│   └── Auditoria       /configuracoes/governanca/auditoria
├── Comunicação
└── Motivos de perda
```

| Rota legada | Destino |
|-------------|---------|
| `/configuracoes` | Redirect → `/configuracoes/governanca` |
| `/configuracoes/unidades` | Redirect → `/configuracoes/governanca/empresas` |

---

## 2. Requisitos vs. entrega

| # | Requisito | Status |
|---|-----------|--------|
| 1 | Substituir aba Acesso | ✅ `PermissionsPanel` removido do fluxo; redirect em `/configuracoes` |
| 2 | Estrutura Governança (6 telas) | ✅ Implementado |
| 3 | Perfil Corretor Imobiliário | ✅ Catálogo `@repo/auth` — **não seedado no DB** (Fase 2B) |
| 4 | Separação Corretora / Imóveis | ✅ Filtros BU + docs + Empresas |
| 5 | Arquitetura Parceiros | ✅ Domínio + doc Growth Engine §9 |
| 6 | Canais → Lead | ✅ `ACQUISITION_CHANNELS` + doc oficial |
| 7 | `grupo-avila-growth-engine.md` | ✅ Criado |
| 8 | Fase 2A somente leitura | ✅ Sem mutations RBAC; API roles GET → `settings:view` |
| 9 | Telas antes de prod estrutural | ✅ Implementação local; **sem deploy prod solicitado** |

---

## 3. Perfil Corretor Imobiliário

**Slug catálogo:** `corretor_imobiliario`  
**Empresa:** Ávila Imóveis (`avila-imoveis`)  
**Escopo dados:** `own`

| Permissão | Incluída |
|-----------|:--------:|
| `dashboard:view` | ✅ |
| `properties:view` | ✅ |
| `properties:manage` | ✅ |
| `leads:view` | ✅ |
| `leads:manage` | ✅ |

Marcado como **`planned: true`** na UI até seed Fase 2B.

---

## 4. Camada de apresentação (domínios)

Arquivo: `packages/auth/src/governance.ts`

| Domínio | Permissões agrupadas |
|---------|---------------------|
| Dashboard | `dashboard:view` |
| CRM | crm, clients, leads, questionnaires |
| Seguros | quotes, policies, claims |
| Comunicação | automation, whatsapp |
| Governança | settings, BU, users, audit |
| Imobiliária | properties |
| Parceiros | leads:share (+ futuro) |

UI exibe **labels de negócio**; chaves técnicas opcionais via toggle.

---

## 5. Arquivos criados / alterados

### Pacote auth

| Arquivo | Alteração |
|---------|-----------|
| `packages/auth/src/governance.ts` | **Novo** — catálogo, perfis, canais, BUs |
| `packages/auth/src/index.ts` | Export governance |

### API (read-only relaxation)

| Arquivo | Alteração |
|---------|-----------|
| `permissions.controller.ts` | `GET /permissions/roles` → `settings:view` (era `users:manage`) |

> Não altera dados do banco — apenas quem pode **ler** a matriz de roles.

### Web — BFF

| Rota BFF | Backend |
|----------|---------|
| `/api/permissions` | `GET /api/v1/permissions` |
| `/api/permissions/roles` | `GET /api/v1/permissions/roles` |
| `/api/users` | `GET /api/v1/users` |
| `/api/users/[id]` | `GET /api/v1/users/:id` |
| `/api/audit-logs` | `GET /api/v1/audit-logs` |

### Web — data-access

`apps/web/lib/data-access/modules/governance/` — hooks read-only

### Web — componentes

| Componente | Função |
|------------|--------|
| `governance-shell.tsx` | Layout Configurações + Governança |
| `governance-subnav.tsx` | Submenu 6 telas |
| `governance-overview.tsx` | Visão geral + canais |
| `governance-profiles.tsx` | Lista/detalhe perfis |
| `governance-matrix.tsx` | Matriz domínio × perfil |
| `governance-users.tsx` | Usuários (requer `users:manage`) |
| `governance-companies.tsx` | Empresas + BU manager |
| `governance-audit.tsx` | Auditoria (requer `audit:view`) |
| `governance-utils.ts` | Merge catálogo + API live |

### Web — páginas

`apps/web/app/(dashboard)/configuracoes/governanca/**`

### Documentação

| Documento |
|-----------|
| `docs/architecture/grupo-avila-growth-engine.md` |
| `docs/reports/rbac-governance-redesign.md` (este arquivo) |

### Mockup atualizado

[rbac-governance-mockup.canvas.tsx](C:\Users\avila\.cursor\projects\c-Projetos-InsureFlow\canvases\rbac-governance-mockup.canvas.tsx) — estrutura final aprovada

---

## 6. Compatibilidade RBAC

| Aspecto | Preservado |
|---------|------------|
| Chaves de permissão | ✅ 29 chaves existentes |
| Login / JWT | ✅ Inalterado |
| Guards API controllers | ✅ Inalterados (exceto leitura roles) |
| `PermissionsGuard` | ✅ Inalterado |
| Seed DB | ✅ Não modificado |
| `PermissionsPanel` | Arquivo mantido; **não referenciado** |

---

## 7. Limitações Fase 2A (conhecidas)

| Item | Fase 2B |
|------|---------|
| Corretor Imobiliário no banco | Seed role + permissions |
| Vínculos user × BU na UI | API `user_business_units` |
| Comparador dedicado | Opcional — matriz cobre uso |
| Edição de perfis | CRUD roles |
| Parceiros / comissões | Módulo completo |
| Membership preview com dados reais | Depende API memberships |

---

## 8. Guards por tela

| Tela | Guard mínimo | Dados live |
|------|--------------|------------|
| Visão Geral | `settings:view` | Session + roles API |
| Perfis | `settings:view` | Roles API + catálogo |
| Matriz | `settings:view` | Roles API + catálogo |
| Usuários | `settings:view` (página); lista requer `users:manage` | Users API |
| Empresas | `settings:view` | Business units API |
| Auditoria | `settings:view` (página); eventos requer `audit:view` | Audit API |

---

## 9. Próximos passos (Fase 2B — não executados)

1. Seed `corretor_imobiliario` em `seed-ownership.ts`  
2. Recriar `user_business_units` em produção para usuários não-admin  
3. API read-only memberships  
4. Remover aliases `sales` / `viewer`  
5. Deploy homologação → validação → produção  

---

## 10. Validação local

```bash
# Typecheck web
npx tsc -p apps/web --noEmit

# Acessar (dev)
/configuracoes/governanca
/configuracoes/governanca/perfis
/configuracoes/governanca/matriz
```

Login recomendado: `admin@insureflow.com` para ver usuários + auditoria + matriz live.

---

*Fase 2A concluída. Nenhuma migration ou alteração de permissões no banco.*

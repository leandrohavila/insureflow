# Sprint 2 — Checklist browser / UI (Fase 8)

**Ambiente:** HML real (Vercel + Railway)  
**Flag API:** `OWNERSHIP_ENFORCEMENT=shadow`  
**Modo shadow:** listagem pode mostrar legado; ownership validado via `/api/auth/me` + logs Railway.

Preencher após cada persona: `[ ]` → `[x]`.

| Campo | Valor |
|-------|--------|
| Data | |
| WEB URL | |
| API URL | |
| Validador | |

---

## Credenciais (seed HML)

| Persona | E-mail | Senha |
|---------|--------|-------|
| Admin | admin@insureflow.com | Admin@2026! |
| Gerência | gerencia@insureflow.com | Gerencia@2026! |
| Comercial | comercial@insureflow.com | Comercial@2026! |
| Parceiro | parceiro@insureflow.com | Parceiro@2026! |

---

## V4 — Admin (`dataScope=tenant`)

- [ ] Login OK
- [ ] DevTools → Application → session / `GET /api/auth/me` → `dataScope: "tenant"`
- [ ] Menu leads/CRM visível conforme permissões
- [ ] Filtro **"Meus leads" oculto**
- [ ] Lista leads carrega (shadow: pode ver todos do tenant)
- [ ] Abrir detalhe de lead qualquer → 200
- [ ] Botões criar/editar visíveis (`leads:manage`)
- [ ] Logout → login outra persona

**Notas / screenshot:**

---

## V3 — Gerência (`dataScope=team`)

- [ ] Login OK
- [ ] `/api/auth/me` → `dataScope: "team"`, `teamIds` não vazio
- [ ] Filtro **"Meus leads" visível**
- [ ] Lista leads (equipe em shadow)
- [ ] Não vê menus sem permissão (ex.: financeiro restrito se aplicável)
- [ ] PermissionGate: ações CRM conforme role

**Notas:**

---

## V2 — Comercial (`dataScope=own`)

- [ ] Login OK
- [ ] `/api/auth/me` → `dataScope: "own"`
- [ ] **"Meus leads" visível** e funcional
- [ ] Lista próprios leads
- [ ] Criar lead → sucesso; verificar `ownerUserId` na API (Network)
- [ ] Editar lead próprio → OK
- [ ] PermissionGate oculta ações sem permissão

**Notas:**

---

## V1 — Parceiro (`dataScope=shared`)

- [ ] Login OK
- [ ] `/api/auth/me` → `dataScope: "shared"`
- [ ] **"Meus leads" oculto**
- [ ] Menu: **sem** pipeline/clientes/financeiro (só o permitido)
- [ ] Lista leads (shadow: pode mostrar legado — anotar)
- [ ] Lead **com** LeadShare → detalhe OK
- [ ] Lead **sem** share → anotar comportamento (shadow: 200 + log denied)

**Notas:**

---

## UX multiusuário

- [ ] Login comercial → logout → login parceiro (sem cache cruzado)
- [ ] Dados da lista mudam entre personas
- [ ] Sem erro 401 inesperado após refresh

---

## Segurança (browser + API)

- [ ] `GET /api/v1/leads` sem cookie/token → 401
- [ ] Usuário sem `leads:view` → 403 ou redirect `/unauthorized`
- [ ] URL direta `/leads?lead=<id>` — comportamento documentado
- [ ] Produção: confirmar app prod **sem** `dataScope` no login

---

## Shadow (Railway logs)

- [ ] Admin/comercial/gerência: **sem** warn `legacy≠ownership` (ou mínimo)
- [ ] Parceiro: divergência `shared` documentada como esperada em shadow
- [ ] Sem `denied` indevido em leads próprios do comercial

---

## Decisão

| | Marcar |
|---|--------|
| Browser aprovado para sign-off | [ ] |
| Pendências bloqueantes | |

**Pendências:**

1. 
2. 

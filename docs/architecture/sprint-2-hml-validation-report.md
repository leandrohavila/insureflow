# Sprint 2 — Relatório de validação HML (Fase 5)

**Branch:** `feature/rbac-ownership-foundations`  
**Ambiente validado:** Neon **dev cloud** (`APP_ENV=development`) + API local `:4001` com `OWNERSHIP_ENFORCEMENT=shadow`  
**Produção:** `OWNERSHIP_ENFORCEMENT=off` — confirmado (JWT **sem** `dataScope` em `api.corretoraavila.com.br`)  
**Enforcement `on`:** **bloqueado** até deploy HML Railway/Vercel + sign-off manual browser

| Campo | Valor |
|-------|--------|
| Data | 2026-05-28 |
| Responsável | Validação automatizada + revisão pendente (browser) |
| PR | https://github.com/leandrohavila/insureflow/compare/develop...feature/rbac-ownership-foundations |
| API URL HML (alvo) | `insureflow-api-dev.up.railway.app` — **404 Application not found** |
| Web URL HML (alvo) | `insureflow-web-dev.vercel.app` — **DEPLOYMENT_NOT_FOUND** |
| API usada nesta rodada | `http://localhost:4001` (branch local + Neon dev) |
| Commit | `feature/rbac-ownership-foundations` @ `0930c12+` |
| Flag validação | `OWNERSHIP_ENFORCEMENT=shadow` |
| Flag produção | `off` (login prod sem `dataScope`) |
| Script | `pnpm hml:sprint2:validate` — **0 issues** |

---

## 1. Banco de dados (Neon dev — **não** produção)

| Etapa | OK | Notas |
|-------|----|-------|
| `prisma migrate deploy` | [x] | `20260527120000_ownership_foundations` aplicada |
| `pnpm db:seed` + ownership | [x] | Personas V1–V4 criadas; `LeadShare` demo |
| `SEED_DEV_DATA=1` | [x] | 4 leads, deals, customers (cenário rico) |
| Backfill dry-run | [x] | Ver JSON abaixo |
| Backfill `--execute` | [x] | 3 leads atualizados; 1 já tinha `ownerUserId` |

### Backfill dry-run (pós seed dev)

```json
{
  "mode": "dry-run",
  "tenants": [
    {
      "slug": "insureflow",
      "total": 4,
      "updated": 3,
      "alreadySet": 1,
      "unmatched": 0,
      "orphaned": 0
    }
  ]
}
```

### Backfill execute

```json
{
  "mode": "execute",
  "tenants": [
    {
      "slug": "insureflow",
      "total": 4,
      "updated": 3,
      "alreadySet": 1,
      "unmatched": 0,
      "orphaned": 0
    }
  ]
}
```

### Métricas backfill

| Métrica | Valor |
|---------|-------|
| Total leads | 4 |
| Já com `ownerUserId` | 1 |
| Atualizados (execute) | 3 |
| Unmatched `assignedTo` | 0 |
| Órfãos (sem assignedTo) | 0 |

**Tenant settings:** seed define `ownershipEnforcement: shadow` quando ausente.

---

## 2. Shadow logs (`[ownership:shadow]`)

Período: 2026-05-28 — API local shadow + Neon dev

| # | Persona | Scope | legacy | ownership | intersection | Nota |
|---|---------|-------|--------|-----------|--------------|------|
| 1 | Gerência | team | 4 | 1 | 1 | 3 leads com `ownerUserId` de sales, não da equipe comercial |
| 2 | Comercial | own | 4 | 1 | 1 | Esperado até backfill atribuir owners ao comercial |
| 3 | Parceiro | shared | 4 | 1 | 1 | Lista legado 4; ownership 1 (`LeadShare`) |
| 4 | Gerência | team | — | — | — | `denied` lead `cmpotwd6w...` (sem owner na equipe) |
| 5 | Comercial | own | — | — | — | `denied` mesmo lead (owner sales) |
| 6 | Parceiro | shared | — | — | — | `denied` lead não compartilhado |

Exemplo de log:

```text
[ownership:shadow] tenant=... user=... scope=team legacy=4 ownership=1 intersection=1
[ownership:shadow] denied lead=cmpotwd6w0020kw10p0nk9waa user=... scope=shared
```

### Resumo divergências

| Tipo | Qtd | Severidade | Plano correção |
|------|-----|------------|----------------|
| legacy > ownership (lista) | 3 personas | **Esperado em shadow** | Após backfill completo + owners corretos, re-testar; com `on`, lista filtra |
| Leads dev com owner = sales user | 3 | Média | Reassign `ownerUserId` ao comercial ou rodar backfill pós-correção `assignedTo` |
| `denied` em lead sem share/owner | 3 logs | Baixa | Comportamento correto do modelo |
| ownerUserId vazio | 0 | — | — |
| shared incorreto | 0 | — | 1 LeadShare demo OK |

---

## 3. Personas — API automatizada (shadow)

> Lista HTTP retorna **legado** (4 leads). Ownership calculado em paralelo (1 lead visível para comercial/gerência/parceiro).

### V1 — Parceiro

| Cenário | Esperado | Observado | OK |
|---------|----------|-----------|-----|
| Login | `dataScope=shared` | shared | [x] |
| GET /leads | 200 (legado 4) | total=4 | [x] |
| GET /leads sem token | 401 | 401 | [x] |
| Shadow | ownership=1 | logado | [x] |

### V2 — Comercial

| Cenário | Esperado | Observado | OK |
|---------|----------|-----------|-----|
| Login | `dataScope=own` | own | [x] |
| GET /leads | 200 | total=4 (shadow) | [x] |
| 401 sem token | 401 | 401 | [x] |

### V3 — Gerência

| Cenário | Esperado | Observado | OK |
|---------|----------|-----------|-----|
| Login | `dataScope=team` | team | [x] |
| teamIds | não vazio | `cmpotqqjm...` | [x] |
| GET /leads | 200 | total=4 (shadow) | [x] |

### V4 — Admin

| Cenário | Esperado | Observado | OK |
|---------|----------|-----------|-----|
| Login | `dataScope=tenant` | tenant | [x] |
| GET /leads | 200 | total=4 | [x] |

---

## 4. Frontend

| Item | OK | Notas |
|------|----|-------|
| PermissionGate | [ ] | **Pendente** — Web HML offline |
| "Meus leads" por escopo | [ ] | Pendente browser |
| BFF `/api/auth/me` + dataScope | [ ] | Pendente deploy Vercel |
| UX multiusuário | [ ] | Pendente |

---

## 5. Segurança

| Teste | OK | Notas |
|-------|----|-------|
| GET /leads sem token → 401 | [x] | Todas personas |
| Produção sem `dataScope` | [x] | Sprint 2 **não** deployada em prod |
| Isolamento tenant | [x] | Não testado cross-tenant (sem 2º tenant) |
| 403 sem permissão | [ ] | Pendente (ex.: role sem `leads:view`) |
| URL direta lead (shadow) | [x] | 200 + log `denied` quando fora do escopo |

---

## 6. Regressão

| Módulo | Sem ownership filter | OK |
|--------|------------------------|-----|
| Deals | [ ] | Pendente smoke HML |
| Customers | [ ] | Pendente |
| Policies | [ ] | Pendente |
| `assignedTo` preservado | [x] | Backfill não remove campo |

---

## 7. Bloqueadores para sign-off

1. **Deploy HML:** Railway `insureflow-api-dev` e Vercel preview **inexistentes** — redeploy branch + `OWNERSHIP_ENFORCEMENT=shadow`.
2. **Validação browser:** menus, PermissionGate, troca de sessão.
3. **Dados dev:** 3 leads com `ownerUserId` do usuário `sales` — alinhar owners ao comercial antes de `on`.
4. **PR:** abrir manualmente no GitHub (link acima).

---

## 8. Decisão

| Opção | Marcar |
|-------|--------|
| Aprovado para `on` em HML piloto | [ ] |
| Reprovado — correções necessárias | [ ] |
| **Aprovado parcial — shadow contínuo** | [x] |

### Plano de correção

1. Redeploy `feature/rbac-ownership-foundations` no Railway/Vercel HML.
2. Reassign owners dos 3 leads dev para `comercial@` (ou rerodar seed com `assignedTo` = nome comercial).
3. Preencher seção 4–6 após smoke browser.
4. Monitorar shadow ≥ 48h em HML antes de `on`.

### Readiness enforcement futuro

- [x] Migration + seed + backfill Neon dev
- [x] JWT `dataScope` / `teamIds` (API Sprint 2)
- [x] Shadow logs funcionando
- [ ] Deploy HML online
- [ ] V1–V4 browser
- [ ] Divergências abaixo do limiar após correção de owners
- [ ] Sign-off produto/ops

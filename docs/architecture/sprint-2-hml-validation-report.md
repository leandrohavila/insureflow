# Sprint 2 — Relatório de validação (Fase 7 — estabilização local)

**Branch:** `feature/rbac-ownership-foundations`  
**Ambiente:** Neon dev (`APP_ENV=development`) + API local `:4001` · `OWNERSHIP_ENFORCEMENT=shadow`  
**Produção:** `off` confirmado — login em `api.corretoraavila.com.br` **sem** `dataScope`  
**Enforcement `on`:** **proibido** até sign-off browser + HML deploy

| Campo | Valor |
|-------|--------|
| Data | 2026-05-28 (Fase 7) |
| API validação | `http://localhost:4001` |
| Script | `npm run hml:sprint2:validate` → **0 issues** |
| PR | https://github.com/leandrohavila/insureflow/compare/develop...feature/rbac-ownership-foundations |

---

## Resumo executivo

| Área | Status |
|------|--------|
| Ownership alinhado (4/4 leads) | OK |
| Backfill dry-run | 4 `alreadySet`, 0 unmatched |
| JWT `dataScope` / `teamIds` | OK (V1–V4) |
| Shadow — admin / comercial / gerência | **Convergido** (sem warns) |
| Shadow — parceiro (`shared`) | Divergência **esperada** (legacy 4 vs ownership 2) |
| Produção protegida | OK |
| Browser / PermissionGate | **Pendente** (checklist §4) |
| HML Railway/Vercel | **Pendente** deploy branch |

---

## 1. Ownership — antes / depois

### Antes (Fase 5 — leads desalinhados)

| Métrica | Valor |
|---------|-------|
| Leads com `ownerUserId` = sales (incorreto) | 3 |
| Shadow comercial/gerência | `legacy=4` `ownership=1` |
| `denied` em detalhe | frequente |

### Depois (Fase 7 — `npm run hml:sprint2:align-owners`)

| Lead | `assignedTo` | `ownerUserId` | `ownerTeamId` |
|------|--------------|---------------|---------------|
| Lead demo compartilhado | Bruno Comercial | comercial | equipe-comercial |
| Marina Oliveira | Bruno Comercial | comercial | equipe-comercial |
| Carlos Mendes | Bruno Comercial | comercial | equipe-comercial |
| Patricia Rocha | Bruno Comercial | comercial | equipe-comercial |

| Métrica | Valor |
|---------|-------|
| Leads atualizados no align | 0 (idempotente) / 3 na 1ª execução |
| `ownerUserId` vazio | 0 |
| `LeadShare` demo | 1 lead → parceiro |

### Backfill dry-run (pós-alinhamento)

```json
{
  "mode": "dry-run",
  "tenants": [{
    "slug": "insureflow",
    "total": 4,
    "updated": 0,
    "alreadySet": 4,
    "unmatched": 0,
    "orphaned": 0
  }]
}
```

**Conclusão:** `assignedTo` e `ownerUserId` coerentes para comercial + equipe.

---

## 2. Shadow logs — antes / depois

### Antes (ownership desalinhado)

```text
scope=team   legacy=4 ownership=1 intersection=1
scope=own    legacy=4 ownership=1 intersection=1
scope=shared legacy=4 ownership=1 intersection=1
[ownership:shadow] denied lead=... (vários)
```

### Depois (Fase 7 — `hml:sprint2:validate`)

| Persona | Scope | Logs shadow |
|---------|-------|-------------|
| Admin | tenant | **Nenhum** (legacy = ownership = 4) |
| Gerência | team | **Nenhum** |
| Comercial | own | **Nenhum** |
| Parceiro | shared | `legacy=4 ownership=2 intersection=2` |

Único warn registrado:

```text
[ownership:shadow] scope=shared legacy=4 ownership=2 intersection=2
```

**Interpretação:** em `shadow`, a **lista HTTP** ainda usa filtro legado (4 leads). O modelo `shared` vê 2 leads compartilhados (possível 2 `LeadShare` ativos ou critério de share ampliado). Com `on`, a lista do parceiro mostrará só compartilhados — divergência de contagem em shadow é **aceitável** para parceiro.

**Denied indevidos:** eliminados para comercial/gerência após alinhamento.

---

## 3. Validação automatizada (API)

`npm run hml:sprint2:validate` — **2026-05-28** — **0 falhas**

| Persona | `dataScope` | `teamIds` | GET /leads | 401 sem token |
|---------|-------------|-----------|------------|---------------|
| V4 Admin | tenant | — | 4 | OK |
| V3 Gerência | team | 1 equipe | 4 | OK |
| V2 Comercial | own | — | 4 | OK |
| V1 Parceiro | shared | — | 4 (legado) | OK |

---

## 4. Frontend / browser (pendente sign-off)

Checklist manual — executar com `npm run dev` (web) + API local:

| Persona | Login | Meus leads | PermissionGate |
|---------|-------|------------|----------------|
| Admin | admin@insureflow.com | oculto | menus completos |
| Gerência | gerencia@insureflow.com | visível | equipe |
| Comercial | comercial@insureflow.com | visível | leads:manage |
| Parceiro | parceiro@insureflow.com | oculto | só leads:view |

Validar: `/api/auth/me` com `dataScope`, troca de sessão, URL direta lead.

---

## 5. Segurança

| Teste | OK |
|-------|-----|
| GET /leads sem token → 401 | [x] |
| Produção sem `dataScope` | [x] |
| `OWNERSHIP_ENFORCEMENT=on` não usado | [x] |
| 403 sem `leads:view` | [ ] pendente |
| Cross-tenant | [ ] sem 2º tenant |

---

## 6. Divergências restantes

| Item | Severidade | Ação |
|------|------------|------|
| Parceiro shadow `legacy≠ownership` | Baixa | Esperado em shadow; validar com `on` só em HML piloto |
| Browser não validado | Média | Fase 7 manual |
| HML deploy offline | Alta | Redeploy branch + `shadow` |
| 2 leads em `ownership` para parceiro | Info | Revisar `LeadShare` duplicados no seed |

---

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| `.env.local` sobrescrevia Neon | `APP_ENV=development` + ordem env na API corrigida |
| Ativar `on` cedo demais | Manter `shadow` até sign-off |
| Prod com branch antiga | Prod sem `dataScope` — OK |
| Seed-dev com `assignedTo` = userId sales | Script `hml:sprint2:align-owners` pós-seed |

---

## 8. Readiness

### Sprint 2 (ownership leads)

| Critério | Status |
|----------|--------|
| Migration + seed | OK |
| Ownership alinhado | OK |
| Shadow estável (own/team/tenant) | OK |
| Parceiro shared documentado | OK |
| API validate 0 issues | OK |
| Browser | Pendente |
| HML online | Pendente |

### Sprint 3 (próxima — sugerido)

- Enforcement `on` em HML piloto (após browser + deploy)
- Estender ownership a **deals** (não nesta sprint)
- UI admin roles / LeadShare
- Auditoria RBAC (plano em `rbac-audit-plan.md`)

**Não iniciar features novas** até browser + HML sign-off.

---

## 9. Decisão

| Opção | Marcar |
|-------|--------|
| Shadow contínuo em dev/HML | [x] |
| Pronto para HML deploy + browser | [ ] |
| Pronto para `on` em HML | [ ] |
| Pronto para produção | [ ] |

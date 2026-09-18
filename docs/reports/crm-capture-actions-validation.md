# Validação final — CrmCaptureActions

**Data:** 2026-08-31 (revalidado 19:30 BRT)  
**Commit da implementação:** `a381d91` — `fix(ux): share CrmCaptureActions on Dashboard, Leads and Pipeline`  
**Deploy:** **não realizado**

---

## 1. Permissões

| CTA | Permissão | Isolamento |
|-----|-----------|------------|
| + Lead Seguro | `leads:manage` (`useCanManage("leads:view")`) | Independente de `crm:manage` |
| + Lead Imobiliário | `leads:manage` | Independente de `crm:manage` |
| + Novo Negócio | `crm:manage` (`useCanManage("crm:view")`) | Independente de `leads:manage` |

`resolveCrmCaptureVisibility`:

| canManageLeads | canManageCrm | Resultado |
|----------------|--------------|-----------|
| sim | sim | os três CTAs |
| sim | não | só os dois leads |
| não | sim | só + Novo Negócio |
| não | não | grupo oculto |

Testes: `node --test --experimental-strip-types apps/web/lib/crm/crm-capture-visibility.spec.ts apps/web/lib/crm/crm-create-navigation.spec.ts` → **6/6 pass**.

Nenhum `PermissionGate` envolve o trio. `Importar` tem gate próprio e não controla os CTAs de captura.

---

## 2. Rotas (browser local, perfil Comercial)

| Rota | CTAs | Ação |
|------|------|------|
| `/` | + Lead Seguro · + Lead Imobiliário · + Novo Negócio | Links. Deal → `/crm/negocios?create=deal` |
| `/leads` | Importar + os três CTAs | + Lead Seguro abre **Novo lead seguro** |
| `/crm/negocios` | Importar + os três CTAs | + Novo Negócio abre **Novo negócio** |

Prints:

- `docs/reports/crm-capture-actions/01-dashboard.png`
- `docs/reports/crm-capture-actions/02-leads.png`
- `docs/reports/crm-capture-actions/03-pipeline.png`

---

## 3. Smoke

`node scripts/local-capture-smoke.cjs` (localhost):

```
[OK] Health — 200
[OK] Health DB — 200
[OK] Login API — 201
[OK] GET /api/v1/leads — total=24
[OK] GET /api/v1/crm/deals — 200
[OK] BFF login — status=200 cookies=3
[OK] WEB / — 200
[OK] WEB /leads — 200
[OK] WEB /crm/negocios — 200
9/9 local capture smoke OK
```

---

## 4. Arquivos da implementação (`a381d91`)

| Arquivo | Papel |
|---------|--------|
| `apps/web/components/crm/crm-capture-actions.tsx` | Componente compartilhado |
| `apps/web/lib/crm/crm-capture-visibility.ts` | Matriz de permissão isolada |
| `apps/web/lib/crm/crm-capture-visibility.spec.ts` | Testes da matriz |
| `apps/web/lib/crm/crm-create-navigation.ts` | Hrefs canônicos |
| `apps/web/lib/crm/crm-create-navigation.spec.ts` | Contratos dos hrefs |
| `apps/web/components/dashboard/dashboard-home.tsx` | Usa `CrmCaptureActions` |
| `apps/web/components/leads/leads-page.tsx` | Header + deep link `?create=` |
| `apps/web/components/crm/deals-page.tsx` | Pipeline usa `CrmCaptureActions` |
| `apps/web/components/crm/crm-page-header-actions.tsx` | `flex-wrap` no grupo primary |
| `apps/web/components/leads/lead-create-menu.tsx` | Empty state (dois leads) |
| `scripts/local-capture-smoke.cjs` | Smoke localhost das três rotas |
| `docs/reports/crm-capture-actions-rca.md` | RCA |
| `docs/reports/crm-capture-actions/*.png` | Prints |

---

## 5. Pronto para deploy?

Validação local **OK**. **Deploy não executado** — aguardando aprovação deste relatório.

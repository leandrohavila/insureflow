# WEB-002 — Deploy Frontend Produção

**Data:** 2026-08-24  
**Objetivo:** Publicar em produção exatamente o frontend homologado no localhost  
**Restrição:** deploy e auditoria apenas — **nenhum código alterado, commit ou migration**

---

## Classificação final

# NOT READY — deploy não executado; artefato homologado não está no commit publicável

| Fase | Status |
|------|--------|
| Fase 1 — Auditoria branch/Vercel/domínio | **Concluída** |
| Fase 2 — Commit contém CRM-IMOB-001 / UX-002 / BU | **Falhou** (escopo principal só local, não commitado) |
| Fase 3 — Deploy produção | **Bloqueada** (Vercel CLI sem credenciais) |
| Fase 4 — Smoke test produção | **Concluída** (build antigo confirmado) |
| Fase 5 — Localhost vs produção | **Divergência crítica** |
| Fase 6 — Relatório | **Este documento** |

---

## Fase 1 — Auditoria

### Branch e commit

| Item | Valor |
|------|--------|
| Branch atual | `release/crm-operacao-avila` |
| HEAD local | `88049114c8b5f8c4da38d9c284bdd1163d7f54ba` (`8804911`) |
| HEAD `origin/release/crm-operacao-avila` | `8804911` (sincronizado) |
| Mensagem | `infra: fix api docker build for release` |
| Working tree | **30 paths** alterados/não rastreados em `apps/web` (inclui CRM-IMOB-001 e UX-002) |

### Projeto Vercel

| Item | Evidência |
|------|-----------|
| Projeto documentado | `web` ([`docs/infra/go-live-production.md`](../infra/go-live-production.md)) |
| Root Directory | `apps/web` |
| Build | `cd ../.. && npx turbo run build --filter=web` ([`apps/web/vercel.json`](../../apps/web/vercel.json)) |
| Região | `gru1` |
| CLI local | `npx vercel whoami` → **Logged out** |
| `VERCEL_TOKEN` | **Ausente** no ambiente |
| `.vercel/` linkado | **Não** |
| CI GitHub → Vercel | **Não** — [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) só roda CI em `main`/`develop`; branch release **sem** workflow de deploy |

### Domínio `corretoraavila.com.br`

| Item | Evidência |
|------|-----------|
| Edge | `Server: Vercel` |
| URL canônica | `https://corretoraavila.com.br` |
| Redirect www | Configurado em `apps/web/vercel.json` (308 → apex) |
| Rota imobiliária | `GET /real-estate/properties` → **307** (rota inexistente no build atual) |

---

## Fase 2 — Conteúdo do commit vs homologação localhost

Homologação HML-001 e smoke local referem-se ao **working tree local**, não ao commit `8804911`.

| Entrega | No commit `8804911` | No localhost homologado |
|---------|---------------------|-------------------------|
| **UX-002** (Grupo Ávila, navy/gold, logo) | **Não** — ex.: `components/branding/grupo-avila-logo.tsx` **não existe em HEAD** | **Sim** — `avila-brand.css`, `public/branding/`, sidebar/header/login |
| **CRM-IMOB-001** (rotas `/real-estate/*`, dashboard imob.) | **Não** — `app/(dashboard)/real-estate/` **untracked** | **Sim** — properties, leads, owners, portal, visits |
| **Business Units** (switcher + contexto) | **Parcial** — `business-unit-switcher.tsx` presente desde `47702a5`; menu contextual imobiliário (`realEstateNav`, `use-operational-nav`) **só no working tree** | **Sim** — combobox Empresa ativa + menu Imóveis/Proprietários/Leads/Portal |

### Arquivos críticos **não commitados** (amostra)

```
?? apps/web/app/(dashboard)/real-estate/
?? apps/web/app/avila-brand.css
?? apps/web/components/branding/
?? apps/web/components/real-estate/
?? apps/web/lib/real-estate/
?? apps/web/lib/navigation/          (use-operational-nav)
?? apps/web/lib/business-units/nav-context.ts
?? apps/web/app/api/properties/
?? apps/web/app/api/persons/
```

### Conclusão Fase 2

**Impossível publicar “exatamente o localhost homologado” via deploy Git do commit atual.**  
Seria necessário, fora do escopo WEB-002:

1. Commit + push do working tree, **ou**
2. `vercel deploy --prod` a partir do diretório local (inclui arquivos não commitados) — ainda exige autenticação Vercel.

---

## Fase 3 — Deploy produção

### Tentativa executada

```text
cd apps/web && npx vercel deploy --prod --yes
→ Error: No existing credentials found. Run vercel login ...
```

### Bloqueios

1. **Vercel CLI deslogada** (mesmo bloqueio documentado em [WEB-001](web001-vercel-redeploy.md))
2. **`VERCEL_TOKEN` ausente**
3. **`gh` CLI ausente** — impossível disparar deploy via GitHub API nesta máquina
4. **Artefato incorreto** — mesmo com credenciais, deploy de `8804911` **não** inclui CRM-IMOB-001 / UX-002

### Resultado

| Item | Status |
|------|--------|
| Redeploy Vercel produção | **Não executado** |
| Domínio atualizado | **Não** |
| Build ID / deployment URL novo | **N/A** |

---

## Fase 4 — Smoke test produção

Ambiente: `https://corretoraavila.com.br` (sessão admin já autenticada no browser de auditoria).

| Check | Esperado (pós-deploy homologado) | Produção atual |
|-------|----------------------------------|----------------|
| Login | Grupo Ávila, split layout | **InsureFlow** — build antigo |
| Dashboard | Dashboard Imobiliário (BU imob.) | Dashboard seguros **mock** (2.847 / 186 / 1.902) |
| Branding Grupo Ávila | Logo navy/gold, “Powered by InsureFlow” | **InsureFlow Enterprise** — sem Grupo Ávila |
| BU selector | Combobox Empresa ativa | **Ausente** |
| CRM Imobiliário (menu) | Imóveis, Proprietários, Leads Imob., Portal | **Ausente** — menu seguros clássico |
| `/real-estate/properties` | Grid imóveis | **307** — rota não publicada |
| Proprietários / Leads / Portal | Páginas CRM imob. | **Não disponíveis** |

### API (contexto smoke)

| Endpoint | Produção |
|----------|----------|
| `GET api.corretoraavila.com.br/api/v1/health` | 200 |
| `GET .../public/properties?tenantSlug=insureflow&businessUnitSlug=avila-imoveis` | **404** |

---

## Fase 5 — Localhost vs produção

| Aspecto | Localhost (`:3000`, working tree) | Produção (`corretoraavila.com.br`) | Alinhado? |
|---------|-----------------------------------|-------------------------------------|-----------|
| Título app | Grupo Ávila | InsureFlow | **Não** |
| Login branding | Grupo Ávila + Powered by | InsureFlow Enterprise | **Não** |
| Dashboard `/` | Dashboard Imobiliário (BU Ávila Imóveis) | Dashboard mock seguros | **Não** |
| Menu sidebar | Imóveis, Proprietários, Leads Imob., Portal | CRM, Clientes, Leads, … | **Não** |
| BU switcher | Sim | Não | **Não** |
| `/real-estate/properties` | 200 | 307 / inexistente | **Não** |
| `/real-estate/leads` | 200 | N/A | **Não** |
| `/real-estate/portal` | 200 | N/A | **Não** |
| Componentes UX-002 | Presentes | Ausentes | **Não** |
| Componentes CRM-IMOB-001 | Presentes | Ausentes | **Não** |

**Conclusão:** produção **não reflete** o frontend homologado no localhost.

---

## Fase 6 — Ações necessárias (fora do escopo WEB-002; não executadas)

Para atingir o objetivo WEB-002:

1. **Versionar** o working tree homologado (commit + push para branch conectada ao Vercel), **sem** alterar funcionalidade — apenas empacotar o que já foi homologado.
2. **Autenticar Vercel:** `vercel login` ou exportar `VERCEL_TOKEN` com escopo deploy no projeto `web`.
3. **Redeploy produção** a partir do commit correto ou `vercel deploy --prod` no `apps/web` local.
4. **Reexecutar smoke** (login, BU, dashboard imob., rotas `/real-estate/*`, branding).
5. Opcional: alinhar API produção (inventário público 404) — escopo API, não front.

---

## Referências cruzadas

| Documento | Relevância |
|-----------|------------|
| [WEB-001](web001-vercel-redeploy.md) | Bloqueio Vercel CLI — mesmo estado |
| [HML-001](hml001-crm-imobiliario.md) | Homologação localhost READY WITH WARNINGS; produção NOT READY |
| [UX-002](ux002-implementation.md) | Escopo visual Grupo Ávila |
| [CRM-IMOB-001](crm-imob-001.md) | Escopo CRM imobiliário |

---

## Assinatura

| Campo | Valor |
|-------|-------|
| **Ticket** | WEB-002 |
| **Classificação** | **NOT READY** |
| **Deploy executado** | Não |
| **Código alterado** | Não |
| **Produção alinhada ao localhost** | Não |

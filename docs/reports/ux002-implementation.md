# UX-002 — Implementação visual Grupo Ávila

**Data:** 24 de agosto de 2026  
**Base:** proposta aprovada UX-001A  
**Escopo:** camada visual `apps/web` — **sem** alteração de APIs, banco, permissões ou regras de negócio  
**Classificação:** **READY FOR REVIEW**

---

## Resumo executivo

Identidade **InsureFlow Enterprise** substituída por **Grupo Ávila** no chrome operacional (sidebar, header, login, metadata). Paleta navy/ouro aplicada via tokens CSS tenant-scoped. Assinatura **Powered by InsureFlow** adicionada na sidebar e no login. Seletor de empresa (Business Unit) e navegação **inalterados** em comportamento.

---

## Tokens utilizados

| Token | Hex | Uso |
|-------|-----|-----|
| `--avila-navy-950` | `#000C24` | Sidebar, background dark, login brand panel |
| `--avila-navy-900` | `#10294B` | Cards dark, botões light, nav hover |
| `--avila-gold-600` | `#C09048` | Accent dark primary, badges, ícones ativos |
| `--avila-gold-400` | `#DEAE5D` | Hover gold, ring focus, avatar fallback |
| `--avila-ivory` | `#F6F1E8` | Background light, placa logo |
| `--avila-paper` | `#FFFCFA` | Cards light |

**Arquivo principal:** `apps/web/app/avila-brand.css` (importado após `@repo/ui/styles/insureflow.css` em `globals.css`).

### Dark mode (oficial)

| Superfície | Valor |
|------------|--------|
| Background | `#000C24` |
| Cards | `#10294B` |
| Primary / accent | `#C09048` |

### Light mode

| Superfície | Valor |
|------------|--------|
| Background | `#F6F1E8` |
| Cards | `#FFFCFA` |
| Primary | `#10294B` |
| Sidebar | `#000C24` (fixo) |

---

## Componentes alterados

| Componente | Arquivo | Alteração |
|------------|---------|-----------|
| Tokens tenant | `apps/web/app/avila-brand.css` | **Novo** — overrides navy/gold, utilities `.avila-sidebar`, `.avila-topbar` |
| Globals | `apps/web/app/globals.css` | Import `avila-brand.css` |
| Logo | `apps/web/components/branding/grupo-avila-logo.tsx` | **Novo** — logo oficial PNG |
| Assinatura | `apps/web/components/branding/powered-by-insureflow.tsx` | **Novo** |
| Asset | `apps/web/public/branding/grupo-avila-logo.png` | Logo oficial (cópia UX-001A) |
| Sidebar | `apps/web/components/dashboard/app-sidebar.tsx` | Logo, “Grupo Ávila”, nav gold filete, Powered by |
| Header | `apps/web/components/dashboard/app-topbar.tsx` | Avatar/badge/IA gold, topbar class |
| BU switcher | `apps/web/components/dashboard/business-unit-switcher.tsx` | Estilo gold (comportamento igual) |
| Breadcrumbs | `apps/web/components/dashboard/use-dashboard-breadcrumbs.ts` | Raiz “Grupo Ávila” |
| Shell | `apps/web/components/dashboard/dashboard-shell.tsx` | Remoção blobs azuis animados |
| Topbar CSS | `apps/web/lib/layout/operational-shell.ts` | `glass-topbar` → `avila-topbar` |
| Login form | `apps/web/components/auth/login-form.tsx` | Layout split-friendly, navy/gold, Powered by |
| Auth layout | `apps/web/app/(auth)/layout.tsx` | Split navy + form marfim, unidades Ávila |
| Busca | `apps/web/components/crm/workspace-search.tsx` | Focus ring gold |
| Dashboard KPIs | `apps/web/components/dashboard/dashboard-summary.tsx` | Borda card gold sutil |
| Metadata | `apps/web/app/layout.tsx` | Title “Grupo Ávila” |
| Sessão UI | `apps/web/lib/auth/session.ts` | `title: "Grupo Ávila"` |

**Não alterados:** rotas, hooks de KPI, APIs, Prisma, RBAC, itens de navegação, lógica BU switcher.

---

## Fases entregues

| Fase | Status | Notas |
|------|--------|-------|
| 1 — Branding global | ✅ | Grupo Ávila + Powered by; multiempresa preservada |
| 2 — Sidebar | ✅ | Navy, logo, gold active, Powered by |
| 3 — Header | ✅ | BU, busca, avatar, ações — visual only |
| 4 — Login | ✅ | Split layout, unidades, autenticação intacta |
| 5 — Dashboard | ✅ | Via tokens + cards (queries inalteradas) |
| 6 — Dark mode | ✅ | `#000C24` / `#10294B` / `#C09048` |
| 7 — Light mode | ✅ | Tokens `:root` + sidebar navy fixa |
| 8 — Screenshots | ⚠️ Parcial | Login capturado localmente |
| 9 — Documentação | ✅ | Este relatório |

---

## Screenshots

Capturados em `http://localhost:3000/login` (Next.js dev, 24/08/2026):

| Tela | Desktop 1440px | Mobile 390px |
|------|----------------|--------------|
| Login | [login-desktop-1440.png](./ux002-screenshots/login-desktop-1440.png) | [login-mobile-390.png](./ux002-screenshots/login-mobile-390.png) |

**Dashboard / Sidebar / Header (pós-login):** requerem sessão API local ativa. Repetir após `npm run dev` na raiz (API + web) com credenciais demo:

```text
admin@insureflow.com / Admin@2026!
```

Viewport sugerido: DevTools → 1440×900 (desktop) e 390×844 (mobile). Rotas: `/`, sidebar visível, header no topo.

---

## Validação manual sugerida

- [ ] Login split exibe logo + Ávila Corretora / Ávila Imóveis + Powered by
- [ ] Sidebar navy com logo em placa marfim e item ativo com filete gold
- [ ] Breadcrumb inicia em “Grupo Ávila”
- [ ] Dark: fundo `#000C24`, cards `#10294B`
- [ ] Light: alternar `html` class para `light` (ThemeProvider) — canvas marfim, sidebar navy
- [ ] BU switcher continua funcionando
- [ ] KPIs do dashboard iguais aos valores API (sem mock)

---

## Referências

- [UX-001A — Proposta](../ux/ux001-branding-grupo-avila.md)
- [Design system docs](../ux/design-system/)
- [Mockups HTML](../ux/mockups/ux001/index.html)

---

## Classificação final

# READY FOR REVIEW

Implementação visual concluída no escopo UX-002. Screenshots pós-login pendentes de ambiente API local para captura automatizada completa.

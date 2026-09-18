# UX-001A — Consolidação visual Grupo Ávila

**Classificação:** # READY FOR APPROVAL  
**Status:** Proposta documental — **não implementar sem aprovação**  
**Data:** 24 de agosto de 2026  
**Escopo:** CRM Corretora · CRM Imobiliário · Portal Imobiliário  
**Fora de escopo:** alteração de código, componentes, build ou deploy  
**Logo oficial:** [`mockups/ux001/assets/grupo-avila-logo.png`](mockups/ux001/assets/grupo-avila-logo.png)  
**Mockups interativos:** [`mockups/ux001/index.html`](mockups/ux001/index.html)  
**Design system (docs):** [`design-system/`](design-system/)

Este documento consolida auditoria, identidade, design system e mockups **antes** de qualquer sprint de implementação.

---

## Índice de fases

| Fase | Conteúdo | Seção |
|------|----------|-------|
| 1 | Auditoria visual (CRM, portal, login, dashboard, sidebar, header) | §1 |
| 2 | Identidade visual (marca mãe, submarcas, Powered by) | §2 |
| 3 | Design system (cores, tipo, espaçamentos) | §3 + [`design-system/`](design-system/) |
| 4 | Mockups CRM Corretora | §4 + mockups HTML |
| 5 | Mockups CRM Imobiliário | §5 + mockups HTML |
| 6 | Mockups Portal Imobiliário | §6 + mockups HTML |
| 7 | Dark mode | §7 |
| 8 | Light mode | §8 |
| 9 | Entrega e decisão | §9–§15 |

---

## FASE 1 — Auditoria visual

### 1.1 CRM atual (`apps/web`)

| Superfície | Arquivo(s) | Estado visual | Problemas |
|------------|------------|---------------|-----------|
| **Login** | `login-form.tsx`, `(auth)/layout.tsx` | Card glass central, Shield Lucide, gradiente azul | Marca InsureFlow, não Ávila; contas demo visíveis; tagline “enterprise” |
| **Dashboard** | `dashboard-home.tsx`, `dashboard-shell.tsx` | KPI row + pipeline + prioridades; blobs `bg-primary/10` | Breadcrumb “InsureFlow”; produção ainda serve mock legado (AUD-001) |
| **Sidebar** | `app-sidebar.tsx` | Glass escuro, glow azul no item ativo, 16rem | Texto “InsureFlow Enterprise”; Shield no lugar da logo |
| **Header** | `app-topbar.tsx` | 48–56px, busca workspace, BU switcher, IA/notificações | Breadcrumb raiz “InsureFlow”; badge notificação hardcoded “3” |
| **CRM** | `crm-shell.tsx`, `crm-operational.css` | Tabs módulo, kanban, tabelas densas 14px | Paleta azul + rainbow stages; sem identidade Ávila |

**Primária atual:** `oklch(0.62 0.17 252)` (azul SaaS). **Tipografia:** Geist Sans 15px. **Modo:** dark default.

### 1.2 Portal imobiliário atual (`apps/portal-imobiliario-publico`)

| Superfície | Arquivo(s) | Estado visual | Problemas |
|------------|------------|---------------|-----------|
| **Header** | `site-header.tsx` | Texto “Ávila Imóveis”, links Home/Imóveis | Sem logo; verde `#14532d` desconectado da marca |
| **Home / listagem / detalhe** | `page.tsx`, `imoveis/page.tsx`, `[slug]/page.tsx` | Layout funcional, max-w-5xl, cards simples | Sem hero fotográfico; sem galeria; loading textual |
| **Filtros** | `property-filters.tsx` | `<select>` nativo, 7 campos | Visual técnico, não vitrine premium |
| **Tema** | `globals.css` | Light-only, pedra quente `#f7f5f2` | Não compartilha tokens com CRM; shadcn “new-york” vs CRM “base-nova” |

### 1.3 Inconsistências transversais

| # | Inconsistência | Impacto |
|---|----------------|---------|
| 1 | CRM = InsureFlow azul · Portal = verde floresta | Visitante não reconhece o mesmo grupo |
| 2 | Shield genérico vs logo oficial navy/ouro | Perda de confiança patrimonial |
| 3 | “Enterprise” e glow azul vs personalidade Ávila | Tom startup/SaaS, não premium finance |
| 4 | Sidebar glass variável vs sidebar navy fixa proposta | Marca não ancora a navegação |
| 5 | Breadcrumb “InsureFlow” vs domínio `corretoraavila.com.br` | Desalinhamento operacional |
| 6 | CRM 14px vs dashboard 15px | Escala tipográfica inconsistente |
| 7 | Portal sem `@repo/ui` | Duplicação e divergência de componentes |
| 8 | Light tokens existem no CRM mas app força dark | Light mode não validado com marca |

### 1.4 Oportunidades de branding Grupo Ávila

- Sidebar navy permanente com logo oficial sobre placa marfim  
- Switcher Corretora \| Imóveis como segmento de holding  
- Portal editorial light com Playfair + fotografia de imóvel  
- KPIs e pipeline em navy → ouro (referência BTG/XP)  
- “Powered by InsureFlow” discreto — plataforma, não herói  
- Customer 360 e Pipeline como vitrines de dados premium  

---

## FASE 2 — Identidade visual

### 2.1 Hierarquia de marca

```
Grupo Ávila          ← marca mãe (holding)
 ├─ Ávila Corretora  ← seguros · CRM BU insurance
 ├─ Ávila Imóveis    ← imobiliário · CRM BU real estate
 ├─ Ávila Soluções   ← serviços transversais (futuro · mesma paleta)
 └─ Portal Imóveis   ← vitrine pública
InsureFlow           ← assinatura: Powered by InsureFlow
```

### 2.2 Logo oficial

Arquivo: [`mockups/ux001/assets/grupo-avila-logo.png`](mockups/ux001/assets/grupo-avila-logo.png) (1254×1254).

- **Não redesenhar** wordmark, chave ou telhados  
- **Dark mode:** logo sempre sobre **placa marfim** (sem reverse fabricado)  
- **Favicon:** recorte do símbolo — solicitar aprovação na implementação  

### 2.3 Assinatura InsureFlow

| Onde | Formato |
|------|---------|
| Sidebar CRM (acima do avatar) | `Powered by InsureFlow` · 10px · 45% opacity |
| Login (rodapé do form) | 11px muted |
| Portal (rodapé legal) | 10px opcional |
| Header, favicon, OG | **Não** |

---

## FASE 3 — Design system

Documentação completa em [`design-system/`](design-system/):

| Arquivo | Conteúdo |
|---------|----------|
| [`colors.md`](design-system/colors.md) | Primary Navy, Primary Gold, backgrounds, success/warning/danger |
| [`typography.md`](design-system/typography.md) | Desktop/mobile CRM e portal |
| [`spacing.md`](design-system/spacing.md) | Sidebar, header, cards, dashboard |
| [`tokens-reference.css`](design-system/tokens-reference.css) | Variáveis CSS de referência (não importadas) |

---

## FASE 4 — CRM Corretora (mockups)

**Tema:** Premium Finance (BTG · XP Empresas · HubSpot Enterprise)

| Tela | Mockup HTML | Notas |
|------|-------------|-------|
| Login | §4 index.html | Split navy/marfim, logo completa |
| Dashboard | §5 index.html | KPIs carteira, pipeline navy→ouro |
| CRM Visão geral | §4b index.html | Tabs módulo, métricas workspace |
| Customer 360 | §4c index.html | Header cliente, abas, timeline, apólices |
| Pipeline | §4d index.html | Kanban colunas navy, cards compactos |

---

## FASE 5 — CRM Imobiliário (mockups)

| Tela | Mockup HTML | Notas |
|------|-------------|-------|
| Dashboard | §6 index.html | Estoque, leads portal, visitas |
| Cadastro imóvel | §5b index.html | Form multi-step, foto capa, publicação |
| Proprietários | §5c index.html | Lista + vínculo imóveis |
| Leads imobiliários | §5d index.html | Origem portal, status visita |
| Agenda de visitas | §5e index.html | Calendário semanal + slots |
| Portal management | §5f index.html | Toggle publicado, preview link |

---

## FASE 6 — Portal imobiliário (mockups)

| Tela | Desktop | Mobile |
|------|---------|--------|
| Home | §7 index.html | §7 mobile |
| Busca | §6b index.html | §6b mobile |
| Listagem | §6c index.html | — |
| Detalhe imóvel | §6d index.html | §6d mobile |

---

## FASE 7 — Dark mode

| Superfície | Tratamento |
|------------|------------|
| Sidebar | Navy-950 **fixo** (não muda com tema) |
| Canvas CRM | Navy-950 |
| Cards | Navy-900, borda 8% marfim |
| Primária ação | Ouro-400 (botões, foco) |
| Logo | Placa marfim 8–12px padding |
| Portal | **Sem dark v1** — fotografia exige light |

Mockup: §8 index.html (dashboard Corretora dark).

---

## FASE 8 — Light mode

| Superfície | Tratamento |
|------------|------------|
| Sidebar | Navy-950 **fixo** (contraste marca) |
| Canvas CRM | Marfim `#F6F1E8` |
| Cards | Paper `#FFFCFA`, sombra `--shadow-if-sm` |
| Primária ação | Navy-900 |
| Login | Split navy + marfim (primeira impressão da logo) |
| Portal | Ivory/paper (padrão) |

Mockup: §5 CRM Corretora dashboard (light canvas) + §8b index.html (light explícito).

---

## FASE 9 — Entrega

| Entregável | Caminho | Status |
|------------|---------|--------|
| Documento principal | `docs/ux/ux001-branding-grupo-avila.md` | ✅ |
| Mockups HTML | `docs/ux/mockups/ux001/index.html` | ✅ |
| Logo oficial | `docs/ux/mockups/ux001/assets/grupo-avila-logo.png` | ✅ |
| Screenshots | `docs/ux/mockups/ux001/screenshots/` | ✅ |
| Design system | `docs/ux/design-system/` | ✅ |

**Classificação:** **READY FOR APPROVAL** — aguardando decisão §15.

---

## 1. Diagnóstico detalhado — o que existe hoje

### 1.1 InsureFlow (CRM)

O CRM nasceu como **produto de plataforma**, não como marca do cliente.

| Camada | Estado atual |
|--------|----------------|
| Nome na UI | “InsureFlow” + subtítulo “Enterprise” |
| Símbolo | Ícone genérico `Shield` (Lucide), não a marca Ávila |
| Primária | Azul SaaS `oklch(0.48 0.14 252)` ≈ azul médio |
| Fundo | Dark-first (`html.dark`, `defaultTheme="dark"`) |
| Tipografia | Geist Sans + Geist Mono |
| Sidebar | Glass escuro, item ativo com glow azul, rail de 16rem |
| Header | Compacto (48px), breadcrumbs “InsureFlow / …”, busca, switcher de BU, atalho “IA” |
| Login | Card glass central, shield + “InsureFlow”, contas demo |
| Densidade | Operacional e compacta (grid 4px, `--if-radius-lg`) — **manter** |
| Tokens | Arquitetura `--if-*` + shadcn — **manter a estrutura**, trocar valores |

Referências de código (somente leitura): `packages/ui/src/styles/insureflow.css`, `apps/web/components/dashboard/app-sidebar.tsx`, `apps/web/components/dashboard/app-topbar.tsx`, `apps/web/components/auth/login-form.tsx`.

### 1.2 Portal Imobiliário

Protótipo funcional, **sem identidade de marca**.

| Camada | Estado atual |
|--------|----------------|
| Nome | Texto “Ávila Imóveis” |
| Logo | Ausente |
| Primária | Verde floresta `#14532d` (desconectado do CRM e da logo) |
| Fundo | Pedra quente `#f7f5f2` |
| Tipografia | Sistema / Tailwind default |
| Header | 56px, só texto + Home / Imóveis |
| Tom | Catálogo técnico, não vitrine imobiliária |

O portal e o CRM **não compartilham paleta, tipo nem hierarquia de marca**. O visitante não reconhece o mesmo grupo que o corretor vê no CRM.

### 1.3 Marca Grupo Ávila (fonte oficial)

Arquivo utilizado: logo oficial da **Imobiliária Ávila / Grupo Ávila** (PNG 1254×1254).

Leitura da marca:

- **Símbolo:** chave ouro (cabeça em trevo / visor quadriculado) sobre dois telhados navy, arco-base ouro.
- **Wordmark:** “AVILA” em serifa de alto contraste (Didot/Bodoni), navy, com swoosh ouro atravessando A–L.
- **Suporte:** “GRUPO” acima e “IMÓVEIS” abaixo, caps ouro, sans condensada.
- **Tagline:** “CONECTANDO PESSOAS AOS MELHORES IMÓVEIS”.
- **Personalidade:** confiança patrimonial, premium discreto, tradicional com execução contemporânea. **Não** é startup, **não** é insurtech neon.

Cores extraídas do arquivo (amostragem do PNG):

| Papel | Hex | Ocorrência |
|-------|-----|------------|
| Navy profundo (wordmark / telhados) | `#000C24` | dominante |
| Navy | `#0C183C` | volumes |
| Navy médio | `#0C2448` | telhado claro |
| Ouro principal | `#C09048` | “GRUPO”, “IMÓVEIS”, chave |
| Ouro claro (highlight da chave) | `#DEAE5D` | metal |
| Ouro profundo (swoosh / sombra) | `#7F5209` | traço do wordmark |
| Marfim residual | `#F0F0E4` / `#F0E4D8` | papel da arte |

### 1.4 Conflito central

Hoje o software **veste InsureFlow**. A operação **é Grupo Ávila**.

O azul SaaS, o shield e o nome “Enterprise” competem com a logo navy/ouro e diluem as duas unidades (Corretora e Imóveis) num produto genérico. A proposta inverte essa hierarquia: **Ávila na frente, InsureFlow no rodapé**.

---

## 2. Direção da identidade

Uma família, três superfícies, um motor.

```
Grupo Ávila          marca-mãe (holding)
 ├─ Ávila Corretora  unidade seguros     → CRM (BU INSURANCE)
 ├─ Ávila Imóveis    unidade imobiliária → CRM (BU REAL_ESTATE)
 ├─ Ávila Soluções   serviços / backoffice (futuro — reservado na hierarquia)
 └─ Portal Imóveis   vitrine pública     → apps/portal-imobiliario-publico
InsureFlow           plataforma (crédito técnico, nunca marca do cliente)
```

**Princípios**

1. A logo oficial **não se redesenha**. Não se recria o wordmark em CSS. Não se substitui a chave por um ícone Lucide.
2. Navy é a cor de autoridade; ouro é o acento de valor. Azul InsureFlow sai da UI do tenant Ávila.
3. CRM permanece **ferramenta densa**. Portal torna-se **marca e vitrine**. Não copiar o visual do portal para dentro do CRM.
4. Light e dark existem nos CRMs. O portal é **light-first** (fotografia de imóvel).
5. InsureFlow aparece só como “Powered by”, em peso tipográfico menor que qualquer lockup Ávila.

---

## 3. Proposta por produto

### 3.1 CRM Corretora (Ávila Corretora)

**Papel:** mesa do corretor de seguros — carteira, apólices, sinistros, cotações, WhatsApp.

**Tom:** confiança, precisão, calma operacional. Navy no cromado; ouro só em ênfase (item ativo, CTA primário, KPI positivo).

**Chrome**

- Sidebar navy permanente (os dois temas), logo oficial sobre placa marfim.
- Wordmark de produto: **Ávila Corretora** (não “InsureFlow”).
- Linha de contexto: `Corretora · Seguros`.
- Primária de botão: navy. Ouro reservado a destaque (ativo, badge “prioridade”, sparkline).
- Módulos visíveis: Dashboard, CRM, Clientes, Leads, Cotações, Propostas, Apólices, Sinistros, WhatsApp, Automação.

**O que não muda:** densidade, PageContainer, tabelas, kanban, warning-first, RBAC. Só a pele.

### 3.2 CRM Imobiliário (Ávila Imóveis)

**Papel:** mesa do consultor imobiliário — estoque, publicações, visitas, leads do portal.

**Tom:** o mesmo sistema visual, com ouro um passo mais presente (capa de imóvel, preço, “publicado”).

**Chrome**

- Mesma sidebar navy e os mesmos tokens.
- Wordmark: **Ávila Imóveis**.
- Linha de contexto: `Imóveis · Cuiabá`.
- Nav específica da BU: Dashboard, Imóveis, Leads do portal, Visitas, Clientes, CRM, WhatsApp.
- Cards de imóvel no CRM usam foto + faixa navy + preço em ouro profundo — eco do portal, em densidade de ferramenta.

**Diferenciação sem segundo design system:** um token `--brand-accent` compartilhado; a BU só troca lockup, nav e ênfase de ouro (mais frequente na vitrine interna).

### 3.3 Portal Imobiliário (público)

**Papel:** site da Ávila Imóveis. Primeiro contato do comprador/locatário.

**Tom:** editorial, fotográfico, premium acessível. Sem glass, sem glow, sem “enterprise”.

**Chrome**

- Header branco/marfim, logo oficial completa (não recorte).
- Nav: Imóveis · Comprar · Alugar · Anunciar interesse / Fale conosco.
- CTA ouro (`#C09048`) sobre navy ou navy sólido com texto marfim — nunca verde atual.
- Home: herói com foto de imóvel + overlay navy 55% + wordmark + busca.
- Listagem: cards claros, preço ouro profundo, chips navy.
- Footer: endereço/contato + **não** exibir InsureFlow no header; crédito mínimo no rodapé legal, se desejado.

---

## 4. Paleta

Tokens **propostos** (ainda não existem no CSS). Hex extraído da logo; OKLCH para encaixe futuro em `--if-*`.

### 4.1 Núcleo de marca (os dois CRMs + portal)

| Token proposto | Hex | OKLCH (aprox.) | Uso |
|----------------|-----|----------------|-----|
| `--avila-navy-950` | `#000C24` | `oklch(0.17 0.05 260)` | sidebar, login brand panel, texto máximo |
| `--avila-navy-900` | `#0C183C` | `oklch(0.23 0.06 264)` | header dark, cards dark |
| `--avila-navy-800` | `#0C2448` | `oklch(0.28 0.07 252)` | hover sidebar, chips |
| `--avila-gold-600` | `#C09048` | `oklch(0.70 0.11 78)` | CTA portal, ícone ativo, filete |
| `--avila-gold-400` | `#DEAE5D` | `oklch(0.79 0.12 80)` | hover ouro, highlight dark mode |
| `--avila-gold-800` | `#7F5209` | `oklch(0.48 0.12 70)` | preço, texto ouro sobre marfim |
| `--avila-ivory` | `#F6F1E8` | `oklch(0.96 0.015 90)` | fundo light, placa da logo |
| `--avila-paper` | `#FFFCFA` | `oklch(0.99 0.005 90)` | cards light |
| `--avila-ink` | `#0C183C` | — | texto light mode |

### 4.2 Semântica operacional (herdada, recolorida)

Manter os papéis atuais (`success`, `warning`, `destructive`, `info`). Recalibrar para conviver com navy/ouro:

| Papel | Light | Dark | Nota |
|-------|-------|------|------|
| Success | `#2F6B4F` | `#5FA882` | menos “fintech neon” |
| Warning | `#C09048` (ouro) | `#DEAE5D` | ouro assume alerta médio |
| Destructive | `#9B2C2C` | `#E07070` | não usar ouro para erro |
| Info | `#0C2448` | `#8BA3C7` | navy, não azul InsureFlow |
| Primary (CRM) | `#0C183C` | `#DEAE5D` | dark: ouro como primária de ação |
| Primary (Portal) | `#C09048` | — | portal sem dark de produto |

### 4.3 Mapa InsureFlow → Ávila (quando for implementar)

| Token hoje | Light proposto | Dark proposto |
|------------|----------------|---------------|
| `--primary` | navy-900 | gold-400 |
| `--ring` | navy-800 | gold-400 |
| `--sidebar` | navy-950 | navy-950 |
| `--sidebar-primary` | gold-600 | gold-400 |
| `--background` | ivory | navy-950 |
| `--card` | paper | navy-900 |
| `--insure-glow` | **remover** no tenant Ávila | **remover** |

Azul `hue 252` permanece apenas no **tema de plataforma InsureFlow** (se um dia houver tenant white-label). No tenant Ávila, hue de marca = **78 (ouro)** + **260 (navy)**.

### 4.4 Regras de uso

- Máximo **um** plano ouro contínuo por tela (CTA ou item ativo), nunca botão ouro + gráfico ouro + badge ouro juntos.
- Não usar gradiente metálico da chave em botões. Ouro de UI é **chapado** `#C09048` / `#DEAE5D`.
- Contraste texto navy sobre ouro: usar navy-950, não cinza.
- Contraste texto sobre navy: marfim ou ouro-400, nunca cinza médio (`muted` atual falha em navy).

---

## 5. Tipografia

A serifa da logo é **marca**, não fonte de interface. Nunca simular “AVILA” com Playfair/Didot no CRM.

| Papel | Família | Peso | Onde |
|-------|---------|------|------|
| Marca | Arquivo da logo (PNG/SVG futuro) | — | sidebar, login, header do portal |
| Display portal | **Playfair Display** (web, próximo da Didot da logo) | 500–700 | H1 da home, título do imóvel |
| UI CRM | **Geist Sans** (já no produto) | 400–600 | tudo operacional |
| UI portal body | **Source Sans 3** | 400–600 | textos longos, formulário de interesse |
| Meta / caps | Geist / Source Sans | 500, tracking 0.12–0.16em | “CORRETORA”, labels de sidebar |
| Código / IDs | Geist Mono | 400 | nº apólice, protocolos |

**Escala CRM (manter)**  
Body 15px (`--if-text-base: 0.9375rem`). Títulos de página `text-xl/2xl`. Não aumentar densidade só porque a marca é “premium”.

**Escala portal (nova)**  
H1 2.25–2.75rem Playfair. Card title 1.125rem. Preço 1.25rem gold-800.

---

## 6. Sidebar

**Constante nos dois CRMs, nos dois temas:** fundo `--avila-navy-950`. Isso ancora a marca mesmo com canvas claro.

```
┌─────────────────────┐
│ [placa marfim]      │  logo oficial (altura 36–40px)
│  Ávila Corretora    │  15px semibold marfim
│  CORRETORA · SEGUROS│  10px caps ouro-600 tracking
├─────────────────────┤
│ NAVEGAÇÃO           │
│ ● Dashboard         │  ativo: filete ouro 2px + texto marfim
│   CRM               │  hover: navy-800
│   …                 │
├─────────────────────┤
│ Powered by          │  10px, 45% opacity
│ InsureFlow          │  nunca maior que o lockup Ávila
├─────────────────────┤
│ Avatar  Administrador│
└─────────────────────┘
```

**Colapsada (ícone):** só a placa da logo (símbolo da chave visível). Sem shield.

**Ativo:** abandonar o glow azul e o `layoutId` pill com gradiente primary. Substituir por filete ouro à esquerda (2px) + fundo navy-800.

**Mobile CRM:** drawer navy a partir do `SidebarTrigger` já existente. Mesma hierarquia. Sem bottom-nav nesta proposta (mudança de IA; fora do rebrand).

---

## 7. Header

Altura atual (~48–56px) **permanece**. Conteúdo muda.

| Zona | Hoje | Proposto |
|------|------|----------|
| Esquerda | Trigger + breadcrumbs “InsureFlow / Dashboard” | Trigger + **switcher de unidade** (Corretora \| Imóveis) como segmento navy/ouro |
| Centro | Busca workspace | Busca (placeholder específico: “Buscar apólice, cliente…” vs “Buscar imóvel, lead…”) |
| Direita | IA · notificações · avatar | Igual, ícone IA em ouro-400; avatar com anel navy |

Breadcrumbs deixam de começar em “InsureFlow”. Raiz = nome da unidade ativa.

Portal (público): header **não** replica o do CRM. Logo à esquerda, nav textual, CTA “Falar com consultor”. Sem busca global de workspace, sem IA.

---

## 8. Login

Uma tela de tenant **Grupo Ávila**, não de produto InsureFlow.

**Desktop (split 42 / 58)**

- Esquerda: navy-950, logo oficial centrada (completa, com tagline), frase “Acesso ao workspace do Grupo Ávila”.
- Direita: marfim, formulário. Título “Entrar”. Primário navy. Sem contas demo em produção (manter só em HML, visualmente secundário).
- Rodapé do form: `Powered by InsureFlow` 11px muted.

**Mobile:** empilhar. Logo em faixa navy 160px + form marfim.

**Dark login:** painel único navy-950, card navy-900, primário ouro-400, logo em placa marfim (a arte oficial é navy-sobre-branco; **não** inverter a logo sem arquivo oficial de reverse).

**Proibido no login Ávila:** shield Lucide, “Enterprise”, “text-gradient-brand” azul, glow `oklch(...252)`.

---

## 9. Dashboard

Mesma malha operacional (KPI row + pipeline + prioridades + agenda). Recoloração:

| Peça | Corretora | Imobiliário |
|------|-----------|-------------|
| KPI valor | navy-900 / marfim | igual |
| KPI delta + | success | success |
| CTA primário | navy “+ Novo negócio” | navy “+ Novo imóvel” |
| Pipeline bar | navy → slate → gold (não rainbow atual) | igual, estágios: Captação · Visita · Proposta · Contrato |
| Prioridades | destructive / gold-800 / success | igual |
| Widget extra | Indicadores de seguros | Estoque publicado · leads do portal · visitas do dia |

**Light:** canvas ivory, cards paper, sombra `--shadow-if-sm` atual.  
**Dark:** canvas navy-950, cards navy-900, borda 8% marfim. Sem blobs animados `bg-primary/10` no shell ( competem com a marca).

---

## 10. Dark mode e Light mode

| Superfície | Light | Dark | Padrão |
|------------|-------|------|--------|
| CRM Corretora | canvas ivory + sidebar navy | canvas navy + sidebar navy | Dark (operação noturna já habituada) |
| CRM Imobiliário | igual | igual | Dark |
| Portal | ivory / paper | **não na v1** | Light |
| Login | split navy + ivory | navy + card navy-900 | Light (primeira impressão da logo) |

**Regra de logo no dark:** sempre apoiar a arte oficial numa **placa marfim** 8–12px de padding, radius 8px. Não gerar reverse falso (chave branca, etc.) até existir arquivo oficial.

**Toggle:** permanece no produto (ThemeProvider). Troca só os tokens; a sidebar navy não some no light.

---

## 11. Estratégia de branding

### 11.1 Grupo Ávila

- Dono da identidade. Logo oficial completa (GRUPO + AVILA + IMÓVEIS + tagline) em **login**, **documentos** e **momentos de holding**.
- No CRM, após o login, o lockup **encurta**: símbolo + “Ávila” + unidade.

### 11.2 Ávila Corretora

- Unidade de seguros. Não precisa de logo nova nesta proposta.
- Lockup de produto: símbolo oficial na placa + wordmark “Ávila Corretora”.
- Domínio já em uso: `corretoraavila.com.br` — visual deve coincidir com esta marca, não com “InsureFlow Enterprise”.
- Cor de ênfase: navy. Ouro pontual.

### 11.3 Ávila Imóveis

- Unidade imobiliária. Usa a logo oficial **completa** no portal.
- No CRM Imobiliário: mesmo símbolo + “Ávila Imóveis”.
- Tagline oficial só no portal e no login, nunca na sidebar (altura insuficiente).

### 11.4 Powered by InsureFlow

InsureFlow deixa de ser a marca da tela e vira **crédito de plataforma**.

| Onde | Como | Tamanho |
|------|------|---------|
| Sidebar CRM (footer, acima do avatar) | Texto `Powered by InsureFlow` | 10px, opacity 45%, sem logo shield |
| Login | Abaixo do botão Entrar | 11px muted |
| Portal | Apenas rodapé legal, opcional | 10px |
| E-mails transacionais | Rodapé | 10px |
| Header, favicon, OG image, PWA name | **Não** | — |

Favicon e `metadata.title` passam a **Ávila Corretora** / **Ávila Imóveis**, não InsureFlow — quando implementado.

White-label futuro: o tema navy/ouro é do **tenant Ávila**. O tema azul atual permanece como default da plataforma para outros tenants.

### 11.5 Arquivos de marca ainda necessários (não inventar)

| Arquivo | Status |
|---------|--------|
| Logo oficial colorida (PNG) | **Há** — copiada para `mockups/ux001/assets/` |
| SVG vetorial da logo | Ausente — solicitar |
| Reverse (marfim sobre navy) | Ausente — **não fabricar**; usar placa |
| Recorte do símbolo (chave+telhados) para favicon 32/180 | Ausente — recortar do oficial na implementação, com aprovação |
| Lockup “Ávila Corretora” | Ausente — composição UI, não nova arte |

---

## 12. Mockups

Abrir no navegador (arquivo local):

**[docs/ux/mockups/ux001/index.html](mockups/ux001/index.html)**

Inclui:

| # | Mockup | Viewport |
|---|--------|----------|
| 1 | Sistema de marca (logo, paleta, tipo) | desktop |
| 2 | Login Grupo Ávila | desktop + mobile |
| 3 | CRM Corretora — dashboard | desktop + mobile |
| 4 | CRM Imobiliário — dashboard | desktop |
| 5 | Portal Ávila Imóveis — home | desktop + mobile |
| 6 | Sidebar + header (detalhe) | desktop |
| 7 | Dark vs Light (mesmo dashboard) | desktop |

Os mockups usam a **logo oficial** (não um redraw). São HTML estático de proposta — **não** são o app Next.js.

Capturas de referência (o HTML é a fonte):

- [Marca e paleta](mockups/ux001/screenshots/ux001-marca.png)
- [Portal desktop + mobile](mockups/ux001/screenshots/ux001-portal.png)
- [Dark mode](mockups/ux001/screenshots/ux001-dark.png)

---

## 13. O que se preserva do InsureFlow (quando houver implementação)

- Arquitetura de tokens (`--if-*`, shadcn, ThemeProvider)
- Densidade compacta e princípios de `operational-principles.md`
- Componentes: PageContainer, DataTable, AppCard, Sidebar shadcn
- RBAC, BU switcher, busca, IA (recoloridos)
- Geist no CRM

## 14. O que muda (somente após aprovação)

1. Nome visível: Grupo Ávila / unidades — InsureFlow só em “Powered by”
2. Substituição do Shield pela logo oficial
3. Paleta navy/ouro no lugar do azul 252
4. Sidebar navy nos dois temas
5. Login split com logo completa
6. Portal: abandonar verde `#14532d`, adotar paleta e logo oficiais, tipografia Playfair + Source Sans 3
7. Remover glows/blobs azuis do shell

## 15. Decisão pedida

**Classificação entrega UX-001A:** **READY FOR APPROVAL**

Marcar uma opção:

- [ ] **Aprovar a direção** e autorizar sprint de tokens + chrome (sidebar, header, login, portal header) sem mudar fluxos de negócio
- [ ] Aprovar com ajustes (anotar abaixo)
- [ ] Rejeitar — manter InsureFlow visível como marca do CRM

Ajustes:

```
( )
```

**Não implementar nada sem esta aprovação.**

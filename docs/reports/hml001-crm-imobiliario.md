# HML-001 — Homologação Completa CRM Imobiliário

**Data:** 2026-08-24  
**Escopo:** Validar entrega CRM-IMOB-001 (auditoria somente — sem correções, sem alteração de layout/banco/migrations)  
**Ambientes auditados:** `localhost` (API `:4000`, Web `:3000`, Portal `:3002`) e `corretoraavila.com.br` / `api.corretoraavila.com.br`

---

## Classificação final

| Ambiente | Status |
|----------|--------|
| **Localhost (dev)** | **READY WITH WARNINGS** |
| **Produção (`corretoraavila.com.br`)** | **NOT READY** |
| **Global** | **READY WITH WARNINGS** |

**Motivo:** O núcleo imobiliário funciona em localhost com dados reais (BU, dashboard, listagem, leads, portal management). Há lacunas funcionais previstas ou pendentes (proprietários, fotos, visitas, exclusão, conversão de leads) e divergência total em produção (build antigo, sem CRM imobiliário).

---

## Metodologia

- Leitura estática do código entregue em CRM-IMOB-001
- Consulta read-only ao PostgreSQL local (`insureflow`)
- Chamadas read-only ao BFF (`/api/properties*`, `/api/business-units/context`, `/api/persons`) com sessão autenticada
- Navegação UI em `http://localhost:3000` (conta demo Admin)
- APIs públicas local e produção
- Comparação visual/estrutural com `https://corretoraavila.com.br`
- Referência cruzada: `docs/architecture/portal-imobiliario-validacao.md` (fluxo create → publish → portal → lead de hoje)

**Não executado nesta auditoria:** operações de escrita/destruição (POST/PATCH/DELETE de imóveis, upload de fotos, troca de contexto via PATCH) — política de auditoria read-only.

---

## Fase 1 — Business Unit

| Item | Resultado | Evidência |
|------|-----------|-----------|
| Existência BU **Ávila Imóveis** | **OK** | DB: `slug=avila-imoveis`, `type=REAL_ESTATE`, `id=cmt1yr7tx0024kwg45n3yacsz` |
| Existência BU **Corretora Ávila** | **OK** | DB: `slug=corretora-avila`, `type=INSURANCE` |
| Troca de contexto (UI) | **OK** | Combobox **Empresa ativa** com opções Todas / Corretora Ávila / Ávila Imóveis |
| Persistência da seleção | **OK** | DB `users.currentBusinessUnitId` = `cmt1yr7tx0024kwg45n3yacsz` (admin); API context retorna mesmo valor |
| Menu contextual imobiliário | **OK** | Com BU **Ávila Imóveis**: sidebar exibe Dashboard, Imóveis, Proprietários, Leads Imobiliários, Visitas, Portal, Configurações |
| Menu seguros quando BU ≠ imobiliária | **OK** | Com **Todas** ou **Corretora Ávila**: sidebar comercial de seguros (CRM, Clientes, Leads…) |
| Isolamento de dados por BU | **OK** | `GET /api/properties?businessUnitId=<corretora>` → `total=0`; BU imobiliária → `total=1` (quando contexto JWT alinhado) |

### Observações

- **WARN:** Rotas `/real-estate/*` permanecem acessíveis por URL mesmo com menu de seguros visível (BU não imobiliária selecionada).
- **WARN:** Hydration error React em `components/dashboard/app-sidebar.tsx` (overlay Next.js no localhost).
- **WARN:** Em viewport estreita, combobox de empresa some e o menu pode parecer “sempre seguros” até expandir a tela.

---

## Fase 2 — Dashboard Imobiliário

| KPI / área | Esperado | Obtido (localhost, BU Ávila Imóveis) | Fonte |
|------------|----------|--------------------------------------|-------|
| Imóveis cadastrados | Dado real | **1** | UI + `dashboard-stats` + DB |
| Imóveis publicados | Dado real | **1** | idem |
| Leads recebidos | Dado real | **2** | idem |
| Visitas agendadas | Placeholder | **0** (“Em breve”) | hardcode em BFF |
| Tabela últimos leads | Dados reais | 2 registros (`Visitante Portal`, `Visitante Portal UI`) | DB `property_leads` |
| Proprietários no dashboard | — | **Não há card** | escopo CRM-IMOB-001 |

### Confirmações

- **Sem mocks** no dashboard imobiliário: BFF agrega `/api/v1/properties` e `/api/v1/properties/:id/leads`.
- **Sem hardcodes de KPI** principais (exceto visitas = 0).
- **Hardcode menor:** `scheduledVisits: 0` fixo em `apps/web/app/api/properties/dashboard-stats/route.ts`.

### Evidência UI (localhost)

- Título: **Dashboard Imobiliário**
- KPIs: 1 / 1 / 2 / 0
- Screenshot capturado durante auditoria (sessão local)

---

## Fase 3 — Imóveis

| Operação | API/BFF | UI CRM | Status auditoria |
|----------|---------|--------|------------------|
| Listar | `GET /api/properties` | `/real-estate/properties` | **OK** (1 imóvel quando BU alinhada) |
| Criar | `POST /api/properties` | `/real-estate/properties/new` | **PARCIAL** — formulário existe; escrita não reexecutada nesta HML; evidência prévia em `portal-imobiliario-validacao.md` |
| Editar | `PATCH /api/properties/:id` | `/real-estate/properties/[id]` | **PARCIAL** — tela existe; `GET /api/properties/:id` retornou erro intermitente (308/404) em um teste read-only posterior |
| Excluir | `DELETE /api/properties/:id` | — | **NÃO ENTREGUE NA UI** — hook `useDeleteProperty` existe, sem ação na grid |
| Publicar | `POST .../publish` | ação na grid | **PARCIAL** — UI presente; evidência de publicação real no doc de validação do portal |
| Despublicar | `POST .../unpublish` | ação na grid | **PARCIAL** — UI presente; não reexecutado nesta HML |

### Imóvel de referência (DB)

| Campo | Valor |
|-------|-------|
| id | `cmt7mztod0004kwyse0otxcgt` |
| title | Apto validação portal Centro 2026 |
| businessUnitId | `cmt1yr7tx0024kwg45n3yacsz` (Ávila Imóveis) |
| published | true |
| featured | true |

---

## Fase 4 — Fotos

| Operação | Backend | BFF | UI (aba Fotos) | Status |
|----------|---------|-----|----------------|--------|
| Upload | `POST .../images/upload` | `/api/properties/:id/images/upload` | `PropertyPhotosTab` | **NÃO VALIDADO** — 0 imagens no DB |
| Ordenação | `PATCH .../images/order` | sim | setas + “Salvar ordem” | **NÃO VALIDADO** |
| Capa | `POST .../images/:imageId/cover` | sim | botão Capa | **NÃO VALIDADO** |
| Exclusão | `DELETE .../images/:imageId` | sim | botão lixeira | **NÃO VALIDADO** |

**Evidência DB:** `property_images` count = **0**.

---

## Fase 5 — Proprietários

| Item | Status | Detalhe |
|------|--------|---------|
| Listagem Person | **OK (vazio)** | `GET /api/persons` → 0 registros; tela `/real-estate/owners` renderiza |
| Cadastro Person (UI) | **NÃO ENTREGUE** | Sem formulário |
| Edição Person (UI) | **NÃO ENTREGUE** | Somente `DataTable` read-only |
| Vínculo imóvel ↔ proprietário | **NÃO ENTREGUE** | API Nest `POST /api/v1/properties/:id/owners` existe; **sem BFF/UI** no web |
| DB | **0** persons, **0** property_owners | — |

---

## Fase 6 — Leads Imobiliários

| Item | Status | Evidência |
|------|--------|-----------|
| Inbox `/real-estate/leads` | **OK** | Página renderiza “Leads Imobiliários” |
| Dados reais | **OK** | 2 leads no DB |
| Origem | **OK** | `source=public_portal` (não mock) |
| Vínculo imóvel | **OK** | `propertyId` → Apto validação portal Centro 2026; BFF enriquece com `propertyTitle` |
| Conversão | **NÃO ENTREGUE** | PropertyLead não integra ao fluxo `convertLead` de seguros |

### Amostra (DB)

| name | source | property |
|------|--------|----------|
| Visitante Portal | public_portal | Apto validação portal Centro 2026 |
| Visitante Portal UI | public_portal | Apto validação portal Centro 2026 |

---

## Fase 7 — Portal

| Item | Status | Evidência |
|------|--------|-----------|
| URL portal (CRM) | **OK** | `http://localhost:3002/?businessUnitSlug=avila-imoveis` |
| Sitemap | **OK** | `http://localhost:3002/sitemap.xml` → HTTP 200 |
| Imóveis publicados (CRM) | **OK** | KPI = 1 |
| Destaque (CRM) | **OK** | KPI featured = 1 |
| API pública local | **OK** | `GET localhost:4000/api/v1/public/properties?...` → total 1 |
| API pública produção | **FALHA** | `GET api.corretoraavila.com.br/.../public/properties?...` → **404** |

### Hardcodes / defaults

- `NEXT_PUBLIC_PORTAL_URL` default `http://localhost:3002` em `lib/real-estate/portal-url.ts`
- Fallback slug `avila-imoveis` se BU não resolvida

---

## Fase 8 — Produção vs Localhost

| Aspecto | Localhost | corretoraavila.com.br |
|---------|-----------|------------------------|
| Título / branding | **Grupo Ávila** | **InsureFlow Enterprise** |
| Powered by InsureFlow | Sim | Não observado |
| Menu CRM imobiliário | Sim (com BU imobiliária) | **Não** — menu seguros clássico |
| Dashboard | Dashboard Imobiliário (KPIs reais) | Dashboard seguros **mock** (2.847 / 186 / 1.902) |
| Switcher de empresa | Sim | **Não visível** |
| Rotas `/real-estate/*` | Implementadas | **Não deployadas** (build anterior) |
| API health | 200 | 200 |
| Inventário público imobiliário | 200 (local) | **404** (prod) |

**Conclusão produção:** CRM-IMOB-001 **não está publicado** no front Vercel nem no inventário público da API de produção.

---

## Matriz de conformidade CRM-IMOB-001

| Entrega CRM-IMOB-001 | Homologação |
|----------------------|-------------|
| Menu contextual REAL_ESTATE | OK (localhost) |
| Dashboard imobiliário | OK |
| Grid imóveis + publish/unpublish | OK UI / parcial execução |
| Formulário imóvel | OK UI / parcial execução |
| Aba fotos | UI OK / funcionalidade não validada |
| Leads imobiliários | OK |
| Proprietários (listagem) | OK vazio / sem CRUD |
| Visitas (placeholder) | OK conforme escopo |
| Portal management | OK (localhost) |
| Documentação crm-imob-001 | Existe |

---

## Erros e warnings consolidados

### Bloqueadores (produção)

1. Front produção em build **pré-UX-002 / pré-CRM-IMOB-001**
2. API produção sem rota pública de properties (404)

### Warnings (localhost)

1. **Excluir imóvel** — API pronta, UI ausente  
2. **Proprietários** — somente listagem; sem cadastro/edição/vínculo  
3. **Conversão de PropertyLead** — não implementada  
4. **Fotos** — sem evidência de persistência (0 imagens)  
5. **Visitas** — KPI zerado por design (`scheduledVisits: 0`)  
6. **Hydration error** no sidebar (dev)  
7. **Contexto BU vs menu** — rotas imobiliárias acessíveis mesmo com menu de seguros  
8. **Dependência de contexto JWT** — listagem pode retornar vazia se BU da sessão não incluir imóveis  

---

## Endpoints utilizados na auditoria (read-only)

| Endpoint | Resultado |
|----------|-----------|
| `GET /api/v1/health` | 200 (local e prod) |
| `GET /api/business-units/context` | 200 — 2 units, current BU imobiliária |
| `GET /api/properties?businessUnitId=<RE>` | 200 — total 1 (contexto alinhado) |
| `GET /api/properties/dashboard-stats?businessUnitId=<RE>` | 200 — `{1,1,1,2,0}` |
| `GET /api/properties/leads?businessUnitId=<RE>` | 200 — 2 leads |
| `GET /api/persons` | 200 — `[]` |
| `GET /api/v1/public/properties?tenantSlug=insureflow&businessUnitSlug=avila-imoveis` | 200 local / 404 prod |

---

## Recomendações (fora do escopo HML — não executadas)

1. Deploy Vercel com commit que inclui CRM-IMOB-001 + UX-002  
2. Deploy API/migrations inventário imobiliário em produção  
3. Completar UI: excluir imóvel, CRUD proprietários + vínculo, conversão de leads  
4. Homologar fotos com upload real  
5. Corrigir hydration error no sidebar  
6. Revalidar listagem após fix de contexto BU / JWT  

---

## Referências

- `docs/reports/crm-imob-001.md` — escopo entregue  
- `docs/architecture/portal-imobiliario-validacao.md` — evidência create/publish/lead (24/08/2026)  
- `packages/database/prisma/seed.ts` — BUs Ávila Corretora + Ávila Imóveis  

---

## Assinatura de homologação

| Campo | Valor |
|-------|-------|
| **Auditoria** | HML-001 |
| **Classificação global** | **READY WITH WARNINGS** |
| **Localhost** | READY WITH WARNINGS |
| **Produção** | NOT READY |
| **Alterações de código** | Nenhuma (conforme solicitado) |

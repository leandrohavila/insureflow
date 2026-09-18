# CRM-IMOB-001 — Estrutura Inicial do CRM Imobiliário

**Classificação:** READY FOR TEST  
**Data:** 2026-08-24  
**Escopo:** Primeiro módulo operacional do CRM Imobiliário em `apps/web`, reutilizando o domínio `Property` / `PropertyImage` / `PropertyLead` já existente na API.

## Resumo

Implementação do CRM Imobiliário no frontend web, com menu contextual para unidades `REAL_ESTATE`, dashboard dedicado, CRUD de imóveis, gestão de fotos, inbox de leads imobiliários, listagem de proprietários (Person), gestão do portal e placeholder de visitas. Nenhuma alteração no domínio de seguros, Customer360 ou Leads de Seguros.

---

## Fase 1 — Menu imobiliário

Quando a unidade de negócio ativa é `REAL_ESTATE`, o sidebar exibe:

| Item | Rota |
|------|------|
| Dashboard | `/` |
| Imóveis | `/real-estate/properties` |
| Proprietários | `/real-estate/owners` |
| Leads Imobiliários | `/real-estate/leads` |
| Visitas | `/real-estate/visits` |
| Portal | `/real-estate/portal` |
| Configurações | `/configuracoes` |

**Arquivos:** `lib/navigation.ts`, `lib/navigation/use-operational-nav.ts`, `lib/business-units/nav-context.ts`, `components/dashboard/app-sidebar.tsx`, `lib/auth/nav-access.ts`

---

## Fase 2 — Dashboard imobiliário

Na rota `/`, quando o contexto é imobiliário, renderiza `RealEstateDashboard` em vez do dashboard de seguros.

**Cards (dados reais via BFF):**

- Imóveis cadastrados
- Imóveis publicados
- Leads recebidos
- Visitas agendadas (0 — sem API de visitas)

**Tabela:** últimos leads imobiliários (PropertyLead agregado por imóvel).

**Arquivos:** `components/real-estate/real-estate-dashboard.tsx`, `components/real-estate/dashboard-entry.tsx`, `app/(dashboard)/[[...slug]]/page.tsx`

---

## Fase 3 — Tela Imóveis

**Rota:** `/real-estate/properties`

Grid com: título, finalidade, cidade, bairro, valor, publicado, destaque.

**Ações:** editar, publicar, despublicar.

**Arquivo:** `components/real-estate/properties-page.tsx`

---

## Fase 4 — Cadastro imóvel

**Rotas:**

- `/real-estate/properties/new` — criar
- `/real-estate/properties/[id]` — editar

**Campos:** título, descrição, finalidade, tipo, cidade, bairro, valor, quartos, banheiros, área.

**Arquivo:** `components/real-estate/property-form.tsx`

---

## Fase 5 — Fotos

Aba **Fotos** no formulário de edição (após salvar o imóvel).

**Operações:** upload, definir capa, reordenar (setas + salvar ordem), excluir.

**Arquivo:** `components/real-estate/property-photos-tab.tsx`

---

## Fase 6 — Leads imobiliários

**Rota:** `/real-estate/leads`

Colunas: nome, telefone, e-mail, imóvel, data.

**Arquivo:** `components/real-estate/property-leads-page.tsx`

---

## Fase 7 — Portal management

**Rota:** `/real-estate/portal`

Exibe: imóveis publicados, em destaque, URL do sitemap, URL do portal.

**Arquivos:** `components/real-estate/portal-management-page.tsx`, `lib/real-estate/portal-url.ts`

**Env opcional:** `NEXT_PUBLIC_PORTAL_URL` (padrão `http://localhost:3002`)

---

## Fase 8 — Visitas (placeholder)

**Rota:** `/real-estate/visits`

Placeholder até existir modelo/API de visitas.

**Arquivo:** `components/real-estate/visits-page.tsx`

---

## Páginas criadas

| Rota | Arquivo |
|------|---------|
| `/` (dashboard imob.) | `app/(dashboard)/[[...slug]]/page.tsx` |
| `/real-estate/properties` | `app/(dashboard)/real-estate/properties/page.tsx` |
| `/real-estate/properties/new` | `app/(dashboard)/real-estate/properties/new/page.tsx` |
| `/real-estate/properties/[id]` | `app/(dashboard)/real-estate/properties/[id]/page.tsx` |
| `/real-estate/leads` | `app/(dashboard)/real-estate/leads/page.tsx` |
| `/real-estate/owners` | `app/(dashboard)/real-estate/owners/page.tsx` |
| `/real-estate/visits` | `app/(dashboard)/real-estate/visits/page.tsx` |
| `/real-estate/portal` | `app/(dashboard)/real-estate/portal/page.tsx` |

---

## Componentes

| Componente | Responsabilidade |
|------------|------------------|
| `DashboardEntry` | Alterna dashboard seguros vs imobiliário |
| `RealEstateDashboard` | KPIs + tabela de leads |
| `PropertiesPage` | Grid de imóveis |
| `PropertyForm` | Cadastro/edição |
| `PropertyPhotosTab` | Upload e ordenação de imagens |
| `PropertyLeadsPage` | Inbox de leads |
| `OwnersPage` | Listagem Person |
| `VisitsPage` | Placeholder |
| `PortalManagementPage` | Métricas e links do portal |

---

## Data access (frontend)

| Módulo | Caminho |
|--------|---------|
| Types / API / Hooks | `lib/data-access/modules/properties/` |
| Labels | `lib/real-estate/labels.ts` |
| BU imobiliária | `lib/real-estate/use-real-estate-business-unit.ts` |
| URLs portal | `lib/real-estate/portal-url.ts` |
| Query keys | `lib/data-access/query-keys.ts` → `properties.*` |

---

## Rotas BFF (`apps/web/app/api`)

| BFF | Backend |
|-----|---------|
| `GET/POST /api/properties` | `/api/v1/properties` |
| `GET/PATCH/DELETE /api/properties/[id]` | `/api/v1/properties/:id` |
| `POST /api/properties/[id]/publish` | `.../publish` |
| `POST /api/properties/[id]/unpublish` | `.../unpublish` |
| `GET /api/properties/[id]/leads` | `.../leads` |
| `GET /api/properties/leads` | Agrega leads de todos os imóveis da BU |
| `GET /api/properties/dashboard-stats` | KPIs agregados (total, publicados, destaque, leads) |
| `POST /api/properties/[id]/images/upload` | upload multipart |
| `PATCH /api/properties/[id]/images/order` | reordenar |
| `POST/DELETE /api/properties/[id]/images/[imageId]` | capa / excluir |
| `POST /api/properties/[id]/images/[imageId]/cover` | definir capa |
| `GET/POST /api/persons` | `/api/v1/persons` |

---

## Permissões

- Visualização: `properties:view`
- Criação/edição/publicação: `properties:manage` (formulário novo imóvel)

---

## O que não foi alterado

- Domínio de seguros (API e telas existentes)
- Customer360
- Leads de Seguros
- Modelo/API de visitas (KPI zerado + placeholder)

---

## Plano de teste sugerido

1. Selecionar BU `REAL_ESTATE` (ex.: `avila-imoveis`) no switcher.
2. Confirmar menu imobiliário e dashboard com KPIs reais.
3. Criar imóvel, editar, publicar/despublicar.
4. Enviar fotos, definir capa, reordenar.
5. Verificar leads em `/real-estate/leads` após interesse no portal.
6. Conferir `/real-estate/portal` (contagens, sitemap, URL).
7. Trocar para BU de seguros e confirmar menu comercial original.

---

## Classificação final

**READY FOR TEST**

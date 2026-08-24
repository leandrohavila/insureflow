# Real Estate Inventory — arquitetura do módulo

**Data:** 24 de agosto de 2026  
**Escopo:** domínio nativo de inventário imobiliário no monorepo InsureFlow (mesmo tenant, mesma API, mesmo Neon).  
**Fora de escopo:** UI do portal, UI do CRM, banco próprio, autenticação própria do visitante, `Customer360Property`.

---

## 1. Posição no sistema

O CRM Imobiliário já existe como **unidade de negócio** `REAL_ESTATE` no tenant (`business_units`), não como app separado. O inventário é um **bounded context novo** na Nest (`apps/api`) e no Prisma (`packages/database`).

```
Portal público  →  GET/POST /api/v1/public/*     (@Public, só published)
CRM interno     →  /api/v1/properties*           (JWT + properties:view|manage)
                       ↓
                 PropertiesModule
                       ↓
                 Repositories  →  Prisma  →  Neon (mesmo tenant)
```

`Customer360Property` permanece um DTO de leitura (deal/opportunity). **Não** é persistência de imóvel e **não** é usado neste módulo.

---

## 2. Entidades

### Property

Imóvel de catálogo, sempre com `tenantId` + `businessUnitId` (FK obrigatória para `business_units` do tipo `REAL_ESTATE`).

| Campo | Papel |
|-------|--------|
| `slug` | URL pública; único por tenant |
| `purpose` | Finalidade: `SALE` \| `RENT` \| `SALE_AND_RENT` |
| `city` / `neighborhood` | Filtros públicos |
| `price` | Decimal; faixa `priceMin`/`priceMax` |
| `featured` | Destaques (`/highlights`); vigente se `featuredUntil` nulo ou futuro (RE-004) |
| `published` | Único gate das APIs públicas |
| `publishedAt` | Timestamp da última publicação; não é o gate |

Regras:

- Criar imóvel **não** publica (`published = false`, `publishedAt = null`).
- Publicar: `published = true`, `publishedAt = now()`.
- Despublicar: `published = false`; `publishedAt` permanece (histórico).
- Público só lê `published = true`.
- Isolamento: toda query interna inclui `tenantId`; ACL de BU igual a deals (`currentBusinessUnitId` + membership).

### PropertyImage

Mídia do imóvel (`url`, `alt`, `sortOrder`, `isCover`). Sempre `tenantId` + `propertyId`. Cascade no delete do imóvel.

### PropertyLead

Interesse capturado no portal. **Não** é o `Lead` do CRM.

- `tenantId`, `businessUnitId`, `propertyId`
- `name`, `email?`, `phone?`, `message?`
- `source` default `public_portal`
- POST público **só** se o imóvel estiver `published`
- Sem JWT; rate limit mais apertado

---

## 3. Camadas Nest

O restante da API usa Prisma no service. Este módulo introduz **repository** só no inventário, sem refactor global.

```
controllers/
  properties.controller.ts          # admin JWT
  public-properties.controller.ts   # catálogo
  public-property-leads.controller.ts
services/
  properties.service.ts
  public-properties.service.ts
  property-leads.service.ts
repositories/
  properties.repository.ts
  property-images.repository.ts
  property-leads.repository.ts
dto/
  property.dto.ts
  public-property.dto.ts
  property-lead.dto.ts
```

- Admin: `BusinessUnitAccessService` + `directBusinessUnitWhere`.
- Público: resolve tenant por `tenantSlug` (query); opcional `businessUnitSlug` / `businessUnitId`.

---

## 4. HTTP (prefixo real: `/api/v1`)

### Público (`@Public()`)

| Método | Path | Comportamento |
|--------|------|----------------|
| GET | `/public/properties` | Lista publicados + filtros opcionais + paginação |
| GET | `/public/properties/highlights` | `featured = true`, publicados e destaque vigente |
| GET | `/public/properties/search` | Mesmos filtros + `q` (título/descrição/cidade/bairro) |
| GET | `/public/properties/:slug` | Detalhe publicado |
| POST | `/public/leads` | Cria `PropertyLead` |

Filtros: `city`, `neighborhood`, `purpose`, `priceMin`, `priceMax`.  
`tenantSlug` obrigatório nas rotas públicas.

Rotas estáticas (`highlights`, `search`) **antes** de `:slug`.

### Admin (JWT)

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/properties` | `properties:view` |
| GET | `/properties/:id` | `properties:view` |
| GET | `/properties/:id/leads` | `properties:view` |
| POST | `/properties` | `properties:manage` |
| PATCH | `/properties/:id` | `properties:manage` |
| POST | `/properties/:id/publish` | `properties:manage` |
| POST | `/properties/:id/unpublish` | `properties:manage` |
| POST | `/properties/:id/images` | `properties:manage` |
| DELETE | `/properties/:id/images/:imageId` | `properties:manage` |
| DELETE | `/properties/:id` | `properties:manage` |

---

## 5. Permissões

`properties:view`, `properties:manage` no catálogo Prisma e em `@repo/auth`.

Atribuídas a admin (todas), leitura/viewer (`:view`), comercial/gerência/sales/broker (`view` + `manage`).

Cadastro interno exige unidade `REAL_ESTATE` ativa.

---

## 6. Índices

- `@@unique([tenantId, slug])`
- `(tenantId, businessUnitId)`
- `(tenantId, published, publishedAt)`
- `(tenantId, city, neighborhood)`
- `(tenantId, purpose, price)`
- `(tenantId, featured, published)`
- images: `(propertyId, sortOrder)`
- leads: `(tenantId, propertyId)`, `(tenantId, createdAt)`

---

## 7. O que não fazer

- Segunda API ou segundo Postgres
- Login no portal
- Reusar `Customer360Property` / `Opportunity` / `Deal` como catálogo
- Gravar `PropertyLead` em `leads` neste passo
- Expor imóvel com `published = false` nas rotas `/public/*`

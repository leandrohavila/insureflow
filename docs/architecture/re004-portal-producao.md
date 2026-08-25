# RE-004 — Portal imobiliário pronto para produção

**Data:** 24 de agosto de 2026  
**Escopo:** owners, características, upload de imagens, destaques com validade, SEO.  
**Não altera:** gate `published`, POST `/public/leads`, slug, tenant/BU, rotas públicas já validadas.

---

## 1. Princípio

O catálogo público continua o mesmo contrato, **com campos extras**:

- `coverImage`
- `features`
- `primaryOwner` (só se `publicVisible`)
- `featuredUntil`

Listagem, busca, detalhe por slug e captura de lead permanecem.

```
CRM (JWT)                         Portal
  PropertyOwner ── Person           sitemap.xml / robots.txt
  PropertyFeature ← Definition      metadata + Open Graph
  PropertyImage (upload local)      usa coverImage se vier na API
  featured + featuredUntil
         ↓
  GET /api/v1/public/properties*
```

---

## 2. Entidades novas

### Person

Pessoa do inventário (PF/PJ), isolada por `tenantId`. **Não** substitui `Customer`.

- `name`, `document?`, `email?`, `phone?`, `kind` (`INDIVIDUAL` | `COMPANY`)
- `customerId?` — vínculo opcional quando o dono já é cliente do CRM

### PropertyOwner

N:N Property ↔ Person.

- `isPrimary` — no máximo um por imóvel (regra de serviço)
- `publicVisible` — único gate para o portal ver o nome
- Público **nunca** recebe documento/e-mail/telefone

### PropertyFeatureDefinition + PropertyFeature

Catálogo dinâmico por tenant (`key` + `label` + `valueType`) e valores no imóvel (`BOOLEAN` | `TEXT` | `NUMBER`).

### PropertyImage (evolução)

Continua `url` / `isCover` / `sortOrder`.  
Upload grava arquivo local e preenche `url` com `/api/v1/files/properties/:propertyId/:file`.  
POST JSON com URL externa **permanece** (fluxo já validado).

### Destaque

- `featured` (já existia)
- `featuredUntil?` — destaque ativo se `featured=true` e (`until` nulo ou `> now`)
- `/highlights` usa essa regra; imóvel publicado mas com destaque vencido **não** some da listagem geral

---

## 3. HTTP extra (prefixo `/api/v1`)

Admin (`properties:manage`, view onde leitura):

| Método | Path |
|--------|------|
| GET/POST | `/persons` |
| GET/PATCH | `/persons/:id` |
| GET/POST | `/property-features` |
| PATCH/DELETE | `/property-features/:id` |
| GET/POST | `/properties/:id/owners` |
| PATCH/DELETE | `/properties/:id/owners/:ownerId` |
| POST | `/properties/:id/owners/:ownerId/primary` |
| PUT | `/properties/:id/features` |
| POST | `/properties/:id/images/upload` |
| PATCH | `/properties/:id/images/order` |
| POST | `/properties/:id/images/:imageId/cover` |

Público: mesmas rotas de list/search/highlights/slug/leads; payload enriquecido.

Arquivos: `GET /files/properties/:propertyId/:filename` (`@Public`).

---

## 4. SEO (portal Next)

- `app/sitemap.ts` — URLs dos imóveis publicados
- `app/robots.ts`
- `generateMetadata` no detalhe (title, description, OG image = capa)
- Layout: Open Graph default do portal

Sem login, sem mudar o formulário de interesse.

---

## 5. Storage

`STORAGE_PROVIDER=local` (default). Pasta `apps/api/uploads/` (gitignored). S3/R2 continua fora desta sprint.

---

## 6. Camadas Nest (esta sprint)

```
controllers/
  properties.controller.ts                 # CRUD + images JSON + upload/cover/order + owners + features
  persons.controller.ts                    # /persons
  property-feature-definitions.controller.ts  # /property-features
  public-properties.controller.ts          # catálogo (payload enriquecido)
  public-property-leads.controller.ts      # inalterado
  property-files.controller.ts             # GET /files/properties/:propertyId/:filename
services/
  properties.service.ts                    # featuredUntil, upload, capa, ordem
  property-owners.service.ts               # N:N + isPrimary
  persons.service.ts
  property-feature-definitions.service.ts
  property-features.service.ts             # PUT valores do imóvel
  public-properties.service.ts             # serializePublicProperty + featuredUntil
  property-leads.service.ts                # inalterado
```

Público continua: list / search / highlights / `:slug` / POST leads. Campos novos são aditivos.

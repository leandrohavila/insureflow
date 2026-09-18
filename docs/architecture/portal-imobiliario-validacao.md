# Validação ponta a ponta — Portal Imobiliário (sem mock)

**Data:** 24 de agosto de 2026  
**Ambiente:** local (`localhost:5432` / `insureflow`, API `:4000`, portal `:3002`)  
**Escopo:** diagnosticar HTTP 500 nas rotas públicas e fazer o fluxo real funcionar. Sem feature nova.

---

## 1. Causa do HTTP 500

A migration `20260824140000_real_estate_inventory` **não estava aplicada**.

`prisma migrate status` apontava 1 pendência. As tabelas `properties`, `property_images` e `property_leads` não existiam. O Prisma Client **já tinha** os delegates `property` / `propertyImage` / `propertyLead` (não era client desatualizado). A query pública falhava no banco e a Nest devolvia `{"statusCode":500,"message":"Internal server error"}`.

Health (`GET /api/v1/health`) continuava 200 — o processo estava no ar; só o inventário quebrava.

Fator complementar para o CRM (não para as rotas públicas): as permissões `properties:view` e `properties:manage` existiam no `seed.ts`, mas **não** no banco (seed não tinha sido reexecutado após o módulo). Admin não conseguiria publicar via API até o vínculo nas roles.

---

## 2. Correções realizadas

| Item | Ação |
|------|------|
| Migration | `npx prisma migrate deploy` em `packages/database` |
| Permissões | Upsert de `properties:view` / `properties:manage` e vínculo nas roles `admin`, `gerencia`, `comercial`, `sales`, `broker` (manage) e `leitura`/`viewer` (view) |
| Código | Nenhuma alteração de feature. Mock do portal permanece só como fallback se a API cair; nesta validação **não foi usado**. |

Prisma Client: sem regenerar (já continha os modelos). Relacionamentos criados pela migration (tenant, business_unit, users, cascade de imagens/leads).

---

## 3. Migrations

- Pendente: `20260824140000_real_estate_inventory`
- Aplicada com sucesso em `localhost:5432` / database `insureflow`
- Status final: **schema up to date** (28/28)

Tabelas confirmadas: `properties`, `property_images`, `property_leads`.

---

## 4. Status das APIs públicas

Após a migration, sem imóvel: `200` + `data: []`.  
Após cadastro + publicação:

| Rota | HTTP | Resultado |
|------|------|-----------|
| `GET /api/v1/public/properties?tenantSlug=insureflow&businessUnitSlug=avila-imoveis` | 200 | `total: 1` — *Apto validação portal Centro 2026* |
| `GET /api/v1/public/properties/highlights?...` | 200 | mesmo imóvel (`featured`) |
| `GET /api/v1/public/properties/search?...&q=validação&city=Cuiabá&neighborhood=Centro&purpose=SALE` | 200 | `total: 1` |
| `GET /api/v1/public/properties/apto-validacao-portal-centro-2026?...` | 200 | `published: true` |
| `POST /api/v1/public/leads` | 201 | `source: public_portal` |

Rewrite do portal (`http://localhost:3002/api/v1/public/...`) também 200/201 no mesmo payload.

---

## 5. Status do Portal

`NEXT_PUBLIC_PORTAL_USE_MOCK=false`. Home e listagem exibiram o imóvel real (`R$ 425.000`, 72 m²), **não** o mock (`R$ 420.000`, 68 m²). Banner amarelo de mock **não** apareceu.

Páginas conferidas no browser:

- `/` destaques com o imóvel publicado
- `/imoveis` listagem só com esse imóvel
- `/imoveis/apto-validacao-portal-centro-2026` detalhe (endereço + descrição reais)
- `/imoveis/apto-validacao-portal-centro-2026/interesse` formulário ligado ao título real

---

## 6. Evidência do fluxo completo (sem mock)

Imóvel `cmt7mztod0004kwyse0otxcgt`:

| Passo | Evidência |
|-------|-----------|
| Cadastro CRM (`POST /api/v1/properties`) | 201, `published: false`, `publishedAt: null`, `status: DRAFT`, slug `apto-validacao-portal-centro-2026` |
| Publicação (`POST /api/v1/properties/:id/publish`) | 201, `published: true`, `publishedAt: 2026-08-24T19:36:24.114Z`, `status: AVAILABLE` |
| Persistência | `tenantId=cmp7m966u000o10zo1lhbgl5k` (insureflow), `businessUnitId=cmt1yr7tx0024kwg45n3yacsz` (`avila-imoveis`, `REAL_ESTATE`) |
| API pública lista | 200 com o título publicado |
| Portal lista / detalhe | mesmo título, preço e metragem |
| Lead API | `cmt7mztta0006kwyssoaqukhk`, `source=public_portal` |
| Lead via portal (`POST localhost:3002/api/v1/public/leads`) | `cmt7n0nzw0008kwysjseoe7w1`, `source=public_portal` (não `public_portal_mock`) |
| CRM `GET /api/v1/properties/:id/leads` | 200, leads do portal visíveis |

Admin autenticado (`admin@insureflow.com`) passou a ter `properties:view` e `properties:manage` no JWT.

```
CRM cadastro → publicação (published + publishedAt + slug)
  → GET /public/properties
  → Portal lista / detalhe / interesse
  → POST /public/leads
  → GET /properties/:id/leads
```

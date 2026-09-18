# Portal Imobiliário Público — arquitetura

**Data:** 24 de agosto de 2026  
**App:** `apps/portal-imobiliario-publico` (Next.js 15, porta 3002)  
**Objetivo:** validar o módulo Real Estate Inventory da API. Sem login, sem banco próprio.

---

## 1. Papel

O portal é um **consumidor HTTP** das rotas `/api/v1/public/*`. Não lê Prisma, não reusa `Customer360Property`, não autentica visitante.

```
Visitante
  → Next.js (RSC + form client)
      → services/ (HTTP)
          → Nest GET/POST /api/v1/public/*     (se API no ar)
          → mock em memória                    (se API cair / flag)
              → Neon via API
                  → CRM GET /properties/:id/leads
```

Fluxo a validar:

```
Cadastro no CRM → Publicação → Portal lista/detalha → POST lead → CRM vê PropertyLead
```

---

## 2. Camadas (desacopladas)

```
types/       contratos iguais à API (Property, filtros, lead)
services/    HTTP + mock + fachada com fallback
hooks/       client: listagem, detalhe, submit do lead
app/         páginas (RSC onde possível; form é client)
components/  UI shadcn mínima + cards/filtros
```

A UI **não** chama `fetch` direto. Páginas e hooks passam por `services/catalog.ts`.

No browser, `/api/v1/*` é reescrito pelo Next para a Nest (`API_INTERNAL_URL`), evitando CORS.

### Fallback mock

Ativa quando:

- `NEXT_PUBLIC_PORTAL_USE_MOCK=true`, ou
- a API não responde (rede, 5xx, conexão recusada)

**Não** usa mock em 404 de slug (imóvel inexistente) nem em 400 de lead (validação).

O banner “catálogo mock” deixa explícito que o CRM não receberá o lead.

---

## 3. Páginas

| Rota | Função |
|------|--------|
| `/` | Home: destaques + atalho para listagem |
| `/imoveis` | Listagem + filtros (cidade, bairro, finalidade, preço, `q`) |
| `/imoveis/[slug]` | Detalhe publicado |
| `/imoveis/[slug]/interesse` | Formulário de interesse |

Query pública sempre envia `tenantSlug` (default `insureflow`) e `businessUnitSlug` (`avila-imoveis`).

---

## 4. Config

| Variável | Default |
|----------|---------|
| `API_INTERNAL_URL` / `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |
| `NEXT_PUBLIC_TENANT_SLUG` | `insureflow` |
| `NEXT_PUBLIC_BUSINESS_UNIT_SLUG` | `avila-imoveis` |
| `NEXT_PUBLIC_PORTAL_USE_MOCK` | `false` |

CORS da API inclui `http://localhost:3002`.

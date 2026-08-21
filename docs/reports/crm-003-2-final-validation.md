# Relatório final — CRM-003.2 Business Unit ACL

**Data:** 20 Aug 2026, 19:56 BRT  
**Ambiente:** API `http://localhost:4000` · PostgreSQL `localhost/insureflow`  
**Status:** **APROVADA**

Correção dos bloqueios da homologação anterior: BUG-014 (GET por ID sem ACL) e BUG-015 (seed sem vínculo de empresa).

---

## 1. Evidência do BUG-014 corrigido

Detalhe usa o **mesmo filtro das listagens** (`BusinessUnitAccessService.*Where`). Fora do escopo → **HTTP 404** (não 403).

Evidência runtime após o patch:

| Persona | Operação | Resultado |
|---|---|---|
| `sales@insureflow.com` | GET lead Corretora `cmpg3mmv0000bkwogen40m1ed` (ANDREZA ÁVILA) | **200** |
| `sales@` | GET lead Imobiliária `cmt1yr8bm003okwg4utzfvpm1` (Patricia Rocha) | **404** `Lead não encontrado` |
| `sales@` | GET customer Imobiliária | **404** `Cliente não encontrado` |
| `sales@` | GET deal Imobiliária `cmpejh2op0001kwxw0lphrwae` | **404** `Negócio não encontrado` |
| `sales@` | GET deal Corretora `cmpdarybs0003kwv4u0sr2ivc` | **200** |
| `imoveis@insureflow.com` | GET lead Imobiliária (Patricia Rocha) | **200** |
| `imoveis@` | GET lead Corretora (ANDREZA ÁVILA) | **404** |
| `admin@insureflow.com` | GET lead Corretora | **200** |
| `sales@` | GET `/leads/does-not-exist` | **404** (mesmo contrato) |

Antes do patch, `sales@` abria o lead de outro owner com HTTP 200 mesmo com listagem em 0. Esse bypass não reproduz mais.

Endpoints de detalhe auditados (404 se fora do ACL):

- `GET /api/v1/leads/:id` e `GET /api/v1/leads/:id/context`
- `GET|PATCH|DELETE /api/v1/customers/:id`
- `GET /api/v1/crm/deals/:id` (e demais ações que passam por `assertDealAccess`)
- `GET|PATCH /api/v1/lead-follow-ups/:id`
- `GET|PATCH /api/v1/policy-renewals/:id`
- `POST /api/v1/communications/:id/reply`
- `PATCH /api/v1/cross-sell/opportunities/:id`
- `GET /api/v1/quotes/comparisons/:id` e `GET /api/v1/quotes/proposals/:proposalId`
- `GET /api/v1/activities/:id`

---

## 2. Evidência do BUG-015 corrigido

Seed `seed-business-unit-homologation.ts` (após `seed-dev`): origin `businessUnitId` + vínculo M:N em leads/clientes; `businessUnitId` em deals.

Log do seed local:

```
Seed BU HML OK — Corretora leads=20 customers=5 deals=23; Imóveis leads=15 customers=3 deals=10
```

Deals da Corretora ficaram em 23 (mínimo 15): os 8 extras já existiam no banco e foram atribuídos à Corretora.

---

## 3. Totais por persona (listagens)

| Recurso | admin (Todas) | sales (Corretora) | imoveis (Imobiliária) |
|---|---:|---:|---:|
| Leads | 35 | 20 | 15 |
| Clientes | 8 | 5 | 3 |
| Deals | 33 | 23 | 10 |

`20 + 15 = 35` e `5 + 3 = 8`. Nenhum registro órfão sem Business Unit nas listagens filtradas.

---

## 4. Testes executados

| Suíte | Resultado | Cobertura |
|---|---|---|
| `business-unit-acl.util.spec.ts` | 10 passed | view-all, Todas, unidade ativa, membership vazia, ID fora do ACL, escopo lead/cliente |
| `business-unit-access.service.spec.ts` | 5 passed | ACL permitido, ACL negado (404), inexistente (404), contexto Todas, contexto BU específica |
| `business-unit-detail-acl.e2e-spec.ts` | 5 passed | GET lead 200/404, customer 404, deal 404, inexistente 404 |
| `business-units.e2e-spec.ts` | 3 passed | GET/PATCH `/context` |
| `leads.service.spec.ts` + `customers.service.spec.ts` | passed | regressão |
| `tsc --noEmit` (API) | ok | |

Cenários pedidos:

- ACL permitido — unit + HTTP 200 sales/imoveis no próprio universo  
- ACL negado — unit + HTTP 404  
- Registro inexistente — HTTP 404  
- Contexto Todas — admin sem filtro extra de unidade  
- Contexto BU específica — admin com `currentBusinessUnitId` aplica AND no mesmo where da listagem  

---

## 5. APIs auditadas

| Método | Rota | Listagem | Detalhe |
|---|---|---|---|
| GET | `/api/v1/leads` | ACL | — |
| GET | `/api/v1/leads/:id` | — | ACL 404 |
| GET | `/api/v1/leads/:id/context` | — | ACL 404 |
| GET | `/api/v1/customers` | ACL | — |
| GET/PATCH/DELETE | `/api/v1/customers/:id` | — | ACL 404 |
| GET | `/api/v1/crm/deals` | ACL | — |
| GET | `/api/v1/crm/deals/:id` | — | ACL 404 |
| GET | `/api/v1/lead-follow-ups` | ACL | — |
| GET/PATCH | `/api/v1/lead-follow-ups/:id` | — | ACL 404 |
| GET | `/api/v1/policy-renewals` | ACL | — |
| GET/PATCH | `/api/v1/policy-renewals/:id` | — | ACL 404 |
| GET | `/api/v1/communications` | ACL | — |
| POST | `/api/v1/communications/:id/reply` | — | ACL 404 |
| GET | `/api/v1/cross-sell/opportunities` | ACL | — |
| PATCH | `/api/v1/cross-sell/opportunities/:id` | — | ACL 404 |
| GET | `/api/v1/quotes` / metrics | ACL | — |
| GET | `/api/v1/quotes/comparisons/:id` | — | ACL 404 |
| GET | `/api/v1/activities/:id` | — | ACL 404 |
| GET/PATCH | `/api/v1/business-units/context` | contexto JWT | — |

Fora do escopo desta correção (não listados no BUG-014): `policies`, `questionnaires`, `claims`. Listagens desses módulos ainda não aplicam BU ACL.

---

## 6. Status final da Sprint CRM-003.2

**APROVADA**

O contexto operacional de Business Unit respeita permissões, empresa ativa e ACL nas listagens **e** nos detalhes das entidades comerciais da sprint. A troca de empresa continua sem logout. O dataset de homologação permite validar Corretora vs Imobiliária vs Admin.

Pendências residuais (não bloqueiam esta sprint):

- Apólices, questionários e sinistros sem filtro de BU.
- Deals da Corretora acima do mínimo (23 vs 15) por dados pré-existentes.
- Comunicações ainda exigem `automation:view` (RBAC), independente do ACL de empresa.

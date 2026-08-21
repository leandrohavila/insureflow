# Relatório final — CRM-004 Evolution API

**Data:** 20 Aug 2026  
**Ambiente:** API `http://localhost:4000` · PostgreSQL `localhost/insureflow`  
**Status:** **APROVADA**

Substituição da camada `InternalProvider` (log only) pelo `EvolutionProvider`, sem alterar os fluxos de reativação, follow-up, renovação, cross-sell, envio manual e dashboard comercial. Esses módulos continuam chamando `CommunicationsService.dispatch()`; o tenant passa a enviar WhatsApp real quando a Evolution está configurada e `kind = EVOLUTION`.

---

## 1. Evidência da implementação

### Fase 1 — Configuração

Tela `/configuracoes/comunicacao` (sessão WhatsApp Business):

- Nome da instância, URL Evolution, API Key
- Status da conexão e data da última sincronização
- Botões Conectar, Reconectar, Desconectar, Gerar QR Code

Credenciais ficam em `communication_provider_configs.settings` (JSON). A API Key nunca é devolvida em claro (`apiKeyMasked`).

### Fase 2 — EvolutionProvider

`CommunicationProvider` agora exige:

`send` · `validateConnection` · `generateQrCode` · `disconnect` · `healthCheck`

| Adapter | Comportamento |
|---|---|
| INTERNAL | Log local (compatibilidade) |
| EVOLUTION | HTTP real (Baileys / Evolution v2) |
| META / Z-API / Twilio | Stub (falha explícita) |

### Fase 3 — Envio

`CommunicationsService.dispatch` → `ProviderRegistry` → `EvolutionProvider.send`.

`communication_logs` registra `provider = EVOLUTION`, `externalId`, `messageId`, `status`.

### Fase 4 — Status

Webhook mapeia ACK Evolution:

| Evento Evolution | Status | Activity |
|---|---|---|
| SERVER_ACK / sent | `sent` | `communication_sent` |
| DELIVERY_ACK | `delivered` | `communication_delivered` |
| READ | `read` | `communication_read` |
| ERROR | `failed` | `communication_failed` |

Status não regride (ex.: `delivered` não volta para `sent`; `replied` é terminal).

### Fase 5 — Webhooks

`POST /api/v1/communications/webhooks/evolution` (público, sem JWT).

Identifica o tenant pela instância + token na query. Persistência de mensagem recebida, entrega, leitura e `CONNECTION_UPDATE`.

### Fase 6 — Respostas

Inbound cria/atualiza `communication_replied`, atualiza `lead.lastInteractionAt` / `lastContactAt` e publica activity com `leadId`, `customerId` e `dealId` quando houver.

### Fases 7–9 — Automações

Sem mudança de job. `LeadReactivationJob`, lembrete de renovação (`renewal_reminder_sent`) e notificação de cross-sell já usam `dispatch()`. Com provider Evolution, o WhatsApp é real.

### Fase 10 — Dashboard

`/automacao/comunicacao` com KPIs: enviadas, entregues, lidas, respondidas, falhas, taxa de resposta.

Filtros: período, empresa (Business Unit), corretor, tipo de comunicação.

### Fase 11 — Business Unit (CRM-003.2)

Listagem, dashboard e `GET /communications/:id` usam `BusinessUnitAccessService.communicationWhere` (tenant + ACL + contexto ativo). Fora do escopo → **404**.

### Fase 12 — Testes

Ver seção 4.

---

## 2. Migration

`packages/database/prisma/migrations/20260820220000_evolution_api`

- Enum `CommunicationStatus.read`
- Colunas `message_id`, `delivered_at`, `read_at`
- Índice `(tenantId, message_id)`

Aplicada no PostgreSQL local (`insureflow`).

---

## 3. APIs auditadas (Swagger)

| Método | Rota | Auth |
|---|---|---|
| GET | `/api/v1/communications` | `automation:view` + ACL BU |
| GET | `/api/v1/communications/dashboard` | `automation:view` + ACL BU |
| GET | `/api/v1/communications/provider` | `automation:view` |
| PATCH | `/api/v1/communications/provider` | `automation:manage` |
| GET | `/api/v1/communications/evolution/health` | `settings:view` |
| POST | `/api/v1/communications/evolution/connect` | `settings:manage` |
| POST | `/api/v1/communications/evolution/reconnect` | `settings:manage` |
| POST | `/api/v1/communications/evolution/disconnect` | `settings:manage` |
| POST | `/api/v1/communications/evolution/qrcode` | `settings:manage` |
| POST | `/api/v1/communications/webhooks/evolution` | público (token da instância) |
| POST | `/api/v1/communications/send` | `automation:manage` |
| GET | `/api/v1/communications/:id` | `automation:view` + ACL 404 |
| POST | `/api/v1/communications/:id/reply` | `automation:manage` + ACL 404 |

BFF espelhado em `apps/web/app/api/communications/**`.

Webhook deve apontar para a **Nest API** (`API_PUBLIC_URL`), não para o Next.js.

---

## 4. Testes executados

| Suite | Resultado |
|---|---|
| `communications` (unit: service, providers, webhook, Evolution HTTP mock) | **24 passed** |
| `activity-event-kinds` | **passed** (inclui delivered/read) |
| `lead-reactivation` / `policy-renewals` / `cross-sell` / `commercial-automation` | **7 passed** (nenhum módulo quebrado) |
| `test/communications.e2e-spec.ts` | **5 passed** (send, dashboard, inbound, webhook público, connect/QR) |
| `apps/api` `tsc --noEmit` | **ok** |

Cobertura ACL: permitido (list/dashboard com `communicationWhere`), negado (`findOne` 404), registro inexistente (mesmo 404), contexto Todas (`resolveIds` null) e BU específica (`requestedBusinessUnitId`).

---

## 5. Totais / comportamento por persona

A ACL de comunicação segue o mesmo recorte da CRM-003.2:

| Persona | Vê comunicações de |
|---|---|
| `sales@` (Corretora) | leads/clientes da Corretora Ávila |
| `imoveis@` | leads/clientes da Ávila Imóveis |
| `admin@` | todas (contexto “Todas”) |

Envio automático de reativação/renovação/cross-sell respeita o tenant; o recorte de listagem/dashboard é por BU + contexto JWT.

---

## 6. Homologação WhatsApp real

Os critérios 1–7 (QR, mensagem no celular, resposta, dashboard, jobs) exigem uma Evolution API acessível. No ambiente local a integração está pronta; falta apontar URL + API Key em `/configuracoes/comunicacao` e ler o QR.

Variável: `API_PUBLIC_URL` (ex.: `http://localhost:4000`) para registrar o webhook.

Passos de homologação:

1. Subir Evolution API e obter `apikey`
2. Em Comunicação, preencher instância / URL / key → **Conectar**
3. Ler o QR no WhatsApp Business
4. Enviar uma reativação ou mensagem manual
5. Confirmar entrega/leitura/resposta no dashboard e na timeline

INTERNAL permanece disponível como fallback até a instância conectar (`kind` só muda para EVOLUTION ao salvar/conectar).

---

## 7. Status da Sprint

**APROVADA**

Pendência operacional (não bloqueia o código): validar QR e mensagem em uma instância Evolution de homologação. Nenhum módulo existente foi alterado no fluxo de negócio; a troca é só a camada de provider.

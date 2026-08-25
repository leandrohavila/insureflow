# BUG-006 — Auditoria do fluxo de criação de Lead

**Data:** 2026-07-22  
**Status:** Instrumentado (sem correção)  
**Sintoma:** POST `/api/leads` aparece na aba Network **pendente** — sem Status Code, Response ou Headers.

---

## Mapa do fluxo (passo a passo)

| # | Etapa | Arquivo | Tecnologia | Entrada / Saída |
|---|--------|---------|------------|-----------------|
| 1 | Clique **Salvar lead** | `leads-page.tsx` → `LeadDialog` | `<Button type="submit">` | onClick → log |
| 2 | `handleSubmit()` | `leads-page.tsx` (LeadDialog) | Form nativo + `useState` | preventDefault → monta payload → chama `onSubmit` |
| 3 | react-hook-form | — | **NÃO USADO** | LeadDialog usa `<form onSubmit>` + `useState`; log explícito de skip |
| 4 | `createLead.mutate()` | `leads-page.tsx` | TanStack Query | `onSubmit` prop do LeadDialog |
| 5 | `mutationFn()` | `hooks.ts` → `useCreateLead` | TanStack Query | wrapper async em torno de `createLead()` |
| 6 | `createLead()` | `api.ts` | data-access | `buildCreateLeadPayload` → `apiClient.post` |
| 7 | `fetch('/api/leads')` | `api-client.ts` | Browser fetch | POST same-origin para BFF Next.js |
| 8 | Route BFF | `apps/web/app/api/leads/route.ts` | Next.js App Router | `request.json()` → `backendFetch` → `proxyBackendResponse` |
| 9 | `backendFetch()` | `apps/web/lib/api/backend.ts` | Server-side fetch | cookies/token → `fetch(API_INTERNAL_URL/api/v1/leads)` |
| 10 | Controller | `leads.controller.ts` | NestJS | `@Post()` `createLead` |
| 11 | Service | `leads.service.ts` | NestJS | `createLead()` → resolve owner → Prisma |
| 12 | Prisma | `leads.service.ts` | Prisma | `this.prisma.lead.create(...)` |

---

## Logs temporários `[BUG006]` (onde olhar)

### Browser DevTools → Console

| Log | Significa |
|-----|-----------|
| `[BUG006] Salvar Lead click` | Botão clicado (antes do submit) |
| `[BUG006] handleSubmit enter` | Form submit disparado |
| `[BUG006] react-hook-form skipped` | Confirma: não há RHF neste fluxo |
| `[BUG006] handleSubmit calling onSubmit` | Payload montado, vai chamar mutation |
| `[BUG006] handleSubmit exit` | handleSubmit terminou (mutate é async fire-and-forget) |
| `[BUG006] mutate` | `createLead.mutate()` chamado |
| `[BUG006] mutationFn enter` | React Query executou mutationFn |
| `[BUG006] createLead() enter` | Função HTTP do data-access |
| `[BUG006] createLead() payload built` | Payload normalizado |
| `[BUG006] POST /api/leads start` | **fetch do browser iniciou** |
| `[BUG006] POST /api/leads fetch returned` | **fetch do browser recebeu headers/status** |
| `[BUG006] response parsed` | Body parseado |
| `[BUG006] POST /api/leads success` | Fluxo cliente OK |
| `[BUG006] createLead() exit` | Mutation concluída no cliente |
| `[BUG006] mutationFn exit` | mutationFn concluída |
| `[BUG006] mutate onSuccess` | Dialog deve fechar |

### Terminal Next.js (web :3000)

| Log | Significa |
|-----|-----------|
| `[BUG006] apps/web/app/api/leads/route.ts POST enter` | BFF recebeu POST |
| `[BUG006] route.ts body parsed` | JSON do body OK |
| `[BUG006] backendFetch start` | Vai chamar API Nest |
| `[BUG006] backendFetch enter` | Dentro de backendFetch |
| `[BUG006] backendFetch token resolved` | Token de API obtido (ou null) |
| `[BUG006] backendFetch calling NestJS` | fetch para `:4000` iniciando |
| `[BUG006] backendFetch NestJS first response` | API respondeu (status) |
| `[BUG006] backendFetch exit` | backendFetch concluído |
| `[BUG006] backendFetch end` | Voltou ao route handler |
| `[BUG006] route.ts response proxied` | Resposta enviada ao browser |

### Terminal API NestJS (:4000)

| Log | Significa |
|-----|-----------|
| `[BUG006] controller createLead enter` | Request chegou ao controller |
| `[BUG006] service createLead enter` | Service iniciou |
| `[BUG006] prisma create start` | Antes do INSERT |
| `[BUG006] prisma create end` | INSERT concluído |
| `[BUG006] service createLead exit` | Serialização OK |
| `[BUG006] controller createLead exit` | Response saindo do Nest |

---

## Como identificar o último log executado

1. Reproduzir: **Leads → Novo lead → preencher Nome → Salvar lead**.
2. Abrir **Console** do browser (F12).
3. Abrir terminal do **Next.js** (`web`).
4. Abrir terminal da **API** (`api`).
5. Anotar o **último log `[BUG006]`** em cada camada.

### Interpretação rápida (request pendente na Network)

| Último log visível | O fluxo parou em |
|--------------------|------------------|
| `POST /api/leads start` (browser) — sem `fetch returned` | **BFF Next.js não respondeu** → ver terminal web |
| `backendFetch start` — sem `backendFetch end` | **backendFetch travado** (token ou fetch Nest) |
| `backendFetch calling NestJS` — sem `NestJS first response` | **API Nest não responde / inacessível / hang** |
| `backendFetch end` — sem `route.ts response proxied` | **proxyBackendResponse** (leitura do body backend) |
| `route.ts response proxied` — sem `fetch returned` no browser | Problema raro de streaming/resposta Next → browser |
| `controller enter` — sem `prisma create start` | **Service** (resolve owner / ownership) |
| `prisma create start` — sem `prisma create end` | **Banco / Prisma / lock** |
| `prisma create end` — sem `controller exit` | Serialização / exceção pós-create |

---

## Observação importante: react-hook-form

O fluxo **não passa por react-hook-form**. O `LeadDialog` usa:

- `<form onSubmit={handleSubmit}>`
- `useState<LeadDialogFormState>` para campos
- validação mínima: `if (!form.name.trim()) return`

Se a auditoria foi baseada em RHF, o passo 3 deve ser ignorado — o log `[BUG006] react-hook-form skipped` confirma isso em runtime.

---

## Hipótese inicial (pré-runtime local)

Sintoma **POST pendente sem status** na Network indica que o **Route Handler do Next.js ainda não finalizou** a `Response`. Ou seja:

- O browser **entrou** no passo 7 (`fetch` enviado).
- O handler BFF (passo 8) **não retornou** ainda.

Causas mais prováveis (a confirmar pelos logs):

1. **`backendFetch` aguardando NestJS** — API lenta, down, ou request sem resposta (timeout longo).
2. **Resolução de token** — `getAccessToken` / `refreshAccessToken` com fetch encadeado pendente.
3. **Prisma/DB hang** — se logs chegam até `prisma create start` e param.
4. **Menos provável no cliente:** mutation nunca disparada — nesse caso **não haveria** POST na Network; como há POST, passos 1–7 executaram pelo menos até `fetch start`.

---

## Arquivos instrumentados (remover após diagnóstico)

- `apps/web/components/leads/leads-page.tsx`
- `apps/web/lib/data-access/modules/leads/hooks.ts`
- `apps/web/lib/data-access/modules/leads/api.ts`
- `apps/web/lib/data-access/api-client.ts`
- `apps/web/app/api/leads/route.ts`
- `apps/web/lib/api/backend.ts`
- `apps/api/src/modules/leads/leads.controller.ts`
- `apps/api/src/modules/leads/leads.service.ts`

---

## Próximo passo

Reproduzir uma vez com os três terminais visíveis e registrar:

> **Último log executado:** `[BUG006] ...` em (browser | web | api)

Com isso a correção pode ser feita de forma cirúrgica no ponto exato do bloqueio.

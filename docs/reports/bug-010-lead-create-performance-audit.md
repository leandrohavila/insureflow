# BUG-010 — Auditoria de Performance do Cadastro de Lead

**Data:** 2026-07-23  
**Status:** Instrumentado e medido  
**Cenário medido:** criação de Lead local com usuário `admin@insureflow.com`  
**Lead de teste:** `BUG010 Performance Test 1705`  
**Trace ID:** `lead-create-1210989f-f6a5-4665-87a0-66eec4a8045c`

## Instrumentação Aplicada

Frontend:

- `[BUG010][frontend] submit start`
- `[BUG010][frontend] resposta recebida`
- `[BUG010][frontend] fechamento modal`
- `[BUG010][frontend] invalidateQueries start`
- `[BUG010][frontend] refresh completo`

BFF:

- `[BUG010][bff] request recebida`
- `[BUG010][bff] chamada backend start`
- `[BUG010][bff] resposta backend`

API:

- `[BUG010][api] request recebida`
- `[BUG010][api] ValidationPipe CreateLeadDto`
- `[BUG010][api] Controller createLead start`
- `[BUG010][api] Service createLead start/end`
- `[BUG010][api] resposta enviada`

Prisma:

- `[BUG010][prisma] INSERT lead start/end`
- `[BUG010][prisma] transaction`

## Tempos Medidos

Frontend percebido:

- Submit start: `0 ms`
- Fetch browser `POST /api/leads`: `124.20 ms`
- Callback `resposta recebida`: `6,136.70 ms` após submit
- `invalidateQueries start`: `6,138.10 ms` após submit
- Fetch browser `GET /api/leads?page=1&limit=500`: `118.50 ms`
- Fetch browser `GET /api/leads?page=1&limit=10`: `110.00 ms`
- `refresh completo`: `18,119.20 ms` após submit
- Tempo da invalidação até resolução do refresh: `11,981.10 ms`
- Fechamento modal: instrumentado, mas este run não registrou o evento no console capturado.

BFF:

- A instrumentação foi adicionada no route handler.
- Os logs do servidor Next.js não estavam disponíveis nos terminais do Cursor nesta execução.
- Pelo Resource Timing do browser, `POST /api/leads` completo levou `124.20 ms`.
- Como a API respondeu em `62.64 ms`, o overhead total browser+BFF+proxy observado para o POST ficou em aproximadamente `61.56 ms`.

API:

- Request recebida: registrada.
- ValidationPipe `CreateLeadDto`: `1.09 ms`
- Service total: `48.22 ms`
- Controller até service resolvido: `53.81 ms`
- Controller até `finish`: `57.66 ms`
- API total até resposta enviada: `62.64 ms`

Prisma:

- Transaction explícita: `0 ms` (`createLead` não usa transaction explícita)
- `INSERT lead`: `23.41 ms`

## Tempo Total

- Tempo HTTP real visto pelo browser para o POST: `124.20 ms`
- Tempo até callback frontend de resposta: `6,136.70 ms`
- Tempo até refresh completo reportado pelo React Query: `18,119.20 ms`
- Meta local: `< 500 ms`
- Resultado percebido neste run: **fora da meta** quando considerado o callback/refresh do frontend.

## Gargalo Encontrado

O gargalo não está no Prisma nem na API.

A API completa respondeu em `62.64 ms`, com `23.41 ms` no INSERT. O browser também registrou o recurso `POST /api/leads` como finalizado em `124.20 ms`.

O atraso aparece depois que o recurso HTTP já terminou:

- O código frontend só registrou `resposta recebida` cerca de `6.1 s` após o submit.
- O `invalidateQueries` só concluiu cerca de `18.1 s` após o submit, embora os dois GETs de refresh tenham durado apenas `~110-118 ms` no Resource Timing.

Isso aponta para atraso no runtime frontend em dev, fila/event loop do browser, React Query/invalidation lifecycle, ou interferência do overlay de erro/hidratação do Next.js. Durante a medição havia overlay de hydration error visível no app.

## Recomendações

- Não otimizar ainda o Prisma/API: os tempos medidos estão bem abaixo da meta de 500 ms.
- Repetir a medição com o console/terminal do Next.js visível para capturar os logs `[BUG010][bff]`.
- Repetir a medição com o overlay de hydration error resolvido/desativado para confirmar se ele afeta o event loop no ambiente local.
- Medir Long Tasks no browser durante a criação para confirmar bloqueio de main thread entre `responseEnd` e callback da mutation.
- Auditar por que `invalidateQueries({ queryKey: queryKeys.leads.all })` dispara múltiplas listas (`limit=500` e `limit=10`) e por que a promise resolve muito depois dos recursos HTTP terminarem.
- Só depois dessas medições decidir otimização. O candidato atual a gargalo é o ciclo frontend pós-resposta, não o backend.

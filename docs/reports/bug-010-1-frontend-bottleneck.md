# BUG-010.1 — Gargalo do Frontend após criação de Lead

**Data:** 2026-07-24  
**Status:** Instrumentado; medição reaproveitada de trace local disponível  
**Trace medido:** `lead-create-15e3542c-4bcc-4530-a077-beedd01f551d`  
**Escopo:** criação de Lead em `/leads`, sem otimizações aplicadas

## Instrumentação adicionada

- Timeline central em `window.__BUG010_LEAD_CREATE_TIMELINE__`.
- Eventos `[BUG010.1][frontend]` com tempo relativo desde o submit.
- Eventos para:
  - `POST iniciado`
  - `POST concluído`
  - `createLead mutation start`
  - `mutation.onSuccess`
  - `closeModal()`
  - `toast.success()`
  - `invalidateQueries()`
  - refetch implícito acionado por `invalidateQueries`
  - cada query React Query observada pelo `QueryCache`
  - render de cards
  - render de tabela
  - render de dashboard quando o dashboard estiver montado

## Linha do tempo medida

```text
00.1 ms     submit start
09.4 ms     createLead mutation start
10.6 ms     POST iniciado (/api/leads)
5,497.8 ms  POST concluído
5,497.9 ms  createLead mutation end
5,498.1 ms  mutation.onSuccess
5,498.5 ms  invalidateQueries start
5,498.8 ms  refetchQueries implícito start
5,499.2 ms  Query leads limit=500 start
5,499.9 ms  Query leads limit=10 start
49,546.1 ms Query leads limit=500 end (44,046.9 ms)
51,124.4 ms Query leads limit=10 end (45,624.5 ms)
51,125.5 ms invalidateQueries end (45,627.1 ms)
51,125.9 ms refetchQueries implícito end (45,627.1 ms)
```

Eventos `closeModal()` e `toast.success()` foram adicionados após esse trace. Uma nova medição pelo browser não foi concluída porque o runtime web passou a servir `/login` como 404, impedindo login/reprodução. O typecheck do web passou após a instrumentação.

## Queries React Query

Somente duas queries de dados foram executadas após `invalidateQueries()`:

```text
Query: leads limit=500 ........ 44,046.9 ms
Query: leads limit=10 ......... 45,624.5 ms
```

O `QueryCache` também listou queries ativas de `duplicates` e `context`, mas elas não refetcharam nesse trace.

## Renders

Durante a timeline foram registrados:

- `Render tabela`: 624 eventos.
- `Render cards`: 623 eventos.
- `Render dashboard`: 0 eventos, porque o dashboard não estava montado na rota `/leads`.

Maiores renders individuais da tabela:

```text
Render tabela ................. 263.5 ms
Render tabela ................. 262.5 ms
Render tabela ................. 259.7 ms
Render tabela ................. 247.7 ms
Render tabela ................. 224.5 ms
Render tabela ................. 219.2 ms
```

Os renders são caros e numerosos, mas não explicam sozinhos os 5,5s do POST. Eles agravam muito o tempo total depois que o refetch começa.

## Cruzamento com API

Para o mesmo trace:

```text
ValidationPipe CreateLeadDto ... 0.96 ms
Prisma INSERT .................. 31.28 ms
Service createLead ............. 65.50 ms
Controller até service ......... 67.33 ms
API total até resposta ......... 76.94 ms
```

A API recebeu e respondeu no mesmo segundo (`17:56:22`). O frontend, porém, só registrou `POST concluído` em `5,497.8 ms`.

Os GETs de refresh também chegaram à API em `17:56:27` e a API serializou as listas no mesmo segundo, mas o frontend só encerrou as queries em `49-51s`.

## Gargalo identificado

O gargalo dos ~6 segundos não está no Prisma, Service, Controller ou ValidationPipe.

O atraso principal antes do `mutation.onSuccess` está entre o browser/BFF/Next dev server e a resolução do `fetch('/api/leads')` no frontend:

```text
POST frontend medido ........... 5,487.2 ms
API total ...................... 76.94 ms
Diferença não explicada pela API ~5,410 ms
```

Depois do sucesso, há um gargalo ainda maior no refresh:

```text
invalidate/refetch total ....... 45,627.1 ms
API GETs terminaram no mesmo segundo em que começaram
Diferença provável ............. camada web/BFF/dev server/browser runtime
```

## Recomendações de próxima medição

- Capturar logs `[BUG010][bff]` no terminal real do Next.js, porque o processo web atual não está nos terminais do Cursor.
- Repetir o trace com `/login` funcionando para capturar `closeModal()` e `toast.success()` na timeline nova.
- Medir `apiClient.request()` em granularidade interna: `fetch start`, `headers received`, `body parsed`, `request resolved`.
- Medir o route handler BFF também com `response.text/json` e `proxyBackendResponse`, porque a API é rápida e o tempo está desaparecendo entre API e frontend.
- Medir Long Tasks no browser durante o intervalo entre `POST iniciado` e `POST concluído`.
- Investigar por que há centenas de commits de `DataTable`/cards durante a operação, mas sem aplicar otimização ainda.

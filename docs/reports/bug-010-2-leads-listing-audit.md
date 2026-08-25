# BUG-010.2 — Auditoria da listagem de Leads

**Data:** 2026-07-24  
**Status:** Instrumentado; medição runtime atual bloqueada  
**Escopo:** `GET /api/leads?page=1&limit=500` após criação de Lead  
**Trace analisado:** `lead-create-15e3542c-4bcc-4530-a077-beedd01f551d`

## Instrumentação adicionada

Controller API:

- Início de `findLeads`
- Service resolvido
- Response `finish`

Service API:

- Paginação/filtros
- Cálculos de filtros agregados
- Transaction Prisma da listagem
- Relacionamentos carregados no `include`
- Última atividade (`activity.groupBy`)
- Questionários
- Commercial Score
- DTO mapping
- Cálculo de meta/paginação
- Fim do service

Prisma:

- Evento SQL via `PrismaService` com `query`, `params` e `durationMs`
- Filtro para queries envolvendo `leads` e `activities`

BFF:

- Início do GET `/api/leads`
- Tempo de `backendFetch`
- Tempo de leitura do body retornado pela API
- Bytes transferidos do backend para o BFF

Frontend:

- Fetch start/response para GET `/api/leads`
- Transferência/leitura do body
- `JSON.parse`
- `normalizeLeadList` / Map DTO
- React Query por query ativa
- Render de tabela
- Render de cards
- Render de dashboard quando montado

## Timeline disponível

Trace reaproveitado de uma execução local anterior:

```text
0.1 ms       submit start
9.4 ms       createLead mutation start
10.6 ms      POST iniciado
5,497.8 ms   POST concluído
5,498.1 ms   mutation.onSuccess
5,498.5 ms   invalidateQueries start
5,498.8 ms   refetchQueries implícito start
5,499.2 ms   Query leads limit=500 start
5,499.9 ms   Query leads limit=10 start
49,546.1 ms  Query leads limit=500 end
51,124.4 ms  Query leads limit=10 end
51,125.5 ms  invalidateQueries end
51,125.9 ms  refetchQueries implícito end
```

## Medição por etapa solicitada

```text
SELECT Prisma .............. não medido no trace antigo; agora instrumentado por SQL event
Map DTO API ................ não medido no trace antigo; agora instrumentado
Relacionamentos ............ ownerUser via include principal; agora instrumentado
Questionários .............. 0 ms esperado; listagem não consulta questionários
Última atividade ........... API executou activity aggregate no mesmo segundo; agora instrumentado com duração
Commercial Score ........... 0 ms esperado; listagem não calcula score comercial
JSON.stringify ............. não isolado pelo Nest; proxy BFF mede body read/bytes
Transferência .............. 44,046.9 ms no GET limit=500 visto pelo frontend/React Query
JSON.parse ................. não isolado no trace antigo; agora instrumentado no apiClient
Renderização React ......... centenas de renders; maior render tabela individual 263.5 ms
```

## Cruzamento com API

No mesmo período do trace, a API registrou:

```text
POST create Lead:
ValidationPipe ............. 0.96 ms
Prisma INSERT .............. 31.28 ms
Service createLead ......... 65.50 ms
API total POST ............. 76.94 ms

GET list Leads:
findLeads limit=500 iniciou em 17:56:27
findLeads limit=10 iniciou em 17:56:27
activity aggregate concluiu em 17:56:27
serialize findLeads concluiu em 17:56:27
```

Ou seja: no trace disponível, a API iniciou e concluiu as listagens dentro do mesmo segundo. O frontend/React Query, porém, só encerrou:

```text
limit=500 ................. 44,046.9 ms depois do start
limit=10 .................. 45,624.5 ms depois do start
```

## Gargalo identificado

Com os dados disponíveis, os ~45 segundos não estão comprovadamente no Prisma, DTO mapping, questionários, última atividade ou render React.

O tempo foi consumido na operação de fetch/refetch vista pelo frontend:

```text
Query leads limit=500 start -> end = 44,046.9 ms
Query leads limit=10 start -> end  = 45,624.5 ms
```

Como a API registrou as listagens no mesmo segundo, o gargalo está entre uma destas etapas:

- BFF Next.js (`/api/leads`) aguardando/encaminhando resposta
- leitura do body no BFF
- transferência BFF -> browser
- resolução do `fetch` no browser
- leitura do body/`JSON.parse` no frontend

A instrumentação BUG-010.2 adicionada agora separa exatamente esses pontos na próxima execução.

## Medição nova

Não foi possível executar uma nova medição completa nesta sessão:

- `/login` está retornando 404 no runtime web atual.
- `POST /api/auth/login` via BFF retornou 500.
- `http://localhost:4000/api/v1/auth/login` não estava acessível na tentativa direta.

Resultado: não usei a tentativa nova como evidência. O relatório usa o trace local válido já existente e registra a instrumentação necessária para repetir com runtime saudável.

## Próximo passo de medição

Com web e API saudáveis, reproduzir criação de Lead e extrair:

```js
window.__BUG010_LEAD_CREATE_TIMELINE__
```

O novo trace deve mostrar separadamente:

```text
Frontend GET /api/leads fetch start
Frontend GET /api/leads fetch response
Frontend GET /api/leads transferência body
Frontend GET /api/leads JSON.parse
Frontend Map DTO leads
Query: ["leads","list",...] end
Render tabela
Render cards
```

Não aplicar otimização antes dessa nova amostra.

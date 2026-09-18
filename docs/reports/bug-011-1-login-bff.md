# BUG-011.1 — Login 500 (BFF)

**Data:** 2026-07-24  
**Status:** Instrumentado; 500 não reproduzido após reiniciar BFF controlado  
**Escopo:** `POST /api/auth/login` no BFF Next.js

## Instrumentação aplicada

Arquivos instrumentados:

- `apps/web/app/api/auth/login/route.ts`
- `apps/web/lib/auth/session.ts`
- `apps/web/lib/api/backend.ts`

Observação importante: o fluxo de login **não usa `backendFetch()`**. A rota chama `loginWithBackendCredentials()`, que faz `fetch()` direto para a API em:

```text
${API_INTERNAL_URL ?? API_URL ?? "http://localhost:4000"}/api/v1/auth/login
```

`backendFetch()` foi instrumentado também para confirmar uso em outros BFF routes, mas ele não apareceu no caminho de login.

## Reproduções

### Tentativa com BFF existente

Resultado:

```text
POST http://localhost:3000/api/auth/login
Erro: impossível conectar-se ao servidor remoto
```

Também:

```text
GET http://localhost:3000/api/auth/login
BFF indisponível
```

API no mesmo momento:

```text
GET http://localhost:4000/api/v1/health
200 {"status":"ok","service":"insureflow-api",...}
```

Conclusão dessa tentativa: o processo BFF que estava causando o problema não estava acessível nos terminais controlados da sessão.

### Tentativa com BFF reiniciado em terminal controlado

Com `npm run dev -w apps/web`, Next iniciou:

```text
Next.js 16.2.0 (Turbopack)
Local: http://localhost:3000
Ready in 753ms
```

Reprodução:

```text
POST http://localhost:3000/api/auth/login
Status: 200
Body: {"user":{"id":"cmp7m96dd000u10zoas68i4qe","email":"admin@insureflow.com","name":"admin","role":"admin","roleLabel":"Administrador","organizationName":"insureflow"}}
```

## Logs capturados

### 1. URL chamada

BFF:

```text
http://localhost:3000/api/auth/login
```

API chamada pelo BFF:

```text
http://localhost:4000/api/v1/auth/login
```

### 2. Payload enviado

```json
{
  "email": "admin@insureflow.com",
  "tenantSlug": "insureflow",
  "password": "[REDACTED]"
}
```

### 3. Status HTTP recebido da API

```text
201
```

### 4. Body recebido

Body da API recebido pelo BFF, redigido:

```json
{
  "accessToken": "[REDACTED]",
  "refreshToken": "[REDACTED]",
  "expiresIn": "15m",
  "user": {
    "sub": "cmp7m96dd000u10zoas68i4qe",
    "email": "admin@insureflow.com",
    "tenantId": "cmp7m966u000o10zo1lhbgl5k",
    "tenantSlug": "insureflow",
    "roles": ["admin"],
    "dataScope": "own",
    "teamIds": []
  }
}
```

### 5. Stack completa

Na reprodução controlada não houve exceção, portanto não houve stack de erro.

### 6. Erro original

Na reprodução controlada: nenhum erro original.

Na tentativa anterior sem BFF controlado:

```text
Impossível conectar-se ao servidor remoto
```

### 7. `response.text()`

`response.text()` foi lido com sucesso no BFF. O conteúdo era o JSON de login da API com tokens, redigido no relatório.

### 8. `response.json()`

`response.json()` foi lido com sucesso no BFF. A estrutura continha `accessToken`, `refreshToken`, `expiresIn` e `user`.

### 9. Headers

Headers relevantes da API para o BFF:

```text
content-type: application/json; charset=utf-8
content-length: 1641
connection: keep-alive
x-ratelimit-limit: 30
x-ratelimit-remaining: 29
```

Headers do BFF para o cliente incluíram cookies de sessão e tokens API (`HttpOnly`, redigidos neste relatório).

### 10. `API_INTERNAL_URL`

No BFF controlado:

```text
API_INTERNAL_URL=null
API_URL=null
Base efetiva=http://localhost:4000
```

## Conclusão

O 500 não foi reproduzido após reiniciar o BFF em um processo controlado. Com a API saudável, o BFF atual:

- chamou `http://localhost:4000/api/v1/auth/login`;
- recebeu `201` da API;
- leu `response.text()` com sucesso;
- leu `response.json()` com sucesso;
- criou a sessão;
- respondeu `200` para o cliente.

Portanto, a evidência desta auditoria aponta para um problema de **estado/processo do BFF anterior** (processo Next indisponível, travado, desatualizado ou com erro runtime), não para falha na API nem para erro determinístico no código atual do login.

## Próxima medição se o 500 voltar

Com a instrumentação aplicada, reproduzir o erro no mesmo processo que retorna 500 e capturar no terminal:

```text
[BUG011.1][BFF login route] request
[BUG011.1][loginWithBackendCredentials] request
[BUG011.1][loginWithBackendCredentials] response
[BUG011.1][loginWithBackendCredentials] fetch error
[BUG011.1][BFF login route] error
```

Esses logs agora incluem URL, payload sem senha, status, headers, `response.text()`, `response.json()`, `API_INTERNAL_URL`, erro original e stack.

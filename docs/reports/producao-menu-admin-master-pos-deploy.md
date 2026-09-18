# Auditoria pós-deploy — menu Admin Master (produção)

**Data:** 2026-08-28  
**Modo:** somente leitura — **nenhum código de produto alterado**  
**Alvo declarado:** commit `d9d9a3144d349a4525e78a1a4ba21eb67c05fad0`  
(`feat: admin master navigation and real estate permissions`, 2026-08-27 22:23:38 -03)

---

## Veredicto

O commit **não está no build ativo**. Produção continua **atrás** da correção.

| Camada | Live | Esperado (`d9d9a31`) |
|--------|------|----------------------|
| Web `https://corretoraavila.com.br` | `c7673fd` (25/08/2026) | `d9d9a31` ou descendente |
| API `https://api.corretoraavila.com.br` | `17d1645` (24/08/2026) | `d9d9a31` ou descendente |
| Migration `20260827214500_admin_properties_view` | **não executada** | presente em `_prisma_migrations` |
| `properties:view` / `properties:manage` | **não existem** na tabela `permissions` | ligadas ao role `admin` |
| Menu Admin Master | **não existe** no JS deployado | `resolveOperationalNav` → `adminNavGroups` |

O git remoto `origin/release/crm-operacao-avila` **já contém** `d9d9a31` (tip `3b07e08`). O que faltou foi **publicar**: Vercel (web) + Railway (API, que no boot faz `prisma migrate deploy`).

Sintoma esperado em produção hoje, admin + **Ávila Imóveis**: sidebar só com **Dashboard** e **Configurações**.

---

## 1. Commit da WEB em `https://corretoraavila.com.br`

**SHA:** `c7673fd2316a44be4a53378ce3473399309d0a91`  
**Mensagem:** `feat(governance): add read-only RBAC Governança module (Fase 2A)`  
**Branch no deploy:** `release/crm-operacao-avila`  
**Quando:** 2026-08-25 20:56:48 -03 (`2026-08-25T23:56:48Z`)

| Campo Vercel | Valor |
|--------------|-------|
| Deployment | `dpl_BYEhu7iYNdSg7wVHNdcqneFxNWJd` |
| Aliases | `corretoraavila.com.br`, `www.corretoraavila.com.br` |
| Status | Ready / Production |
| Região live | `gru1` (`x-vercel-id`) |
| Cache login | `x-vercel-cache: HIT` (HTML ~2,8 dias) |
| Extra | `gitDirty: "1"` no momento do deploy |

`GET /login` → **200**. `GET /api/auth/me` sem cookie → **401** `{"error":"Não autenticado"}`.

No SHA live **não existem** `isAdminMaster`, `resolveOperationalNav` nem `adminNavGroups`. O sidebar usa:

```
useOperationalNav
  → realEstate ? realEstateNav : mainNav
  → filterNavBySession(session)
```

---

## 2. Commit da API em produção

**SHA efetivo:** `17d1645a7471516eb4b3c7961c96c431a73266d5`  
**Mensagem git:** `docs(rel001): align report hash to release tip`  
**Deploy Railway:** `REL-001: deploy release/crm-operacao-avila 17d1645` (upload CLI, sem `commitHash` no meta)

| Campo Railway | Valor |
|---------------|-------|
| Projeto | `thorough-spirit` |
| Serviço | `insureflow-api` |
| Env | `production` · Online |
| Deployment ID | `b9298c04-cb37-4d23-97a7-b5066fef6592` |
| Status | SUCCESS (atual) |
| Criado | 2026-08-24 22:00:34 -03 |

`GET /api/v1/health/runtime` (2026-08-28):

```json
{
  "version": "0.0.1",
  "commit": "unknown",
  "startedAt": "2026-08-25T01:03:28.605Z",
  "environment": "production",
  "pid": 98,
  "runtime": "production"
}
```

O processo **não foi reiniciado** desde o boot de 25/08. `commit: unknown` é o fallback do runtime (sem `.git` na imagem). O SHA acima vem do **CLI Railway**, não do endpoint. Health DB e Redis: **200** / connected.

`17d1645` é **ancestral** de `c7673fd` e de `d9d9a31`. A API live é anterior à Governança Fase 2A **e** à correção do menu.

---

## 3. O commit `d9d9a31` está no build ativo?

**Não.**

| Check | Resultado |
|-------|-----------|
| Ancestral de Vercel `c7673fd`? | **Não** (`merge-base --is-ancestor` exit 1) |
| Ancestral de Railway `17d1645`? | **Não** (é **descendente**; `c7673fd` e `17d1645` são anteriores) |
| Ancestral de `origin/release/crm-operacao-avila` (`3b07e08`)? | **Sim** |
| Deploy Vercel production com esse SHA? | **Não** |
| Deploy Railway production com esse SHA? | **Não** |
| GitHub deployments / check-runs desse SHA? | **vazio** (`total_count: 0`) |

Commits no branch de release **depois** do live web:

```
3b07e08 docs: confirm admin master navigation push to production branch
1cf5c38 docs: record admin master navigation deploy prep
d9d9a31 feat: admin master navigation and real estate permissions
c7673fd feat(governance): add read-only RBAC Governança module (Fase 2A)   ← WEB live
…
17d1645 docs(rel001): align report hash to release tip                     ← API live
```

O código está no GitHub. **Não foi promovido** para Vercel nem Railway.

---

## 4. Migration `20260827214500_admin_properties_view`

**Não executada.**

SQL direto no Neon de produção (host `ep-flat-grass-…-pooler.c-3.us-east-2.aws.neon.tech` / DB `insureflow`, URL redigida):

```sql
SELECT migration_name, finished_at, applied_steps_count, rolled_back_at
FROM "_prisma_migrations"
ORDER BY finished_at;
```

**29** linhas. Nenhuma rollback. Última:

| migration_name | finished_at |
|----------------|-------------|
| `20260824180000_re004_property_production` | 2026-08-24T20:36:38.119Z |

`HAS_20260827214500_admin_properties_view` = **no**.

Lista completa aplicada: `20260220120000_enterprise_init` … até `20260824180000_re004_property_production` (inventário imobiliário no schema, **sem** backfill ACL `properties:*` no role admin).

O boot da API (`start-release.cjs`) só aplicaria essa migration se a **imagem** contivesse o SQL — a imagem live é `17d1645`, que **não** tem esse ficheiro.

---

## 5. Permissões do role `admin` (SQL direto)

Colunas reais Prisma: `"permissionId"` / `"roleId"` (não `permission_id` / `role_id`). Query equivalente:

```sql
SELECT p.key
FROM permissions p
JOIN role_permissions rp ON rp."permissionId" = p.id
JOIN roles r ON r.id = rp."roleId"
WHERE r.slug = 'admin'
ORDER BY p.key;
```

**27 chaves:**

```
audit:view
automation:manage
automation:view
business-units:manage
business-units:view-all
claims:manage
claims:view
clients:manage
clients:view
crm:manage
crm:view
dashboard:view
leads:manage
leads:share
leads:view
policies:manage
policies:view
questionnaires:manage
questionnaires:view
quotes:manage
quotes:view
settings:manage
settings:view
tenants:manage
users:manage
whatsapp:manage
whatsapp:view
```

---

## 6. Existem `properties:view` e `properties:manage`?

**Não**, em nenhum dos dois sítios.

```sql
SELECT key FROM permissions
WHERE key IN ('properties:view', 'properties:manage')
ORDER BY key;
```

Resultado: `[]`.

| Check | Resultado |
|-------|-----------|
| Linha em `permissions` · `properties:view` | **não** |
| Linha em `permissions` · `properties:manage` | **não** |
| Ligada ao slug `admin` | **não** |
| Ligada ao slug `super_admin` | não verificada além do catálogo vazio dessas chaves |

O schema de imóveis (`20260824140000_real_estate_inventory`) está aplicado. O **catálogo RBAC** das duas chaves **não**.

---

## 7. JWT gerado para `admin@insureflow.com`

`POST https://api.corretoraavila.com.br/api/v1/auth/login`  
tenant `insureflow` · HTTP **201**. Tokens **não** reproduzidos.

Claims do **access token da API** (payload decodificado, 2026-08-28T19:08Z):

```json
{
  "sub": "cmplu9tsa000wkw18h7akmv0z",
  "email": "admin@insureflow.com",
  "tenantId": "cmplu9lco000okw18md6aytow",
  "tenantSlug": "insureflow",
  "roles": ["admin"],
  "currentBusinessUnitId": "cmt9a5t900003kwjcabtgzvv9",
  "dataScope": "tenant",
  "permissionCount": 27
}
```

TTL ~15 min (`iat` → `exp`). Claim `role` (singular) **ausente** no JWT da API; o BFF web é quem deriva `session.role`.

`GET /api/v1/business-units/context` (Bearer do mesmo login) → **200**:

| id | nome | slug | type | atual? |
|----|------|------|------|--------|
| `cmt9a5swk0001kwjcvoizgkd7` | Corretora Ávila | `corretora-avila` | `INSURANCE` | |
| `cmt9a5t900003kwjcabtgzvv9` | Ávila Imóveis | `avila-imoveis` | `REAL_ESTATE` | **sim** |

`canViewAll`: **true**.

---

## 8. `session.role` / `session.roles` / `permissions`

O cookie `insureflow-session` **não** é o JWT da API. O BFF em `c7673fd` mapeia `roles[0]` e **não** grava `roles[]` no cookie.

| Campo | Origem | Valor em produção neste login |
|-------|--------|-------------------------------|
| `session.role` | BFF: `API_ROLE_TO_APP_ROLE[roles[0]]` | `"admin"` |
| `session.roles` | cookie `c7673fd` | **`undefined`** (campo inexistente no token web) |
| `session.permissions` | copiado do JWT da API | as **27** chaves da secção 5 |
| `session.currentBusinessUnitId` | JWT / login | `cmt9a5t900003kwjcabtgzvv9` (Ávila Imóveis) |
| `session.dataScope` | JWT | `"tenant"` |

`properties:view` = **false** · `properties:manage` = **false**.

O mapa de roles no SHA live **não** inclui `super_admin`. Há uma role só (`admin`); o bug **não** é “caiu em viewer por ordem do array”.

Se o web `d9d9a31` estivesse no ar, o mesmo login passaria a persistir `session.roles = ["admin"]` e `session.role = "admin"` (primário preferindo admin). Isso **não** ocorre hoje.

---

## 9. Menu: `resolveOperationalNav()` vs o que produção realmente usa

### Produção (SHA web `c7673fd`)

**`resolveOperationalNav` não existe.** Equivalente: `useOperationalNav` + `filterNavBySession` + `hasPermission` (bypass só para `super_admin`; `admin` **não** ignora ACL).

Contexto de empresa (`isRealEstateContext`):

| Seletor | `currentBusinessUnitId` | `realEstate` | Lista base |
|---------|-------------------------|--------------|------------|
| **Todas** | `null` (e há 2 BUs) | **false** | `mainNav` |
| **Corretora Ávila** | BU `INSURANCE` | **false** | `mainNav` |
| **Ávila Imóveis** | BU `REAL_ESTATE` | **true** | `realEstateNav` |

`mainNav` neste SHA ainda é o menu **longo** (inclui CRM hub, Apólices, Sinistros, WhatsApp). `realEstateNav` inclui Visitas.

Com o JWT de 27 permissões (todas as chaves de seguros/CRM/settings presentes; **sem** `properties:*`):

#### Todas

```
Dashboard
CRM
Clientes
Leads
Questionários
Cotações
Propostas
Apólices
Sinistros
WhatsApp
Automação
Configurações
```

#### Corretora Ávila

O mesmo que **Todas** (mesma lista `mainNav`, mesmo filtro).

#### Ávila Imóveis

```
Dashboard          dashboard:view     KEEP
Imóveis            properties:view    DROP
Proprietários      properties:view    DROP
Leads Imobiliários properties:view    DROP
Visitas            properties:view    DROP
Portal             properties:view    DROP
Configurações      settings:view      KEEP
```

Menu efetivo: **Dashboard**, **Configurações**.

Não há grupos CRM / Seguros / Imobiliário / Governança. Não há Usuários / Perfis / ACL no sidebar.

### Simulação se `d9d9a31` estivesse no ar (mesmo JWT)

`isAdminMaster(session.roles ?? session.role)`  
→ `undefined ?? "admin"` → `"admin"` → **true**.

`resolveOperationalNav` devolveria **`adminNavGroups` inteiro**, **sem** `filterNavBySession`, **igual** nas três empresas:

```
Dashboard

CRM
  Leads
  Pipeline
  Clientes
  Customer 360

Seguros
  Questionários
  Cotações
  Propostas
  Automação

Imobiliário
  Imóveis
  Proprietários
  Leads Imobiliários
  Portal

Governança
  Usuários
  Perfis
  ACL
  Configurações
```

O menu master **não** depende de `properties:view`. As **páginas** `/real-estate/*` **sim** — enquanto a migration não rodar, o sidebar novo apareceria, mas as rotas imobiliárias continuariam bloqueadas por ACL.

---

## Cadeia de causa (produção agora)

1. Web live = `c7673fd` — escolhe `mainNav` vs `realEstateNav`; sempre filtra ACL. Sem Admin Master.
2. API live = `17d1645` — boot de 25/08; migrate do dia 27 **nunca** entrou na imagem.
3. Neon sem as linhas `properties:*` → JWT com 27 permissões.
4. Ávila Imóveis no JWT → `realEstateNav` → só Dashboard + Configurações.

O ponto 1 sozinho já impede o menu master. Os pontos 3–4 explicam o recorte de dois itens no código antigo.

---

## O que **não** é a causa neste login

| Hipótese | Evidência |
|----------|-----------|
| `roles[0]` não é admin | JWT `roles: ["admin"]` |
| Cookie mapeou `viewer` | `roles[0]` → `admin` em `c7673fd` |
| Empresa “Todas” aplicada por engano | `currentBusinessUnitId` = Ávila Imóveis |
| `isAdminMaster` falhou no array | Função **não está** no deploy |
| Git sem o commit | `origin/release/crm-operacao-avila` = `3b07e08`, ancestral `d9d9a31` |
| API caiu | health / db / redis **200**; login **201** |

---

## Para o commit entrar em produção (não executado nesta auditoria)

1. **Vercel** `deploy --prod` do web a partir de `release/crm-operacao-avila` (≥ `d9d9a31` / tip `3b07e08`).
2. **Railway** redeploy da API da mesma branch (boot corre `prisma migrate deploy` → aplica `20260827214500_admin_properties_view`).
3. Confirmar `_prisma_migrations` + JWT com 29 permissões (`properties:view` e `properties:manage`).
4. **Logout / login** dos admins (cookie com `roles[]`).
5. Conferir sidebar em Todas / Corretora Ávila / Ávila Imóveis: CRM + Seguros + Imobiliário + Governança.

---

## Evidências (fontes)

| Fonte | Uso |
|-------|-----|
| Vercel CLI (`leandrohavila`) · inspect domínio | SHA web `c7673fd` |
| Railway CLI (`npx @railway/cli`) · serviço `insureflow-api` / production | SHA API `17d1645`, `DATABASE_URL` |
| Neon (SELECT only) | migrations + ACL admin |
| `POST /api/v1/auth/login` + decode JWT (token omitido) | roles / permissions / BU |
| `GET /api/v1/health/runtime` | `startedAt`, `commit: unknown` |
| `git show c7673fd:apps/web/lib/navigation*.ts` | menu realmente servido |
| `origin/release/crm-operacao-avila` @ `3b07e08` | commit alvo presente no Git, ausente no runtime |

---

## Referências

- Prep do commit: `docs/reports/deploy-admin-master-navigation.md`
- Debug pré-push: `docs/reports/debug-admin-menu-producao-final.md`
- Correção (código): `docs/reports/fix-admin-master-navigation.md`

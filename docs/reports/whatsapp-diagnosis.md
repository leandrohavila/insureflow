# Diagnóstico — CTAs de WhatsApp

Data: 2026-10-06  
Código local, sem alteração. Número informado no cadastro: (34) 99207-4100.

## Conclusão

Os botões somem neste ambiente porque a home **não lê** o `PortalConfig`. O processo local está com `NEXT_PUBLIC_PORTAL_USE_MOCK=true` e devolve `config: null` antes de chamar a API.

Na API publicada os dois campos existem e são o mesmo número, com 11 dígitos, sem o 55. O site publicado em `grupoavilaimoveis.com.br` já mostra links `wa.me/5534992074100`. Esta cópia local é outro build, apontando para `localhost:4000`, que está desligado.

Não é o telefone que está vazio no cadastro. A consulta local é que não chega nele.

## 1. Como o portal carrega `PortalConfig.whatsapp`

A home, o layout, o detalhe do imóvel, o menu e o rodapé usam `getPortalHome()` em `apps/portal-imobiliario-publico/services/catalog.ts`.

Ordem real:

1. Se `NEXT_PUBLIC_PORTAL_USE_MOCK=true`, a função retorna `{ config: null, banners: [] }` e **não faz HTTP**.
2. Senão, `apiPortal()` pede `GET {API}/api/v1/public/portal?tenantSlug=...&businessUnitSlug=...`.
3. A base é `API_INTERNAL_URL` ou `NEXT_PUBLIC_API_URL`. Sem as duas, o default é `http://localhost:4000`.
4. Os slugs default são `tenantSlug=insureflow` e `businessUnitSlug=avila-imoveis`.
5. A API (`PortalConfigService.publicPortal`) busca `portal_configs` da unidade e devolve o campo `whatsapp` como foi gravado.
6. Se a conexão falha, a API responde 5xx, ou a unidade não existe (404), `getPortalHome()` engole o erro e devolve de novo `config: null`, com `source: "mock"`.

Neste processo:

| Variável | Valor observado |
| --- | --- |
| `NEXT_PUBLIC_PORTAL_USE_MOCK` | `true` |
| `API_INTERNAL_URL` | ausente |
| `NEXT_PUBLIC_API_URL` | ausente |
| `PORTAL_PUBLIC_URL` | `http://localhost:3002` |

`GET http://localhost:4000/api/v1/public/portal?...` não conecta. O rewrite do Next em `http://localhost:3002/api/v1/public/portal?...` responde 500.

A home renderizada traz a faixa “Catálogo mock ativo — a API pública não respondeu.” Não contém `99207`.

## 2. Fallback para telefone

Não existe para os CTAs de conversa.

`attendanceWhatsappHref` e `propertyWhatsappHref` usam só `config.whatsapp`. Se o campo vem `null` ou em branco, o retorno é `null`. O campo `phone` não entra nesse link.

O telefone aparece à parte:

- texto na faixa “Fale com um corretor”;
- link `tel:` no rodapé;
- `telephone` do JSON-LD, aí sim com fallback `phone` ou `whatsapp`.

O hero antigo, que caía em `tel:` ou `mailto:` e ainda assim marcava `whatsapp_click`, foi retirado. Hoje o botão do hero só existe quando `whatsapp` gera um `wa.me`.

Na API publicada, `whatsapp` e `phone` têm os mesmos 11 dígitos de (34) 99207-4100. Um fallback não mudaria o número **se** a config fosse carregada. Localmente os dois campos chegam vazios juntos, porque o objeto inteiro é `null`.

## 3. Condição que mostra os botões

O botão aparece só quando `whatsappHref` devolve URL. A função tira o que não é dígito e, se não começar com `55`, prefixa `55`.

| Superfície | Condição | Se falhar |
| --- | --- | --- |
| Hero “WhatsApp” | `attendanceWhatsappHref(config.whatsapp)` | botão omitido; fica só “Ver imóveis” |
| Cards e detalhe | `propertyWhatsappHref(config.whatsapp, imóvel)` | só “Ver detalhes” |
| Botão flutuante | `layout` passa `config.whatsapp` | componente retorna `null` |
| Menu “WhatsApp” | o mesmo href de atendimento | link para `/#whatsapp`, sem `whatsapp_click` |
| Faixa final | o mesmo href | o botão vira “Buscar um imóvel” |
| Rodapé “WhatsApp” | o mesmo href | a linha some |
| “Compartilhar no WhatsApp” | não usa o cadastro | continua visível (`wa.me/?text=`) |

Nesta home local: “Chamar no WhatsApp” ausente, “Buscar um imóvel” presente, menu em `/#whatsapp`. Os `whatsapp_click` que existem são só os de compartilhar.

## 4. A consulta chega vazia?

Sim, nesta execução. Ela nem é feita.

`getPortalHome()` sai no `forceMock` com `EMPTY_PORTAL`. A página não recebe `whatsapp` nem `phone`.

A consulta publicada **não** está vazia:

`GET https://api.corretoraavila.com.br/api/v1/public/portal?tenantSlug=insureflow&businessUnitSlug=avila-imoveis` → HTTP 200.

- `config.companyName`: Ávila Imóveis
- `config.whatsapp` e `config.phone`: presentes, 11 dígitos, iguais ao número informado, sem DDI 55
- `config.portalUrl`: host `grupoavilaimoveis.com.br`
- `config.publicSlug`: vazio
- banners: nenhum

## 5. Local e publicado

São ambientes diferentes.

| | Local desta revisão | Publicado |
| --- | --- | --- |
| Config | `null`, mock forçado | API 200 com telefone e WhatsApp |
| API usada pelo Next | `localhost:4000`, porta fechada | `api.corretoraavila.com.br` |
| Home | sem `99207`, CTA “Buscar um imóvel” | `https://grupoavilaimoveis.com.br/` HTTP 200, Next.js na Vercel |
| Links | só compartilhar, sem número | 4 links `https://wa.me/5534992074100` |
| Mensagem no `wa.me` | a deste branch não chega a montar o atendimento | `Olá, quero falar com a Ávila Imóveis.` (um dos links vai sem texto) |
| `whatsapp_click` | só no compartilhar | ausente no HTML publicado |

O site no ar já consome o cadastro e mostra o WhatsApp. O build publicado ainda não é este branch: o título é “Encontre o imóvel ideal para morar ou investir em Uberaba”, a description fala em atendimento especializado, não há canonical desta versão e não há `data-portal-event`.

O nome usado na mensagem publicada é o do cadastro, “Ávila Imóveis”. Com a config vazia, o código local cai no fallback “Grupo Ávila Imóveis”.

## O que isso não é

- O número informado não foi rejeitado pelo formato. `(34) 99207-4100` tem 11 dígitos e passa na validação do formulário (10 a 15 dígitos).
- A API publicada já grava e devolve esse valor.
- Esconder o botão aqui não é divergência entre `phone` e `whatsapp` no banco. Os dois estão preenchidos. A divergência é o Next local ignorar a API.

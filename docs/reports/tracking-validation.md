# Validação de tracking — publicado e local

Data: 2026-10-06  
Escopo: só `whatsapp_click`, `interest_click` e `visit_click`. Nenhum código foi alterado.

Publicado: `https://grupoavilaimoveis.com.br/`  
Página exercitada: `/imoveis/apartamento-morada-du-park-uberaba-3-quartos-cod-2383`  
Local: `http://localhost:3002`, branch `cursor/sprint-9-portal-conversao-f4ed`

## Resultado

Os três eventos **não funcionam** no ambiente publicado. O `dataLayer` permanece `null` depois do clique. Não há payload.

**Não está APTO PARA PRODUÇÃO** neste critério. O site no ar abre WhatsApp, interesse e visita, mas não envia os eventos.

## Publicado

Chrome 148, clique confiável com o botão dentro da viewport.

| Evento | Controle | O que o clique fez | `dataLayer` depois |
| --- | --- | --- | --- |
| `whatsapp_click` | “WhatsApp” → `https://wa.me/5534992074100?text=...` | permaneceu na ficha | `null` |
| `interest_click` | “Tenho interesse” → `/imoveis/.../interesse` | navegou para o formulário | `null` |
| `visit_click` | “Agendar visita” → `.../interesse?intent=visita` | navegou com `intent=visita` | `null` |

Os três links não têm `data-portal-event`. `window.dataLayer` não existe antes do clique. Não há `google_tag_manager` nem `gtag`.

Os 10 scripts carregados na ficha, e os scripts da home, não contêm `whatsapp_click`, `interest_click`, `visit_click`, `dataLayer` nem `portal:track`.

O número do link publicado é `5534992074100`. A mensagem do botão da ficha começa com “Olá, tenho interesse no imóvel” e inclui o título e o código 2383. Isso é o href, não um evento de analytics.

## Local

O HTML de `/imoveis/apto-2-quartos-centro` neste servidor contém as três strings e `data-portal-event`. O botão de WhatsApp de atendimento não aparece aqui porque a config local chega vazia; interesse e visita estão no HTML.

O código que grava o `dataLayer` está só nesta branch. O build da Vercel não o inclui.

## Payload que o código local enviaria

`trackPortalEvent` em `apps/portal-imobiliario-publico/lib/tracking.ts` faz duas coisas no clique: dispara `portal:track` em `window` e dá `push` em `window.dataLayer`.

Formato:

```json
{
  "event": "whatsapp_click | interest_click | visit_click",
  "label": "",
  "href": "",
  "propertySlug": ""
}
```

Quem chama, via `apps/portal-imobiliario-publico/components/tracked-link.tsx`:

| Evento | Onde | `label` | `propertySlug` |
| --- | --- | --- | --- |
| `whatsapp_click` | `app/page.tsx` (hero, destaque vazio, sobre) | `hero`, `destaque-vazio`, `sobre` | vazio |
| `whatsapp_click` | `components/property-card.tsx` | `card-imovel` | slug do imóvel |
| `whatsapp_click` | `components/whatsapp-float.tsx` | `botao-flutuante` | vazio |
| `whatsapp_click` | `components/whatsapp-highlight.tsx` | `destaque-home`, `compartilhar-home` | vazio |
| `whatsapp_click` | `components/site-footer.tsx` | `rodape`, `compartilhar-rodape` | vazio |
| `whatsapp_click` | `components/site-header.tsx` | `menu` | vazio |
| `whatsapp_click` | `app/imoveis/[slug]/page.tsx` | `detalhe-imovel` | slug |
| `interest_click` | `app/imoveis/[slug]/page.tsx` | `detalhe-imovel` | slug |
| `visit_click` | `app/imoveis/[slug]/page.tsx` | `detalhe-imovel` | slug |

No publicado, nenhum desses `onClick` está no bundle servido. O clique só segue o `href`.

## Comparação

| | Local (esta branch) | Publicado (Vercel) |
| --- | --- | --- |
| Botões de interesse e visita | sim | sim |
| Link `wa.me` de atendimento | não, config vazia | sim, `5534992074100` |
| Nome do evento no HTML/JS | os três | nenhum |
| `dataLayer` após o clique | implementado no código; não é o build no ar | `null` |
| GTM / gtag | não | não |

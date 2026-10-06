# Validação da home — Grupo Ávila Imóveis

Data: 2026-10-06  
Escopo: conferir a implementação já publicada na branch `cursor/sprint-9-portal-conversao-f4ed` (commit `d4a8b69`). Nenhuma funcionalidade nova foi adicionada.

Ambiente do teste: portal local em `http://localhost:3002`, catálogo mock (`NEXT_PUBLIC_PORTAL_USE_MOCK=true`), `PORTAL_PUBLIC_URL=http://localhost:3002`, Chrome 148 headless. A faixa “Catálogo mock ativo — a API pública não respondeu” faz parte desse ambiente.

Medição de performance e cliques: splash dispensado com `sessionStorage.portal_splash_seen=true` (visitante que já viu a abertura). Números de LCP, CLS e INP são de laboratório neste localhost, não dados de campo.

## O que está funcionando

- Hero com um único H1, “Encontre o imóvel certo em Uberaba”, e o subtítulo igual à meta description.
- CTA “Ver imóveis” aponta para `/imoveis`.
- Estatísticas renderizam: 5 imóveis disponíveis, “Direto”, “Local” e “A informar”.
- Categorias Casas, Apartamentos, Terrenos, Comerciais e Lançamentos (cinco links).
- Imóveis em destaque com “Ver detalhes” para os slugs do mock, inclusive os de Uberaba.
- Depoimentos, com o aviso de que os relatos são ilustrativos.
- Seção institucional e rodapé com endereço “Uberaba, MG”, links rápidos, SEO local, compartilhamento e iframe do mapa.
- Title, description, Open Graph, Twitter Card e canonical conferem com o texto pedido.
- `robots.txt` e `sitemap.xml` respondem 200 e listam as rotas locais.
- PNGs de favicon 16, 32 e apple touch 180, mais a imagem OG 1200×630, respondem 200 no tamanho declarado.
- `whatsapp_click`, `interest_click` e `visit_click` entram no `dataLayer` após clique confiável no elemento visível.
- `/`, `/terrenos-uberaba` e `/imoveis-comerciais-uberaba` respondem 200, cada uma com um H1 próprio.
- Sem overflow horizontal em 375, 768, 1024 e 1440 px.
- Amostras de contraste passam AA. Há um H1 e a sequência H2/H3 não pula nível.

## O que está quebrado

Nenhum defeito funcional foi comprovado nos caminhos que o ambiente mock permite exercitar. Os itens abaixo são limites da configuração ou ajustes de conteúdo, não falha de renderização, rota ou evento.

## O que precisa de ajuste

- O CTA de atendimento no WhatsApp não aparece nesta home. Sem `config.whatsapp`, o hero não mostra o segundo botão, os cards não mostram WhatsApp, o botão flutuante não aparece e a faixa final mostra “Buscar um imóvel” no lugar de “Chamar no WhatsApp”. O único controle de WhatsApp visível é “Compartilhar no WhatsApp”.
- O link “WhatsApp” do menu e do rodapé aponta para `/#whatsapp` e não tem `data-portal-event`. Ele não dispara `whatsapp_click`.
- `favicon.ico` é um único quadro de 48×48. Os arquivos 16 e 32 existem como PNG separados e estão ligados no HTML.
- O título institucional fica “Sobre a Grupo Ávila Imóveis”.
- O título do imóvel em destaque no hero é um H2, no mesmo nível das seções da página.
- “Clientes atendidos”, “Valor negociado” e CRECI são os textos de reserva “Direto”, “Local” e “A informar”. O número 5 é a contagem do catálogo mock.
- Parte dos destaques do mock está em Cuiabá (Centro e Jardim das Américas), não em Uberaba.
- Em 1024 px o bloco “A informar / CRECI” quebra a linha dentro do cartão. Não há barra horizontal.
- Canonical, `og:url`, `og:image`, Twitter image, `Host` e `Sitemap` usam `http://localhost:3002` porque essa é a origem configurada neste servidor. Em produção a origem pública precisa estar definida, senão esses endereços continuam locais.
- O tracking só grava `window.dataLayer` e o evento `portal:track`. Não há ID de GTM, GA4 ou Pixel para observar fora da página.
- A home e o detalhe do mock não têm `<img>` (capas vazias, placeholder “Sem foto”). O `alt` do código, quando existe capa, não foi exercitado com foto real.
- O LCP abaixo não inclui a primeira visita. A splash trava o scroll por cerca de 1,5 s e ainda leva 0,6 s para sair.

## Evidências

### Home

DOM em 1440×900, splash já vista:

| Bloco | Resultado |
| --- | --- |
| Hero | H1 presente; subtítulo com a frase de busca em Uberaba |
| Ver imóveis | `href="/imoveis"` |
| CTA WhatsApp do hero | ausente (`whatsappHero: false`) |
| Estatísticas | rótulos Imóveis disponíveis, Clientes atendidos, Valor negociado, CRECI |
| Categorias | `/imoveis/tipos/casas`, `apartamentos`, `terrenos`, `comerciais` e `/#lancamentos` |
| Destaque | “Ver detalhes” para `apto-2-quartos-centro`, `casa-condominio-jardim`, `apartamento-centro-uberaba-2-quartos-cod-1234`, `casa-fabricio-uberaba-cod-5678` |
| Depoimentos | H2 “Depoimentos” e o aviso de relatos ilustrativos |
| Sobre | H2 “Sobre a Grupo Ávila Imóveis” |
| Rodapé | endereço Uberaba, links locais, “Compartilhar no WhatsApp” e iframe do mapa |

Capturas do hero: 375 px (menu hambúrguer, CTA em largura total, estatísticas em 2×2), 768 px (estatísticas em uma linha, ainda hambúrguer), 1024 e 1440 px (menu Home, Imóveis, Comprar, Alugar, Sobre, WhatsApp e card de destaque ao lado do texto). Em 1024 a busca começa na dobra; em 1440 os rótulos “Comprar ou alugar” e “Bairro” entram na mesma tela.

### SEO

HTML de `GET /` (200):

- `<title>`: Grupo Ávila Imóveis | Imobiliária em Uberaba
- `description` e `og:description` e `twitter:description`: Encontre casas, apartamentos, terrenos e imóveis comerciais em Uberaba.
- `og:title` e `twitter:title`: o mesmo título
- `twitter:card`: `summary_large_image`
- canonical e `og:url`: `http://localhost:3002`
- `og:image` e `twitter:image`: `http://localhost:3002/og-grupo-avila-imoveis.png` (1200×630, 279507 bytes, `image/png`)
- `og:locale`: `pt_BR`; `og:site_name`: Grupo Ávila Imóveis

`GET /robots.txt` 200:

```
User-Agent: *
Allow: /

Host: http://localhost:3002
Sitemap: http://localhost:3002/sitemap.xml
```

`GET /sitemap.xml` 200, 24 URLs. Presentes: `/`, `/terrenos-uberaba`, `/imoveis-comerciais-uberaba`, `/comprar-casa-uberaba`, `/comprar-apartamento-uberaba`.

### Favicon

| Arquivo | HTTP | Tipo | Medida |
| --- | --- | --- | --- |
| `/favicon.ico` | 200 | `image/x-icon` | 1 quadro, 48×48, 3673 bytes |
| `/favicon-32x32.png` | 200 | `image/png` | 32×32, 1118 bytes |
| `/favicon-16x16.png` | 200 | `image/png` | 16×16, 466 bytes |
| `/apple-touch-icon.png` | 200 | `image/png` | 180×180, 18279 bytes |

Os quatro estão ligados no `<head>`.

### Tracking

Clique confiável (`Input.dispatchMouseEvent`) com o retângulo do alvo dentro da viewport. `scroll-behavior: smooth` no `html` faz `scrollIntoView` padrão atrasar a leitura do retângulo; o teste usou `behavior: "instant"`.

`whatsapp_click` em “Compartilhar no WhatsApp” (`#whatsapp`), página permaneceu em `/`:

```json
{
  "event": "whatsapp_click",
  "label": "compartilhar-home",
  "href": "https://wa.me/?text=Grupo%20Ávila%20Imóveis%20%7C%20Imobiliária%20em%20Uberaba%0AEncontre%20casas%2C%20apartamentos%2C%20terrenos%20e%20imóveis%20comerciais%20em%20Uberaba.%0Ahttp%3A%2F%2Flocalhost%3A3002",
  "propertySlug": ""
}
```

`interest_click` em “Tenho interesse”, navegou para `/imoveis/apto-2-quartos-centro/interesse`:

```json
{
  "event": "interest_click",
  "label": "detalhe-imovel",
  "href": "/imoveis/apto-2-quartos-centro/interesse",
  "propertySlug": "apto-2-quartos-centro"
}
```

`visit_click` em “Agendar visita”, navegou para `.../interesse?intent=visita`:

```json
{
  "event": "visit_click",
  "label": "detalhe-imovel",
  "href": "/imoveis/apto-2-quartos-centro/interesse?intent=visita",
  "propertySlug": "apto-2-quartos-centro"
}
```

Não houve como disparar o `whatsapp_click` de hero, card, flutuante ou “Chamar no WhatsApp”: esses controles não estão no DOM sem telefone na configuração.

### Rotas

| Rota | HTTP | Title | H1 | Canonical |
| --- | --- | --- | --- | --- |
| `/` | 200 | Grupo Ávila Imóveis \| Imobiliária em Uberaba | Encontre o imóvel certo em Uberaba | `http://localhost:3002` |
| `/terrenos-uberaba` | 200 | Terrenos em Uberaba \| Grupo Ávila Imóveis | Terrenos em Uberaba | `http://localhost:3002/terrenos-uberaba` |
| `/imoveis-comerciais-uberaba` | 200 | Imóveis comerciais em Uberaba \| Grupo Ávila Imóveis | Imóveis comerciais em Uberaba | `http://localhost:3002/imoveis-comerciais-uberaba` |

As duas landings usam a imagem OG da marca e `twitter:card=summary_large_image`. Descrições: terrenos para construir ou investir; salas, lojas e imóveis comerciais em Uberaba.

### Mobile e desktop

`overflowX = scrollWidth - clientWidth = 0` nos quatro tamanhos. H1, busca, rodapé e as cinco categorias presentes em todos.

| Largura | O que a captura mostra |
| --- | --- |
| 375 | Coluna única, CTA “Ver imóveis” na largura do hero, estatísticas 2×2, card de destaque abaixo, menu fechado |
| 768 | Mesma pilha; quatro estatísticas em uma linha; menu ainda fechado |
| 1024 | Menu completo e hero em duas colunas; “A informar” quebra dentro do cartão |
| 1440 | Hero, card e início da busca na mesma vista, sem corte lateral |

O círculo “N” no canto é o indicador do Next.js em desenvolvimento.

### Performance

Splash já vista, Chrome 148, localhost.

| Métrica | Valor | Observação |
| --- | --- | --- |
| LCP | 700 ms | Elemento H1 “Encontre o imóvel certo em Uberaba”, tamanho 96195. Repetição com cache quente: 312 ms, o mesmo H1 |
| CLS | 0 | Nenhum layout shift com `hadRecentInput` falso |
| INP | 16 ms | Um clique confiável em “Compartilhar no WhatsApp”. Event Timing: `name=click`, `duration=16`, `interactionId=9101`, processamento ≈ 13 ms |

O INP de campo não foi medido. 16 ms é a duração dessa única interação de laboratório.

### Acessibilidade

Contraste (branco composto sobre `#000C24` quando o Chrome devolve `oklab` com alfa):

| Texto | Par | Tamanho | Razão | AA |
| --- | --- | --- | --- | --- |
| H1 | branco em `#000C24` | 68px | 19.48:1 | passa |
| Subtítulo | branco 80% sobre navy → `rgb(204,206,211)` | 18px | 12.37:1 | passa |
| Rótulo de estatística do hero | branco 75% → `rgb(191,194,200)` | 12px | 10.91:1 | passa |
| “Ver imóveis” | `#000C24` em `#C09048` | 14px / 600 | 6.79:1 | passa |
| Rótulo da busca | `#10294B` em `#F8F9FA` | 12px | 13.83:1 | passa |
| Link do rodapé | branco em navy | 14px | 19.48:1 | passa |
| Citação de depoimento | `#000C24` em branco | 16px | 19.48:1 | passa |
| Contexto do depoimento | `#8A6A2F` em branco | 12px | 5.02:1 | passa |
| Dourado `#DEAE5D` em navy | — | — | 9.57:1 | passa |

Imagens: `document.images.length = 0` na home e no detalhe do mock. Não há `alt` ausente porque não há `<img>`. O mapa é um iframe com título.

Headings da home, um H1:

1. H1 Encontre o imóvel certo em Uberaba
2. H2 Apartamento 2 quartos no Centro (card do hero)
3. H2 Busca inteligente
4. H2 Números da imobiliária
5. H2 Categorias de imóveis
6. H2 Imóveis em destaque
7. H3 dos quatro cards
8. H2 Lançamentos, Depoimentos, Sobre a Grupo Ávila Imóveis, Fale com um corretor no WhatsApp, Imóveis em Uberaba

Não há salto de H1 para H3.

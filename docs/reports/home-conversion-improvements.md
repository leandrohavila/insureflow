# Home do portal — melhorias de conversão

**App:** `apps/portal-imobiliario-publico`  
**Data:** 6 de outubro de 2026  
**Escopo:** home, identidade do navegador, páginas locais e eventos de clique. Sem auditoria do site publicado.

## O que foi implementado

### Identidade visual

- Favicon gerado a partir da logo oficial (`docs/ux/mockups/ux001/assets/grupo-avila-logo.png`), recortando o símbolo (chave e telhados), sem redesenhar a arte.
- Arquivos: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`.
- Título: `Grupo Ávila Imóveis | Imobiliária em Uberaba`.
- Descrição: `Encontre casas, apartamentos, terrenos e imóveis comerciais em Uberaba.`
- Open Graph e Twitter Card com imagem `og-grupo-avila-imoveis.png` (logo oficial em fundo marfim, 1200×630), usada pelo compartilhamento no WhatsApp.
- Botão “Compartilhar no WhatsApp” com `wa.me` e o texto da página.

### Home

1. Hero com headline, subheadline, CTA “Ver imóveis”, CTA WhatsApp quando houver telefone no portal, imagem do imóvel em destaque e estatísticas resumidas.
2. Busca inteligente: comprar, alugar, bairro, tipo, valor mínimo e valor máximo. A listagem em `/imoveis` continua com os filtros que já existiam.
3. Estatísticas: imóveis disponíveis (total real do catálogo), clientes atendidos, valor negociado e CRECI.
4. Categorias: casas, apartamentos, terrenos, comerciais e lançamentos.
5. Cards de destaque com preço, local, código, “Ver detalhes” e WhatsApp quando o número estiver cadastrado.
6. Depoimentos.
7. Seção institucional, usando o texto e a imagem do portal quando existirem.
8. Faixa de WhatsApp.
9. Rodapé com contato, redes, links rápidos, endereço e mapa.
10. Bloco “Imóveis em Uberaba” e JSON-LD `RealEstateAgent`.

### SEO local

Páginas novas, no mesmo padrão das landings que já existiam:

- `/terrenos-uberaba` — Terrenos em Uberaba
- `/imoveis-comerciais-uberaba` — Imóveis comerciais em Uberaba

Casas e apartamentos à venda seguem em `/comprar-casa-uberaba` e `/comprar-apartamento-uberaba`, agora com os títulos pedidos. As quatro rotas entram no sitemap.

### Tracking

Cliques disparam `dataLayer` e o evento `portal:track`:

| Ação | Evento |
|------|--------|
| WhatsApp | `whatsapp_click` |
| Tenho interesse | `interest_click` |
| Agendar visita | `visit_click` |

O HTML também marca `data-portal-event` para um gerenciador de tags futuro.

## Arquivos alterados

- `apps/portal-imobiliario-publico/app/layout.tsx`
- `apps/portal-imobiliario-publico/app/page.tsx`
- `apps/portal-imobiliario-publico/app/imoveis/page.tsx`
- `apps/portal-imobiliario-publico/app/imoveis/[slug]/page.tsx`
- `apps/portal-imobiliario-publico/app/imoveis/tipos/[slug]/page.tsx`
- `apps/portal-imobiliario-publico/app/imoveis/bairros/[slug]/page.tsx`
- `apps/portal-imobiliario-publico/app/terrenos-uberaba/page.tsx` (novo)
- `apps/portal-imobiliario-publico/app/imoveis-comerciais-uberaba/page.tsx` (novo)
- `apps/portal-imobiliario-publico/components/hero-search.tsx`
- `apps/portal-imobiliario-publico/components/institutional-stats.tsx`
- `apps/portal-imobiliario-publico/components/property-card.tsx`
- `apps/portal-imobiliario-publico/components/site-footer.tsx`
- `apps/portal-imobiliario-publico/components/site-header.tsx`
- `apps/portal-imobiliario-publico/components/whatsapp-float.tsx`
- `apps/portal-imobiliario-publico/components/seo-catalog.tsx`
- `apps/portal-imobiliario-publico/components/local-seo.tsx` (novo)
- `apps/portal-imobiliario-publico/components/social-proof.tsx` (novo)
- `apps/portal-imobiliario-publico/components/whatsapp-highlight.tsx` (novo)
- `apps/portal-imobiliario-publico/components/tracked-link.tsx` (novo)
- `apps/portal-imobiliario-publico/lib/seo.ts` (novo)
- `apps/portal-imobiliario-publico/lib/tracking.ts` (novo)
- `apps/portal-imobiliario-publico/lib/commercial.ts`
- `apps/portal-imobiliario-publico/lib/uberaba.ts`
- `apps/portal-imobiliario-publico/public/favicon.ico`
- `apps/portal-imobiliario-publico/public/favicon-16x16.png`
- `apps/portal-imobiliario-publico/public/favicon-32x32.png`
- `apps/portal-imobiliario-publico/public/apple-touch-icon.png`
- `apps/portal-imobiliario-publico/public/og-grupo-avila-imoveis.png`

## Verificação

- `tsc --noEmit` do portal passou.
- Home local com catálogo mock: título, description, Open Graph, Twitter e ícones corretos.
- Rotas `/terrenos-uberaba`, `/imoveis-comerciais-uberaba`, `/comprar-casa-uberaba` e `/imoveis` respondem 200.
- A home renderizada mostra hero, busca, números, categorias, cards e lançamentos.

## Pendências

- **Clientes atendidos** e **valor negociado** não existem no cadastro do portal. A home mostra “Direto” e “Local” para não publicar um número inventado. Quando houver fonte, trocar esses dois valores.
- **CRECI** aparece como “A informar” até o portal ter o número cadastrado.
- **Depoimentos** são relatos ilustrativos, com aviso na seção. Substituir por avaliações autorizadas.
- **WhatsApp de atendimento** só aparece no hero, nos cards e no botão principal da faixa quando `config.whatsapp` estiver preenchido. O compartilhamento do link funciona sem esse número.
- **Mapa** usa o endereço do portal. Sem endereço, o ponto é “Uberaba, MG”.
- **Tracking** está preparado no navegador. Ainda não há ID de Google Tag Manager, GA4 ou Meta Pixel.
- A logo do header continua a do cadastro do portal. O favicon e a imagem de compartilhamento usam a arte oficial.

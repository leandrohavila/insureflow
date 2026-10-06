# Checklist de pré-produção — Portal Imobiliário Grupo Ávila

Data: 2026-10-06  
App: `apps/portal-imobiliario-publico`  
Ambiente conferido: portal local em `http://localhost:3002`, catálogo mock, Chrome 148. Sem varredura externa.

## Recomendação final

**REQUER AJUSTES**

O acabamento de código desta revisão está no repositório. A publicação ainda depende de dois valores que não existem no código local: o WhatsApp de atendimento no cadastro do portal e a origem pública em `PORTAL_PUBLIC_URL`. Sem eles, os CTAs de conversa não aparecem e o SEO absoluto aponta para `localhost:3002`.

## Itens aprovados

- Título: `Grupo Ávila Imóveis | Imobiliária em Uberaba`.
- Description: `Encontre casas, apartamentos, terrenos e imóveis comerciais em Uberaba.`
- Canonical da home, Open Graph (`og:title`, `og:description`, imagem 1200×630) e Twitter Card `summary_large_image`.
- `robots.txt` com `Allow: /` e sitemap. `sitemap.xml` inclui `/`, `/terrenos-uberaba` e `/imoveis-comerciais-uberaba`.
- Favicon ligado no HTML: `favicon.ico`, `favicon-16x16.png` (16×16), `favicon-32x32.png` (32×32) e `apple-touch-icon.png` (180×180). Os quatro respondem 200.
- Home em 375, 768 e 1024 px sem overflow horizontal. Um H1. CTA “Ver imóveis” visível.
- Contraste já medido na validação anterior permanece nos pares que não mudaram de cor (H1 19.48:1, CTA dourado 6.79:1, texto branco no navy).
- Mensagem de atendimento, quando há número: `Olá, quero falar com a {nome} sobre um imóvel em Uberaba.`
- Mensagem de imóvel, nos cards e no detalhe: `Olá, tenho interesse no imóvel {título} (cód. {código}).`
- O número usado é o de `PortalConfig.whatsapp`, só com dígitos, com DDI 55 quando o cadastro não traz o 55. O link é `https://wa.me/{número}?text=...`.
- Hero, cards, botão flutuante, faixa, rodapé e menu disparam `whatsapp_click` nesse link. O menu usa o rótulo `menu`.

## Itens corrigidos

- `favicon.ico` passou a ter três quadros, 16×16, 32×32 e 48×48. Antes havia só o quadro de 48×48.
- O menu “WhatsApp”, no desktop e no menu móvel, abre o `wa.me` de atendimento e grava `whatsapp_click` quando o número está cadastrado. Antes ia só para `/#whatsapp`, sem evento.
- Hero, flutuante, faixa e rodapé usam a mesma mensagem de atendimento. O hero não marca mais telefone ou e-mail como clique de WhatsApp.
- Cards e página do imóvel usam a mensagem com título e código do imóvel.
- Em 1024 px as estatísticas do hero voltam a duas colunas, para “A informar” caber numa linha. Em 768 px seguem em quatro colunas. Overflow do valor: nenhum nos três tamanhos.
- O título institucional padrão ficou “Sobre o Grupo Ávila Imóveis”.
- O título do imóvel no card do hero deixou de ser H2, para não competir com as seções da página.
- `Host` do `robots.txt` sai sem o esquema (`localhost:3002` neste ambiente, o host público quando `PORTAL_PUBLIC_URL` estiver definido).

## Pendências

- O cadastro local do portal não tem WhatsApp. O mock devolve `config: null` e o seed grava o campo só se já existir em `tenant.settings`. Nesta home, hero, cards, flutuante e o link rastreado do menu não renderizam. O menu cai em `/#whatsapp`. Não há número no repositório para confirmar o telefone publicado.
- `PORTAL_PUBLIC_URL` não está definido para produção (o exemplo segue comentado). Canonical, Open Graph, sitemap e robots deste servidor usam `http://localhost:3002`.
- CRECI segue “A informar”. “Clientes atendidos” e “Valor negociado” seguem “Direto” e “Local”, porque o portal não tem essa fonte.
- Depoimentos continuam ilustrativos, com o aviso na seção.
- O tracking grava `dataLayer` e o evento `portal:track`. Não há ID de GTM, GA4 ou Pixel.
- Com a API fora, o destaque do mock inclui imóveis de Cuiabá. Em produção o catálogo precisa vir da API.

## Antes de publicar

1. Preencher o WhatsApp no cadastro do portal e abrir a home publicada: hero, um card, o botão flutuante e o menu devem apontar para o mesmo `wa.me` e disparar `whatsapp_click`.
2. Definir `PORTAL_PUBLIC_URL` com a origem pública, sem barra no final, e conferir canonical, `og:image` e `sitemap.xml`.
3. Preencher CRECI no mesmo cadastro, se o número já existir.

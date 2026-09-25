# Auditoria UX Mobile — Portal Imobiliário Ávila

Sprint Mobile 1.0. Escopo limitado a UX, UI, responsividade, performance e conversão no celular. Regras de negócio, integrações, captura de leads e APIs permanecem as mesmas.

## Recomendação (P1 e P2)

**No celular, bottom sheet. A partir de 768px, hero e filtro em sequência.**

| Opção | Decisão | Motivo |
| --- | --- | --- |
| A — Hero, CTA e filtro empilhados | Usada só em `md+` | No desktop o filtro em grade cabe sem cobrir o título. No celular, oito campos passam de 600px e empurram os imóveis para fora da primeira dobra. |
| B — Hero, botão e filtro em modal | Base da solução mobile | O usuário vê valor, CTA e imóveis antes de abrir a busca. |
| Accordion | Descartado | Mesmo fechado ocupa uma faixa; aberto volta a esconder a listagem. |
| Drawer lateral | Descartado | A busca é ação principal. O bottom sheet fica na zona do polegar e segue o padrão de iOS/Android. |
| Modal central | Descartado | Cobre a página inteira e exige mais alcance do que um painel ancorado embaixo. |

O formulário continua nativo, `GET`, com os mesmos `name` (`purpose`, `type`, `neighborhood`, `city`, `priceMin`, `priceMax`, `code`, `q`). `parseListQuery` não mudou.

## Problemas encontrados

1. Hero com `min-h` de 70vh/85vh e filtro em `translate-y-1/2`. No 320–430px o banner e o título ficavam atrás de oito campos.
2. A seção seguinte usava `pt-36` só para compensar o filtro sobreposto.
3. Imóveis em destaque vinham depois de Sobre e Diferenciais. A primeira dobra não mostrava nenhum card.
4. Na listagem, o filtro aberto ocupava a tela inteira antes do primeiro imóvel.
5. Header de 64px no celular (80px no desktop), com logo `h-14` dentro de uma faixa de 64px.
6. A logo podia sumir: `img { max-width: 100% }` dentro de flex com `min-w-0` colapsa a largura, e não havia fallback se a URL falhasse. Logo escura em fundo navy também some.
7. CRECI só aparecia no hero, empurrando o título, e não no menu.
8. Cards verticais 4:3 com preço só sobre a foto, código em cinza claro e CTA de 40px. Um card ocupava quase a dobra.
9. Não havia WhatsApp flutuante nem barra fixa no detalhe. O contato dependia do rodapé ou do fim da página.
10. Hero em `background-image` (pior descoberta de LCP, sem dimensão, sem fallback). Fotos sem `width`/`height` estáveis. Inputs `text-sm` provocam zoom no iOS.
11. Contraste fraco em código do imóvel (`stone-400`) e alvos de toque abaixo de 44px no menu, paginação e galeria.
12. Overflow horizontal de ~32px em 320px por causa do slug sem quebra dentro do card em grade.

## O que foi implementado

- Hero compacto, altura pelo conteúdo. Título, subtítulo e CTAs ficam sobre o banner, não atrás do filtro.
- CTA principal “Ver imóveis” leva aos destaques. CTA secundário continua o mesmo destino de contato (WhatsApp, telefone ou e-mail).
- No celular, “Buscar imóveis” abre bottom sheet com os mesmos campos. Em `md+`, o filtro permanece inline, sem sobrepor o título.
- Destaques sobem para logo abaixo do hero. Categorias viram chips horizontais no celular.
- Listagem abre com contagem e cards. Filtro vira botão; a grade completa continua no desktop.
- Header de 48px no celular e 64px a partir de `md`. Menu e links com 44px. CRECI no menu e, em telas largas, ao lado da marca.
- Logo com altura explícita, `flex-shrink: 0`, placa branca e texto da imobiliária se a imagem falhar.
- Card horizontal no celular (foto, preço, bairro, cidade, CTA) e vertical a partir de `sm`. O card inteiro abre o detalhe.
- WhatsApp flutuante quando `config.whatsapp` existe, com safe area e `z-index` abaixo do sheet. No detalhe, barra fixa com WhatsApp contextual e “Tenho interesse”.
- Imagem do hero em `<img>` com prioridade alta e fallback. Primeiros cards com `loading=eager`. Demais lazy. Sem webfont. `preconnect` para origem de hero, logo e sobre. `content-visibility` nas seções inferiores. `touch-action: manipulation`.
- Contraste, rótulos ligados aos campos, `text-base` nos controles, dialog com foco, Escape e `aria-modal`, e link “Pular para o conteúdo”.

## Evidências

Medido no Chrome headless com o catálogo mock (`NEXT_PUBLIC_PORTAL_USE_MOCK=true`), viewport de 800px de altura no celular e 1024px em 768px.

| Largura | Header | Título visível | Cards na primeira dobra | Overflow horizontal |
| --- | --- | --- | --- | --- |
| 320 home | 48px | sim | 2 | 0 |
| 360–430 home | 48px | sim | 2 | 0 |
| 768 home | 64px | sim | 2 | 0 |
| 320 listagem | 49px | sim | 3 | 0 |
| 375–430 listagem | 49px | sim | 3 | 0 |
| 768 listagem | 65px | sim | 2 | 0 |

Antes, a primeira dobra da home e da listagem mostrava só o filtro. Nenhum card entrava na tela.

Busca do sheet enviou `GET /imoveis?purpose=SALE&city=Cuiabá` e a listagem devolveu os dois imóveis de venda em Cuiabá. O aluguel ficou de fora, como a regra atual de preço/finalidade já fazia. O botão “Tenho interesse” segue para `/imoveis/[slug]/interesse` com 48px de altura.

O WhatsApp flutuante e o da barra do detalhe só renderizam quando o CRM envia `config.whatsapp`. No mock a config é vazia, então o botão não aparece — o mesmo critério do rodapé. O link usa `whatsappHref` já existente.

## Impacto esperado em conversão

Jornada alvo: entrar, ver imóvel, abrir detalhe, chamar no WhatsApp.

- A home passa a mostrar imóveis sem scroll longo (antes: hero + filtro + sobre + diferenciais).
- O card inteiro é o link. Um toque abre o detalhe.
- A busca deixa de ser obstáculo e vira ação explícita.
- Com WhatsApp configurado, o contato fica disponível em qualquer página e, no detalhe, a mensagem já cita o imóvel. O formulário de interesse não foi alterado.

Não há número de conversão medido nesta sprint. O ganho esperado vem da redução de scroll e de toques até o imóvel e o contato.

## Arquivos alterados

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/not-found.tsx`
- `app/imoveis/page.tsx`
- `app/imoveis/[slug]/page.tsx`
- `app/imoveis/tipos/[slug]/page.tsx`
- `app/imoveis/bairros/[slug]/page.tsx`
- `components/hero-search.tsx`
- `components/hero-media.tsx`
- `components/search-sheet.tsx`
- `components/property-filters.tsx`
- `components/property-listing.tsx`
- `components/property-card.tsx`
- `components/property-gallery.tsx`
- `components/launch-card.tsx`
- `components/site-header.tsx`
- `components/site-footer.tsx`
- `components/brand-logo.tsx`
- `components/whatsapp-float.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/badge.tsx`
- `docs/auditoria-ux-mobile.md`

# Home — análise de lacunas v2

Sprint 9.1 do portal público (`apps/portal-imobiliario-publico`). A comparação é a visão descrita nesta sprint e as cores do design system em `docs/ux/design-system/colors.md`. Não há arquivo de layout estratégico aprovado no repositório (nenhum mockup ou documento contém a frase “Mais que imóveis. Realizamos histórias.”).

Escopo respeitado: sem API nova, sem banco, sem fluxo de publicação, sem CRM e sem o módulo imobiliário administrativo.

## Auditoria antes dos ajustes

A home já tinha hero, busca, categorias, destaques, depoimentos, sobre e WhatsApp. A percepção ainda era de portal funcional:

| Superfície | O que aparecia |
| --- | --- |
| Preço | `Intl.NumberFormat` com `maximumFractionDigits: 0`, sem centavos (`R$ 550.000`) |
| Área e cômodos | Área crua (`68 m²` sem agrupamento de milhar) e quartos sempre no plural, ou só o número com rótulo para leitor de tela |
| Telefone | Número cru do cadastro, sem máscara |
| Estatísticas | Total do catálogo, “Direto”, “Local” e “A informar” / CRECI solto |
| Categorias | Retângulos navy, sem profundidade nem hover de portal premium |
| Cards | Selo Destaque já existia. Sem Exclusivo, sem compartilhar, localização pouco destacada |
| Prova social | Três frases ilustrativas, sem nota, sem navegação |
| Sobre | Texto institucional, sem a frase de posicionamento |
| WhatsApp | Hero em contorno claro; cards, detalhe e flutuante em verde `#075E54` |

## O que foi alcançado

### 1. Padrão monetário

`formatPrice` usa exatamente `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. O espaço entre `R$` e o valor é o espaço do `Intl` (não separável).

| Entrada | Saída |
| --- | --- |
| 550000 | R$ 550.000,00 |
| 1250000 | R$ 1.250.000,00 |
| 2850000 | R$ 2.850.000,00 |

Aplicado em cards, destaque do hero, lançamentos, detalhe do imóvel e chips de faixa da busca. O JSON-LD continua com o número puro, como o schema espera.

Na home mock renderizada: `R$ 420.000,00`, `R$ 780.000,00`, `R$ 390.000,00`, `R$ 2.800,00`. Chip `Mín. R$ 100.000,00` em `/imoveis?priceMin=100000`.

### 2. Formatação brasileira

| Dado | Saída verificada |
| --- | --- |
| Área 130, 250, 1500 | `130 m²`, `250 m²`, `1.500 m²` |
| Quartos, banheiros, vagas | `1 quarto`, `2 quartos`, `1 banheiro`, `2 banheiros`, `1 vaga`, `3 vagas` |
| Telefone `34992074100` e `5534992074100` | `(34) 99207-4100` |
| WhatsApp do mesmo número | `+55 34 99207-4100` |

No HTML local: `2 quartos`, `2 banheiros`, `1 vaga`, `68 m²`. Rodapé e bloco de contato usam essas máscaras quando o cadastro traz o número. O mock local não tem `PortalConfig`, então o telefone não aparece nesta sessão — o formato foi exercitado na função, não numa config inventada.

### 3. Hero

Título maior (`clamp` até 5.25rem), subtítulo em 18–20px, CTAs com 56px de altura. “Ver imóveis” permanece ouro. “Falar no WhatsApp” fica verde `#075E54` com texto branco, o mesmo verde dos cards, do detalhe, do menu (quando há `wa.me`) e do botão flutuante (64px, anel dourado). O botão só entra no HTML se `config.whatsapp` gerar link. No mock ele não aparece; o comportamento anterior foi mantido.

Em 375, 768, 1024 e 1440: um único H1, `overflowX` 0, estatísticas em 2×2 sem estourar a coluna.

### 4. Estatísticas

Os valores “Direto”, “Local” e “A informar” saíram. Cada indicador tem ícone, rótulo e valor.

| Indicador | Regra |
| --- | --- |
| Imóveis disponíveis | Total publicado com `+` e agrupamento pt-BR. Se o total não existir, `+120` |
| Clientes atendidos | `+350`, sem campo no CRM |
| em negócios | `R$ 80 milhões`, sem campo no CRM |
| CRECI | Número do cadastro. Sem cadastro e sem override, `sob consulta` |

Nada disso é fixo no componente. Overrides, sem API nova:

- `NEXT_PUBLIC_PORTAL_STAT_AVAILABLE`
- `NEXT_PUBLIC_PORTAL_STAT_CLIENTS`
- `NEXT_PUBLIC_PORTAL_STAT_VOLUME`
- `NEXT_PUBLIC_PORTAL_STAT_CRECI` (só se o CRM não tiver CRECI)

No mock o catálogo tem 5 imóveis, então a home mostra `+5`, não `+120`. O `+120` é o fallback quando não há total. O CRECI `62568` do cadastro publicado continua vencendo assim que a config chega; esta sessão mock não tem config, então mostra `sob consulta`.

### 5. Categorias

Casas, Apartamentos, Terrenos, Comerciais e Lançamentos viraram cartões com gradiente, ícone de fundo, sombra, elevação no hover e “Explorar” abaixo do título. Não há foto de categoria no kit da marca; não foi baixada imagem de banco. Em 1440 os títulos não cruzam o rótulo (medido: sobreposição falsa nos cinco cartões).

### 6. Cards

Hierarquia: preço em ouro `#7F5209` (contraste 6.75 sobre branco), localização em pílula, título, tipo e código, cômodos por extenso e área. Selo Destaque permanece. Selo Exclusivo só se alguma característica tiver chave ou rótulo com “exclusiv” e valor verdadeiro. Compartilhar abre `wa.me` com título, preço e URL e dispara `whatsapp_click` com rótulo `compartilhar-card`. O mesmo compartilhar existe no detalhe (`compartilhar-detalhe`).

### 7. Prova social

Faixa com três lugares preparados: volume de avaliações (fonte padrão Google), nota média com estrelas e texto de que nenhuma API externa é chamada. Carrossel com anterior, próximo e indicadores. Os três relatos continuam ilustrativos e o aviso deixa isso explícito. Nota e volume reais entram por:

- `NEXT_PUBLIC_PORTAL_RATING_SCORE`
- `NEXT_PUBLIC_PORTAL_RATING_COUNT`
- `NEXT_PUBLIC_PORTAL_RATING_SOURCE`

Sem essas variáveis a faixa mostra “Volume a publicar” e “A publicar”.

### 8. Sobre a Ávila

A seção abre com “Mais que imóveis. Realizamos histórias.” O texto do CRM, ou o fallback já existente, permanece no corpo. O título segue `aboutSectionTitle`.

### 9. WhatsApp

Onde o link de atendimento existe, o botão é verde, com ícone e rótulo de ação (“Falar no WhatsApp” no hero, no sobre e no bloco final; “WhatsApp” no card e no detalhe, onde o espaço é menor). O flutuante continua no canto, maior e com anel dourado. Sem número, os CTAs de atendimento continuam ocultos.

## Evidência visual

Portal local em `http://127.0.0.1:3002`, catálogo mock, splash dispensada. `overflowX` 0 em 375, 768, 1024 e 1440. Typecheck do portal: `tsc --noEmit` sem erros.

Contraste calculado: preço `#7F5209` sobre branco 6.75; branco sobre `#075E54` 7.67; `#DEAE5D` sobre `#000C24` 9.57; navy sobre marfim 17.31.

Capturas em `/opt/cursor/artifacts/sprint-91/`: `home-375`, `home-768`, `home-1024`, `home-1440`, `categories-1440`, `cards-1440`, `cards-375`, `stats-1440`, `social-1440`, `social-375`, `about-1440`, `detail-375`, `detail-1440`.

## O que ainda diverge da proposta

- Não existe prancha aprovada no repositório para um pixel-a-pixel. A home segue a sprint e a paleta, não um Figma ausente.
- Categorias e capas seguem sem fotografia. O mock e vários imóveis publicados podem continuar em “Sem foto”.
- A nota Google e os depoimentos nominais não foram inventados. A faixa avisa que o dado será publicado.
- O total de imóveis é o catálogo real (`+5` neste mock, `+10` era o número citado na sprint). O `+120` só entra sem total, ou com a variável de ambiente.
- O CRECI de exemplo `62568` não foi gravado no código. Ele aparece quando o cadastro o envia.
- Produção (`grupoavilaimoveis.com.br`) não recebe este branch até o merge e o deploy. Fora desta sprint.

## Prioridade alta

1. Publicar fotos de capa. Sem elas o card premium continua com “Sem foto”.
2. Informar nota e volume reais pelas variáveis de avaliação, com autorização do cliente. Não integrar Google nesta etapa.
3. Levar este branch a produção. O domínio público ainda serve o build anterior, sem este acabamento e sem o tracking da PR #28.

## Prioridade média

1. Decidir se “Imóveis disponíveis” fica no total publicado ou no número comercial `+120`. A variável `NEXT_PUBLIC_PORTAL_STAT_AVAILABLE` faz a troca sem hardcode.
2. Fotografia própria das cinco categorias, no lugar do gradiente.
3. Conferir no preview com a API publicada se o hero mostra “Falar no WhatsApp”, o telefone `(34) 99207-4100` e o CRECI do cadastro. O mock local não carrega essa config.

## Prioridade baixa

1. Estado vazio de lançamentos, até existir imóvel marcado como lançamento.
2. Selo Exclusivo, que depende da característica no imóvel. Não há campo `exclusive` na API e nenhum foi criado.
3. Ajuste fino de entrelinha do hero em títulos longos vindos do CRM.

## Recomendação final

O portal neste branch deixa de parecer só um catálogo funcional: preço brasileiro, hierarquia do hero, estatísticas com rótulo, categorias com profundidade, cards com localização e compartilhamento, posicionamento “Mais que imóveis. Realizamos histórias.” e WhatsApp no mesmo verde em todos os pontos de conversão.

A recomendação é revisar este preview e aprovar o refinamento visual. Ainda não substitui fotos, avaliações autorizadas nem o deploy. Sem esse conteúdo e sem o merge, a marca no ar continua a da versão anterior.

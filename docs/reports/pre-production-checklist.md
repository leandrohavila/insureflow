# Checklist de pré-produção — Portal Imobiliário Grupo Ávila

Data desta revisão: 2026-10-17  
App: `apps/portal-imobiliario-publico`  
Branch: `cursor/sprint-9-portal-conversao-f4ed`  
Base conferida: `dc0e592`  
Ambiente: API pública de produção lida em GET, sem gravação. Nenhuma migration foi aplicada. Nenhum merge.

## Recomendação

**PRONTO PARA PUBLICAR O PORTAL, COM AÇÕES DE PAINEL AINDA FORA DESTE COMMIT**

O código desta revisão deixa de publicar `localhost` no SEO quando o deploy é de produção ou de preview, e deixa de exibir `+350` e `R$ 80 milhões` sem fonte. O domínio público, o WhatsApp e o CRECI já existem no cadastro. A coluna do vídeo institucional ainda não está no banco que a API pública lê.

## O que a API pública de produção devolve

`GET /api/v1/public/portal?tenantSlug=insureflow&businessUnitSlug=avila-imoveis` em 2026-10-17:

- WhatsApp cadastrado, 11 dígitos, sem o prefixo 55. O portal acrescenta o 55 ao montar `wa.me`.
- Telefone cadastrado, também com 11 dígitos.
- CRECI `62568`.
- `portalUrl` no host `grupoavilaimoveis.com.br`.
- A resposta não contém `institutionalVideo`. O código em produção ainda não serializa essa coluna.

## Corrigido neste passo

- Canonical, Open Graph, sitemap, `robots.txt` e JSON-LD usam `portalOrigin()`. A origem passa a ser, nesta ordem: `PORTAL_PUBLIC_URL`, `NEXT_PUBLIC_PORTAL_URL`, o host do deploy na Vercel, e em produção `https://grupoavilaimoveis.com.br` se a variável pública não estiver definida. `localhost` só permanece no desenvolvimento local.
- “Clientes atendidos” e “em negócios” voltaram aos textos de reserva do projeto, “Direto” e “Local”. O total de imóveis continua sendo a contagem real do catálogo. Sem contagem, o valor é “A publicar”, não `+120`. CRECI vem do cadastro; sem cadastro, “A informar”. Overrides por variável de ambiente continuam possíveis.

## Já verdadeiro no cadastro, sem mudança de dado

- O fluxo de atendimento lê `PortalConfig.whatsapp` e gera `https://wa.me/55{número}` com a mensagem “Olá, quero falar com a {nome} sobre um imóvel em Uberaba.”
- O CRECI publicado é o do cadastro (`62568`), não um número inventado no código.

## Migration do vídeo

`20261017120000_portal_institutional_video` só adiciona `portal_configs.institutional_video` JSONB, nulo. Não apaga linha nem grava arquivo. O comando oficial é `npm run db:deploy` na raiz, e o Prisma usa `DATABASE_URL_DIRECT` quando ela existe. O boot `start:release` da API no Railway executa esse deploy. Não foi executado. O vídeo `https://youtube.com/shorts/PepqDgdLHzA` não foi gravado. Legendas continuam vazias: o YouTube informa que este clipe não tem legendas.

## Bloqueios que ficam no painel

1. Confirmar, sem copiar senha, que o `DATABASE_URL` do serviço que receberá a migration não é o de outro ambiente por engano. Só então `npm run db:deploy` com a URL direta desse banco.
2. Publicar a API desta branch nesse serviço. O deploy de preview da API na Vercel não roda a migration.
3. No projeto Vercel `insureflow-portal-imobiliario-publico`, ambiente Production, definir `PORTAL_PUBLIC_URL=https://grupoavilaimoveis.com.br` e `API_INTERNAL_URL` para a API que já serve o portal. Sem a primeira, o código desta revisão ainda usa o domínio conhecido; a variável deixa a origem explícita.
4. Depois da coluna existir e da API nova estar no ar, salvar no painel o Shorts ativo, sem URL de legenda.
5. Não fazer merge nesta etapa. A produção do domínio continua no commit anterior até o merge e um deploy de Production que conclua.

## Fora deste escopo

- Depoimentos seguem ilustrativos, com o aviso da seção.
- Não há ID de GTM, GA4 ou Pixel. O tracking da página grava `dataLayer` e `portal:track`.
- Nota e volume de avaliações só aparecem se as variáveis `NEXT_PUBLIC_PORTAL_RATING_*` forem definidas. Sem elas, a faixa diz que o dado será publicado.

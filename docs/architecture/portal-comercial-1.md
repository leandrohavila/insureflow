# Portal Comercial 1.0

O portal público (`apps/portal-imobiliario-publico`) consome a API. Textos, imagens, contato, destaques, lançamentos e bairros vêm do CRM. Categorias são filtros sobre o tipo publicado.

## Entidades

- `Property.featured` permanece a coluna de destaque. A API também expõe `isFeatured`.
- `Property.isLaunch` marca lançamento.
- `PropertyType.CONDOMINIUM` cobre a categoria Condomínios.
- `PortalConfig` (um por unidade): nome, hero, logo, institucional, diferenciais, WhatsApp, telefone, e-mail, redes, CRECI e endereço.
- `PortalBanner`: título, subtítulo, imagem, link, ativo e ordem.

## API

- `GET/PUT /api/v1/portal-config`
- `GET/POST /api/v1/portal-banners` e `PATCH/DELETE /api/v1/portal-banners/:id`
- `GET /api/v1/public/portal`
- `GET /api/v1/public/properties/highlights|launches|facets`
- Busca pública aceita `type`, `code` (slug ou id), `purpose`, bairro, cidade e faixa de preço.

## Portal

Home em RSC: hero, busca, destaques, lançamentos, categorias, bairros indexáveis (`/imoveis/bairros/[slug]`), institucional, CTA WhatsApp e rodapé. Metadata, Open Graph, `RealEstateListing`, sitemap e robots usam os dados publicados.

## CRM

Cadastro do imóvel marca destaque e lançamento. A tela Portal edita `PortalConfig` e banners.

# UI Foundation

Sprint 4.1 cria a fundação visual do InsureFlow sem migrar telas de negócio.

## Camadas

1. Foundation: theme, density, motion, layout, z-index, opacity e ícones.
2. Design Tokens: valores semânticos consumidos por componentes.
3. Primitive Components: controles base.
4. Composite Components: padrões reutilizáveis de produto.
5. Page Patterns: composições oficiais por tipo de tela.
6. Pages: módulos de negócio.

## Regra central

Páginas não devem inventar layout. Elas devem compor PageContainer, PageHeader,
Section, Toolbar, FilterBar, AppCard, DataTable e demais padrões oficiais.

## Compatibilidade

`@repo/ui` permanece como fonte dos tokens CSS e do ThemeProvider. A camada
`apps/web/lib/design-system` organiza esses tokens para o produto InsureFlow.

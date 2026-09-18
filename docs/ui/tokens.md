# Design Tokens

Tokens oficiais ficam em duas camadas:

- `packages/ui/src/styles/insureflow.css`: CSS variables e tema.
- `apps/web/lib/design-system/*`: tokens semânticos do produto.

## Proibido em novos componentes

- Valores mágicos de spacing, radius, motion, z-index e sombra.
- Cores inline semânticas fora dos tokens.
- Novas escalas locais para altura de input, tabela ou card.

## Permitido

- Usar classes oficiais exportadas por `dsLayout`, `dsTypography`, `dsMotion`.
- Usar CSS variables `--if-*` existentes.
- Criar novos tokens antes de criar novo padrão visual.

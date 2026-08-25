# Layout

O layout oficial do produto é operacional e compacto.

## PageContainer

- Max width: 1600px.
- Padding lateral responsivo via `--if-layout-page-x`.
- Padding vertical responsivo via `--if-layout-page-y`.
- Gap entre seções via `--if-layout-section-gap`.

## Rails

Topbar, tabs e conteúdo devem alinhar no mesmo rail visual.

## Páginas futuras

Nenhuma página nova deve declarar manualmente shells como `px-* py-* gap-*`.
Use componentes de layout oficiais.

## Componentes

- `PageContainer`: wrapper semântico `main`, padding responsivo e largura máxima oficial.
- `ContentContainer`: rail interno padrão para conteúdo.
- `Section`: agrupamento vertical com gap oficial.
- `Stack`: ritmo vertical com `gap` semântico (`sm`, `md`, `lg`, `xl`, `2xl`).
- `Inline`: agrupamento horizontal responsivo para ações e metadados.
- `Grid`: grades responsivas oficiais, incluindo `columns="5"` para dashboards operacionais.

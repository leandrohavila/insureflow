# Components

Componentes devem seguir a hierarquia:

Primitive -> Composite -> Page Pattern -> Page.

## Regras

- Não recriar componente existente apenas para reorganização.
- Evoluir componentes atuais quando preservar compatibilidade.
- Separar UI de lógica de negócio.
- Componentes compostos não devem conhecer regras de CRM, RBAC ou API.

## Componentes oficiais atuais

Layout:
`PageContainer`, `ContentContainer`, `Section`, `Stack`, `Inline`, `Grid`.

Navegação:
`PageHeader`, `Toolbar`, `FilterBar`, `FilterSearch`, `FilterSelect`.

Cards e indicadores:
`AppCard`, `StatCard`.

Formulários:
`FormLayout`, `FormField`.

Estados:
`EmptyState`, `PlaceholderPage`, `LoadingState`, `SkeletonState`.

Dados:
`DataTable` oficializado por reexport compatível do componente compartilhado.

## Hardening

- Props públicas dos componentes oficiais devem ser exportadas.
- Estados de loading devem usar `aria-busy`, `role="status"` ou `aria-live` quando aplicável.
- Ícones decorativos devem usar `aria-hidden`.
- Componentes compostos podem encapsular primitivos de `components/ui`, mas páginas novas devem preferir os compostos oficiais quando eles existirem.

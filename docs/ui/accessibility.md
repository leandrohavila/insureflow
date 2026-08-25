# Accessibility

Todos os componentes do Design System devem suportar:

- Navegação por teclado.
- Estado de foco visível.
- `aria-*` quando necessário.
- Contraste adequado em dark e light.
- Estados disabled, loading e erro.
- Labels associados a inputs.
- Conteúdo legível por screen readers.

## Regra

Componentes interativos devem ser testáveis sem mouse.

## Aplicação Atual

- `FilterSearch` e `FilterSelect` possuem label acessível.
- `FormField` propaga atributos ARIA para um controle filho válido.
- `StatCard` usa `aria-busy` quando está carregando.
- `LoadingState` e `SkeletonState` usam `role="status"` e `aria-live="polite"`.
- Ícones puramente decorativos devem usar `aria-hidden`.

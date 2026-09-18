# DataTable Design System Debt

## Situação Atual

O `DataTable` oficial do Design System é exposto por:

`apps/web/components/design-system/data-table.ts`

Ele reexporta, de forma compatível, o componente existente em:

`apps/web/components/shared/data-table.tsx`

Essa decisão preserva a API usada pelos módulos atuais e evita regressões antes da
migração do CRM.

## Arquitetura Atual

Fluxo atual:

Foundation -> components/ui/table -> components/shared/data-table -> components/design-system/data-table -> páginas/módulos

O componente compartilhado concentra:

- definição de colunas;
- estados loading, error e empty;
- ações de linha;
- permissões por ação;
- paginação;
- densidade `default` e `compact`;
- suporte a cabeçalho sticky.

## Dependências Existentes

`apps/web/components/shared/data-table.tsx` ainda depende de:

- `GlassCard` de `components/dashboard/glass-card`;
- estados legados de `components/shared/list-states`;
- `PaginationControls` de `components/shared/pagination-controls`;
- primitivos de tabela em `components/ui/table`;
- sessão/permissões para filtrar ações por RBAC.

## Motivo da Dívida Técnica

O componente foi promovido para o Design System por compatibilidade, mas sua
implementação interna ainda carrega dependências visuais anteriores ao Design
System oficial.

O maior ponto de dívida é a dependência de `GlassCard`, que pertence ao contexto
visual antigo do Dashboard e não à biblioteca oficial `components/design-system`.

## Módulos Impactados

Refatorar o `DataTable` agora pode afetar telas que ainda não foram migradas,
incluindo:

- CRM;
- Leads;
- Clientes;
- Questionários;
- componentes compartilhados que esperam a API atual;
- qualquer tela que dependa da densidade compacta ou de ações por permissão.

## Riscos

Riscos de alterar nesta fase:

- regressão visual em tabelas ainda não migradas;
- quebra de espaçamento em telas CRM;
- alteração involuntária de estados loading/error/empty;
- alteração de comportamento de ações de linha;
- impacto indireto em permissões de ação por linha;
- divergência entre UI Kit e módulos legados durante a migração.

## Plano de Remoção

Remover a dívida apenas quando houver cobertura suficiente da migração de telas
que usam tabela.

Plano recomendado:

1. Mapear todos os consumidores de `DataTable`.
2. Criar snapshots visuais ou checklist manual por tela antes da refatoração.
3. Evoluir `components/design-system/data-table` para uma implementação própria,
   usando `AppCard`, `EmptyState`, `LoadingState` e `PaginationControls`
   compatíveis.
4. Manter a API pública atual durante a primeira troca.
5. Migrar consumidores por módulo, começando pelo CRM.
6. Remover a dependência de `GlassCard`.
7. Atualizar `/ui-kit` e `docs/ui/tables.md`.

## Estratégia da Sprint 5.0

Planejar a remoção na Sprint 5.0, após a Sprint 4.4 de migração do CRM validar
os padrões principais em telas reais.

Sprint 5.0 deve focar em:

- implementação oficial do `DataTable` sem `GlassCard`;
- compatibilidade da API atual;
- documentação de densidades;
- revisão de acessibilidade de seleção de linhas;
- estratégia de virtualização futura;
- validação visual das telas CRM, Leads, Clientes e Questionários.

## Decisão

Não refatorar o `DataTable` na Sprint 4.3.5.

Registrar a dívida e preservar estabilidade tem prioridade sobre remover a
dependência legada neste momento.

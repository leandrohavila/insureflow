# Tables

Tabelas são um padrão central do CRM operacional.

## Regras

- Usar `DataTable` oficial.
- Ações de linha sempre à direita.
- Empty, loading e error states padronizados.
- Densidade compacta para telas CRM.
- Paginação sempre abaixo da tabela.

## Performance

Tabelas devem permanecer preparadas para virtualização futura e não devem
misturar lógica de API com renderização visual.

## Estado atual

`DataTable` é o componente oficial para novas tabelas e preserva a API do
componente compartilhado existente. A implementação ainda é compatível com os
módulos já migrados e será endurecida visualmente durante a migração dos módulos
que dependem dela, para evitar alteração global involuntária em CRM, Leads e
Questionários.

Detalhes da dívida registrada: `docs/technical-debt/data-table.md`.

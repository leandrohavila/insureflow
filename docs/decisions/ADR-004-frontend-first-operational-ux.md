# ADR-004: UX operacional frontend-first

**Status:** Aceito

## Contexto

O usuário primário é o corretor no dia a dia. Latência percebida, feedback imediato e fluxo contínuo importam mais que completude de API em cada release.

O monorepo já separa `apps/web` (experiência) e `apps/api` (regras e persistência), com BFF em `app/api`.

## Decisão

- **Priorizar** entrega de fluxos completos na UI (leads → questionário → conversão → kanban) antes de automações backend pesadas.
- **TanStack Query** como fonte de verdade de leitura no client; optimistic updates em listas de alto churn.
- **BFF Next.js** para chamadas autenticadas — browser não fala direto com Nest.
- **Permissões** refletidas na UI (`PermissionGate`, `useCanManage`); backend permanece autoritativo.
- Formulários comerciais críticos (questionário) com validação rica **no client**, espelhada no server na submissão.
- Padrão página orquestra dialogs/sheets; estado de overlay no page container.

## Consequências

- Duplicação controlada de regras (validação questionário client + server).
- Módulos `lib/data-access/modules/*` são contrato estável para componentes.
- Features “só API” têm baixo valor até existir superfície web.

## Tradeoffs

| Prós | Contras |
|------|---------|
| Time-to-value para corretor | Risco de drift client/server |
| Percepção de performance | Mais lógica em bundle JS |
| Iteração visual rápida | Testes E2E tornam-se essenciais |

**Não significa:** pular validação server-side ou tenant isolation.

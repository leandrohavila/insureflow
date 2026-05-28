# Sprint 2 — Checklist de validação (local / HML)

Rollout **somente leads**. Produção permanece com `ownershipEnforcement: off` até conclusão deste checklist.

## Pré-requisitos

- [ ] Migration `20260527120000_ownership_foundations` aplicada (`pnpm --filter @repo/database db:migrate`)
- [ ] `pnpm --filter @repo/database db:seed`
- [ ] Backfill dry-run revisado: `pnpm --filter @repo/database db:backfill:lead-ownership`
- [ ] Backfill executado em HML (se necessário): `... --execute`
- [ ] `OWNERSHIP_ENFORCEMENT=shadow` na API (ou `Tenant.settings.ownershipEnforcement`)

## Usuários de teste (seed)

| Persona   | E-mail                         | Senha              | Escopo esperado |
|-----------|--------------------------------|--------------------|-----------------|
| Admin     | admin@insureflow.com           | Admin@2026!        | tenant          |
| Gerência  | gerencia@insureflow.com        | Gerencia@2026!     | team            |
| Comercial | comercial@insureflow.com       | Comercial@2026!  | own             |
| Parceiro  | parceiro@insureflow.com        | Parceiro@2026!     | shared          |

## Fase 3 HML — somente `shadow` (atual)

- [ ] `OWNERSHIP_ENFORCEMENT=shadow` na API HML
- [ ] Produção confirmada com `off` (sem alteração)
- [ ] **Não** definir `on` em HML até sign-off do [relatório de validação](./sprint-2-hml-validation-report.md)
- [ ] Em shadow: usuários **não** são bloqueados; validar logs `[ownership:shadow]`
- [ ] Preencher relatório com divergências e plano de correção

## Cenários funcionais (aplicam com `on` — pós sign-off)

### V1 — Parceiro

- [ ] Login como parceiro
- [ ] Lista de leads mostra **apenas** leads com `LeadShare` ativo
- [ ] Lead sem compartilhamento retorna 404 no detalhe
- [ ] Filtro "Meus leads" **não** aparece na UI

### V2 — Comercial

- [ ] Vê apenas leads com `ownerUserId` = próprio usuário
- [ ] "Meus leads" refina ainda mais (interseção com `assignedTo` legado quando aplicável)
- [ ] Criação de lead define `ownerUserId` / `ownerTeamId`

### V3 — Gerência

- [ ] Vê leads da equipe (`ownerTeamId` na equipe comercial)
- [ ] Não vê leads de outras equipes (quando existirem)

### V4 — Admin

- [ ] Vê todos os leads do tenant
- [ ] Filtro "Meus leads" oculto (escopo tenant)

## Modo shadow (obrigatório nesta fase)

- [ ] Logs `[ownership:shadow]` sem bloqueio de usuários
- [ ] Comparar contagens legacy vs ownership; investigar divergências > 0
- [ ] JWT: `dataScope` e `teamIds` corretos por persona (login API)
- [ ] UI: filtro "Meus leads" e PermissionGate por escopo (independente do bloqueio API)

## Regressão

- [ ] Deals, clientes, apólices e financeiro **sem** filtro ownership
- [ ] `assignedTo` continua preenchido em updates legados
- [ ] Login e refresh token inalterados

## Produção (bloqueado nesta sprint)

- [ ] **Não** alterar `ownershipEnforcement` em produção
- [ ] **Não** rodar backfill `--execute` em produção sem janela aprovada

## Evidências

Registrar em issue/PR: prints ou IDs de leads testados, trechos de log shadow, resultado JSON do backfill dry-run.

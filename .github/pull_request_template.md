## Summary

<!-- Descreva o que muda e por quê (1–3 frases) -->

## Tipo

- [ ] feat — nova funcionalidade
- [ ] fix — correção de bug
- [ ] infra — CI/CD, deploy, env
- [ ] chore — manutenção sem impacto funcional
- [ ] docs — documentação
- [ ] refactor — refatoração sem mudança de comportamento

## Checklist

- [ ] CI verde (`lint`, `check-types`, `db:validate`, build web + api)
- [ ] Testado localmente
- [ ] Sem alteração de domínio CRM não solicitada
- [ ] Migrations incluídas (se schema mudou) — ver [migration checklist](../docs/infra/release-checklists.md)

## Migrations

<!-- Preencher se houver pasta prisma/migrations/ -->

- [ ] N/A — sem migration
- [ ] Testada com `npm run db:migrate` local
- [ ] Forward-only (sem editar SQL já aplicado)

## Screenshots / evidências

<!-- Opcional -->

## Riscos conhecidos

<!-- Opcional — rollback, breaking changes -->

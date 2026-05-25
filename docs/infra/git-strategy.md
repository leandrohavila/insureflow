# Git strategy

## Branches

| Branch | Propósito | Proteção |
|--------|-----------|----------|
| `main` | Produção — sempre deployável | PR obrigatório, CI verde, 1 review |
| `develop` | Integração contínua pré-prod | PR obrigatório, CI verde |

### Fluxo

```
feature/* ──PR 'develop' ──► 'main'
hotfix/*  ──► 'main' (+ backport para develop)
```

1. Criar branch a partir de `develop`: `feature/crm-agenda-filtros`
2. Abrir PR para `develop`
3. Após QA em staging, PR `develop` → `main` para release

## Convenção de PR

- **Título**: `tipo(escopo): descrição curta` — ex.: `feat(crm): filtros na agenda`
- **Tipos**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `infra`
- **Corpo**: usar template em `.github/pull_request_template.md`
- **Escopo**: um domínio por PR (evitar PRs “god”)

## Merge policy

- **Squash merge** em `develop` e `main`
- Mensagem do squash = título do PR (Conventional Commits)
- Delete branch após merge

## Migration policy

| Regra | Detalhe |
|-------|---------|
| Nunca editar migration aplicada | Criar nova migration corretiva |
| PR com schema | Deve incluir pasta `prisma/migrations/` |
| Review | Migrations destrutivas exigem checklist em [release-checklists.md](release-checklists.md) |
| Deploy | `prisma migrate deploy` no release da API (nunca `migrate dev` em prod) |
| Rollback | Forward-only — reverter via nova migration ou restore de backup |

## Configuração GitHub (manual)

Em **Settings → Branches**:

- `main`: require PR, require status checks (`CI`), require 1 approval
- `develop`: require PR, require status checks (`CI`)
- Allow squash merge only (disable merge commit e rebase se desejado)

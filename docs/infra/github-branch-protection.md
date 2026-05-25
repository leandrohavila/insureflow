# GitHub branch protection

Configuração manual em **Settings → Branches → Add branch ruleset** (ou classic protection).

## Branches alvo

| Branch | Regras |
|--------|--------|
| `main` | PR required, 1 approval, status check `ci`, squash merge only |
| `develop` | PR required, status check `ci`, squash merge only |

## Status check obrigatório

Nome do job: **`ci`** (workflow `.github/workflows/ci.yml`)

## Merge settings (repo Settings → General)

- [x] Allow squash merging
- [ ] Allow merge commit (desabilitar)
- [ ] Allow rebase merging (opcional desabilitar)

## Criar branch `develop`

```bash
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

Fluxo de feature:

```bash
git checkout develop
git pull
git checkout -b feature/infra-1-1-typecheck
# ... commits ...
gh pr create --base develop --title "infra: stabilize typecheck and CI"
```

Release para produção:

```bash
gh pr create --base main --head develop --title "release: dev baseline"
```

## gh CLI (automação opcional)

```bash
# Ruleset via API (requer admin no repo)
gh api repos/{owner}/{repo}/rulesets --method POST -f name="Protect main" ...
```

Documentação GitHub: [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)

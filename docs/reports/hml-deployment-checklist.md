# Checklist de implantação HML — Ávila Corretora

**Release:** CRM-RELEASE-001 (`release/crm-operacao-avila`)  
**Data:** 21 de agosto de 2026  
**Regra:** este checklist é para **HML**. Produção, `main` e o serviço Railway de `api.corretoraavila.com.br` estão fora de escopo.

Não executar migration, seed ou import em produção.  
Não reutilizar `DATABASE_URL` nem `REDIS_URL` de produção.

---

## 0. Estado atual (pré-checklist)

| Item | Situação em 21/08/2026 |
|------|------------------------|
| Branch release | **Não criada** — working tree ainda em `feature/rbac-ownership-foundations` |
| Código no Git | **Não commitado** (695 paths no manifesto) |
| HML cloud | **Inexistente / 404** |
| Neon HML (`ep-flat-grass-*`) | **Inalcançável** (`P1001`) |
| Produção API pública | 404 Railway — **não usar** este serviço |

Itens abaixo começam desmarcados de propósito.

---

## A. Git (sem tocar em `main`)

- [ ] Branch release criada (`release/crm-operacao-avila`)
- [ ] Código revisado (manifesto `docs/reports/crm-release-manifest.md`)
- [ ] Paths de log/artifact **fora** do stage (`tsc.log`, `dist-test`, screenshots, `vercel.json` da raiz)
- [ ] Commit local criado (**somente após autorização**)
- [ ] Push para `origin` (**somente após autorização explícita** — não executar agora)

Comandos: ver `docs/reports/crm-release-readiness.md` § Git.

---

## B. Schema

- [ ] Migrations identificadas (12 untracked, ordem 20260701 → 20260825)
- [ ] `npx prisma validate` OK no schema do working tree
- [ ] Nenhuma migration destrutiva (`DROP TABLE` / `TRUNCATE`) nas 12 pendentes
- [ ] Prisma Client local 6.19.3 alinhado ao schema

---

## C. Infra HML (criar do zero — não reutilizar produção)

Serviços antigos documentados (`insureflow-api-dev.up.railway.app`, `insureflow-web-dev.vercel.app`) respondem **404**. Recriar:

- [ ] Neon HML criado (`insureflow-hml`) — projeto/branch **distinto** do Neon de produção
- [ ] Redis HML criado (plugin Railway no projeto HML)
- [ ] Railway API HML criado (`insureflow-api-hml`) — serviço **novo**, branch = `release/crm-operacao-avila`
- [ ] Vercel Web HML criado (projeto/preview **InsureFlow Web HML**) — **não** o projeto que serve `corretoraavila.com.br`

---

## D. Secrets e variáveis (valores novos — não copiar produção)

- [ ] Secrets configurados no Railway HML e Vercel HML
- [ ] `DATABASE_URL` HML configurado (pooled Neon HML)
- [ ] `DATABASE_URL_DIRECT` HML configurado (direct Neon HML)
- [ ] Redis HML configurado (`REDIS_URL` referência interna, não `127.0.0.1`)
- [ ] CORS configurado com a URL real do Web HML
- [ ] `JWT_SECRET` HML ≥ 32 caracteres (**novo**)
- [ ] `AUTH_SECRET` HML ≥ 32 caracteres (**novo**)
- [ ] `API_INTERNAL_URL` / `API_URL` = URL da API HML **depois** do health 200
- [ ] `API_PUBLIC_URL` = URL pública da API HML
- [ ] `OWNERSHIP_ENFORCEMENT=on` (paridade com a homologação local) **ou** `shadow` se combinado
- [ ] `SEED_DEV_DATA` só no passo de seed HML; depois voltar a `0` se desejado
- [ ] Confirmado: nenhuma variável aponta para host/banco de produção

Tabela de status: `docs/reports/crm-release-readiness.md` § Variáveis.

---

## E. Deploy HML (não produção)

- [ ] API deployada no Railway `insureflow-api-hml`
- [ ] `/health` = 200
- [ ] `/health/db` = 200
- [ ] `/health/redis` = 200
- [ ] WEB `/login` = 200
- [ ] BFF `POST /api/auth/login` fala com a API HML (401 de credencial inválida é OK; 404 Railway não é)

**Atenção:** o `Dockerfile` da API roda `prisma migrate deploy` no boot. Isso é aceitável **somente** se `DATABASE_URL` do serviço for o Neon **HML**. Conferir a variável no Railway **antes** do primeiro deploy.

---

## F. Dados HML (nunca produção)

- [ ] API migrations aplicadas (**somente Neon HML**)
- [ ] Seed HML executado (**somente Neon HML**)
- [ ] Personas criadas (`admin@`, `gerencia@`, `comercial@`, `parceiro@` + BUs Corretora Ávila / Imóveis)
- [ ] Confirmado: nenhum seed/import bateu em produção

---

## G. Homologação assistida (depois do HML no ar)

- [ ] ACL validado (parceiro 403 em carteira/agenda/360; comercial 403 em import de clientes)
- [ ] Ownership validado (leads: own / team / tenant)
- [ ] Importador validado (preview + commit com **planilha de teste**, não carteira real)
- [ ] Agenda validada (hoje / atrasada / 7 / 30; comercial sem HTTP 500)
- [ ] Renovação validada (filtros + deal `sourceType=RENEWAL`)
- [ ] Customer 360 validado (abas renovação + agenda)
- [ ] Pipeline validado (Kanban HOTFIX-001 + WON → comissão)

---

## Fora deste checklist (proibido agora)

- [ ] ~~Deploy em `main` / produção~~
- [ ] ~~Migration em produção~~
- [ ] ~~Seed em produção~~
- [ ] ~~Import de dados reais da Ávila em produção~~
- [ ] ~~WhatsApp Inbox / Instagram (CRM-007)~~

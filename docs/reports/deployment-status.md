# Status de deploy — PR #28

Data da consulta: 2026-10-06  
Fonte: `git fetch origin main`, GitHub (`gh pr view 28` e deployments) e o HTML servido pela Vercel. Nenhum código foi alterado.

## Resposta

A PR #28 **não foi implantada em produção**. Continua aberta, em rascunho, sem merge. O domínio `grupoavilaimoveis.com.br` serve o commit `badbb4f`, anterior a esta PR.

## 1. Commit atual da `main`

`b7107cc4bd28547851c0a157b7bb55afd66b2fae`  
28 de setembro de 2026, 22:37 (-0300)  
`Merge pull request #27 from leandrohavila/fix/crm-filtro-origem-leads`

A ponta da PR (`311ae252cca8d0860e84911077198ab6aaa21c70`) não está em `main`. O primeiro commit da PR (`d4a8b69`) também não está.

## 2. Commit publicado na Vercel

Projeto do portal: `insureflow-portal-imobiliario-publico`.

O último deploy de **Production** que concluiu foi:

| Campo | Valor |
| --- | --- |
| Commit | `badbb4fb7671033d157c374cab3b8c49c744888f` |
| Mensagem | `feat(portal): premium property cards and institutional stats` |
| Data do commit | 27 de setembro de 2026, 21:18 (-0300) |
| Deploy | 28 de setembro de 2026, 00:29 UTC, estado `success` |
| URL do deploy | `https://insureflow-portal-imobiliario-publico-9qhs5f1i5.vercel.app` |

`https://grupoavilaimoveis.com.br/` devolve o mesmo título e o mesmo CSS (`/_next/static/css/80be6f72848f4f67.css`) desse deploy. Não contém `whatsapp_click` nem o título desta PR.

O preview da ponta da PR, commit `311ae25`, concluiu em outro endereço: `https://insureflow-portal-imobiliario-publico-fpunto57y.vercel.app`. Esse sim traz o título `Grupo Ávila Imóveis | Imobiliária em Uberaba` e a string `whatsapp_click`. Não é o domínio de produção.

## 3. Existe deploy pendente?

Não há deploy de produção pendente da PR #28.

- O preview do portal, do `web` e da `insureflow-api` no commit `311ae25` já está com estado `success` (6 de outubro de 2026, por volta de 23:11 UTC).
- O registro de Production do portal no commit atual da `main` (`b7107cc`, 29 de setembro de 2026, 01:37 UTC) ficou `inactive`, com a descrição `Skipped - Not affected`. A URL desse registro mostra “Deployment was cancelled”. A Vercel não substituiu o portal em produção nesse commit.

## 4. A PR #28 foi mergeada?

Não.

| Campo | Valor |
| --- | --- |
| Estado | `OPEN` |
| Rascunho | sim |
| `mergedAt` | vazio |
| `mergeCommit` | vazio |
| Base | `main` |
| Head | `cursor/sprint-9-portal-conversao-f4ed`, não está em `main`. O commit de código verificado neste relatório é `311ae25` |
| URL | https://github.com/leandrohavila/insureflow/pull/28 |

## 5. Para qual commit a produção aponta?

Depende do projeto. Não é um único commit para tudo.

| Alvo | Commit em produção | Observação |
| --- | --- | --- |
| Portal (`grupoavilaimoveis.com.br`) | `badbb4f` | último Production concluído |
| `main` no GitHub | `b7107cc` | à frente do portal; o deploy do portal nesse commit foi ignorado |
| Web e API na Vercel | `b7107cc` | Production desses dois projetos concluiu em 29 de setembro de 2026 |
| PR #28 | nenhum ambiente de produção | só preview em `311ae25` |

A PR #28 só entra no domínio público depois do merge em `main` e de um deploy de Production do projeto `insureflow-portal-imobiliario-publico` que conclua, em vez de ser ignorado.

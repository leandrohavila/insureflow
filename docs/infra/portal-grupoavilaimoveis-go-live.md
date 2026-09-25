# Go-live — portal `grupoavilaimoveis.com.br`

Portal: projeto Vercel do app `apps/portal-imobiliario-publico`.

| Papel | URL |
|-------|-----|
| Canônica | `https://grupoavilaimoveis.com.br` |
| Alias | `https://www.grupoavilaimoveis.com.br` → **308** para o apex |
| HTTP | Vercel emite o certificado e redireciona HTTP → HTTPS quando o domínio fica **Valid** |

## DNS (Registro.br)

Confirme o IP no assistente **Vercel → Settings → Domains** antes de gravar a zona. O valor abaixo é o mesmo usado em `corretoraavila.com.br`.

| # | Tipo | Nome | Valor | TTL |
|---|------|------|-------|-----|
| 1 | `A` | `@` | `76.76.21.21` | 3600 |
| 2 | `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |

Não há API neste domínio. Não crie `CNAME` de `api`.

Se a Vercel pedir verificação de posse antes do `A`, crie o `TXT` exatamente como o painel mostrar e só então publique o `A` e o `CNAME`.

## Vercel

Projeto do portal (root `apps/portal-imobiliario-publico`) → **Settings → Domains**:

1. Adicionar `grupoavilaimoveis.com.br` e marcar como produção / primary.
2. Adicionar `www.grupoavilaimoveis.com.br` com redirect para o apex.
3. Em **Environment Variables** (Production):

```env
NEXT_PUBLIC_PORTAL_URL=https://grupoavilaimoveis.com.br
PORTAL_PUBLIC_URL=https://grupoavilaimoveis.com.br
```

4. Redeploy de produção depois de salvar as variáveis (`NEXT_PUBLIC_*` entra no build).

O código também troca hosts antigos `*.vercel.app` do portal pela URL canônica, e o `vercel.json` do app responde **308** de `www` e desses hosts para o apex.

CLI, com o diretório do app linkado e `VERCEL_TOKEN`:

```bash
npx vercel domains add grupoavilaimoveis.com.br
npx vercel domains add www.grupoavilaimoveis.com.br
npx vercel env add NEXT_PUBLIC_PORTAL_URL production
npx vercel env add PORTAL_PUBLIC_URL production
```

Neste ambiente não havia `VERCEL_TOKEN`. Os domínios **não** foram anexados ao projeto da Vercel daqui.

## Checklist de go-live

- [ ] Zona DNS com `A @` → `76.76.21.21` e `CNAME www` → `cname.vercel-dns.com`
- [ ] Domínios **Valid** no projeto Vercel do portal, apex como primary
- [ ] `www` configurado para redirecionar ao apex
- [ ] `NEXT_PUBLIC_PORTAL_URL` e `PORTAL_PUBLIC_URL` = `https://grupoavilaimoveis.com.br` em Production
- [ ] Redeploy de produção concluído
- [ ] `https://grupoavilaimoveis.com.br` responde 200 com certificado válido
- [ ] `http://grupoavilaimoveis.com.br` e `http://www.grupoavilaimoveis.com.br` vão para `https://grupoavilaimoveis.com.br`
- [ ] `https://www.grupoavilaimoveis.com.br/imoveis` responde **308** para `https://grupoavilaimoveis.com.br/imoveis`
- [ ] `/robots.txt` com `Host` e `Sitemap` no apex
- [ ] `/sitemap.xml` com `<loc>` em `https://grupoavilaimoveis.com.br`
- [ ] HTML com `canonical`, `og:url` e `twitter:card` no apex
- [ ] Hosts `insureflow-portal-imobiliario-publico.vercel.app` e `insureflow-portal-imobiliario-publi.vercel.app` redirecionam ao apex depois do deploy

```bash
curl -sI https://grupoavilaimoveis.com.br | head
curl -sI https://www.grupoavilaimoveis.com.br/imoveis | head
curl -s https://grupoavilaimoveis.com.br/robots.txt
curl -s https://grupoavilaimoveis.com.br/sitemap.xml | head
echo | openssl s_client -servername grupoavilaimoveis.com.br -connect grupoavilaimoveis.com.br:443 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

## Evidência em 2026-09-25

O domínio `grupoavilaimoveis.com.br` **não resolve** (sem registro DNS público; `curl` retorna *Could not resolve host*). SSL, HTTPS, sitemap e redirect do domínio oficial não puderam ser medidos.

Hosts da Vercel consultados antes deste ajuste:

| Host | HTTP | Observação |
|------|------|------------|
| `insureflow-portal-imobiliario-publico.vercel.app` | 404 `DEPLOYMENT_NOT_FOUND` | Sem deployment nesse alias |
| `insureflow-portal-imobiliario-publi.vercel.app` | 200 | Portal no ar; HSTS da Vercel |
| `portal-imobiliario-publico.vercel.app` | 404 `DEPLOYMENT_NOT_FOUND` | Mesmo assim é o host gravado hoje em `/robots.txt` e `/sitemap.xml` do alias que responde 200 |
| `insureflow-portal-imobiliario-publico-leandro-avila-s-projects.vercel.app` | 200 | Alias de projeto, `x-robots-tag: noindex` |

Não havia essas URLs fixas no código. A canônica publicada vinha da variável de ambiente apontando para `https://portal-imobiliario-publico.vercel.app`. O código passa a ignorar esses hosts e a usar `https://grupoavilaimoveis.com.br`.

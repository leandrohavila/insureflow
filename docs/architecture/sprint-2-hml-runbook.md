# Sprint 2 — Runbook operacional HML (Fase 4)

**Produção:** `OWNERSHIP_ENFORCEMENT=off`  
**HML:** `OWNERSHIP_ENFORCEMENT=shadow`  
**Bloqueado:** `on` até sign-off do [relatório](./sprint-2-hml-validation-report.md)

---

## 1. PR

Abrir (ou revisar):

https://github.com/leandrohavila/insureflow/compare/develop...feature/rbac-ownership-foundations?expand=1

**Título:** `feat(rbac): Sprint 2 ownership foundations (leads, shadow mode)`

Merge em `develop` somente após validação HML documentada.

---

## 2. Deploy HML

Guia detalhado: **[sprint-2-hml-deploy-guide.md](./sprint-2-hml-deploy-guide.md)**  
Browser: **[sprint-2-browser-validation-checklist.md](./sprint-2-browser-validation-checklist.md)**

1. Deploy da branch `feature/rbac-ownership-foundations` (API Railway + Web Vercel preview/HML).
2. Railway — variáveis API HML:

```env
OWNERSHIP_ENFORCEMENT=shadow
```

3. Confirmar produção **não** recebeu esta variável (permanece `off` ou ausente).

4. Smoke rápido:

```powershell
$env:API_URL = "https://<sua-api-hml>"
node scripts/dev-cloud-smoke.cjs
```

---

## 3. Banco HML

```powershell
$env:DATABASE_URL = "<neon-hml-url>"
cd c:\Projetos\InsureFlow

node scripts/hml-sprint2-db.cjs migrate
node scripts/hml-sprint2-db.cjs seed
node scripts/hml-sprint2-db.cjs backfill-dry
# Revisar JSON — se consistente:
node scripts/hml-sprint2-db.cjs backfill-execute
```

**Nunca** usar `DATABASE_URL` de produção nestes comandos.

---

## 4. Validação automatizada (API)

```powershell
$env:API_URL = "https://<api-hml>"
$env:WEB_URL = "https://<web-hml>"   # opcional — BFF session
node scripts/hml-sprint2-validation.cjs
```

Saída: `docs/architecture/sprint-2-hml-validation-run.json`

---

## 5. Shadow logs (Railway)

Filtrar logs da API:

```text
[ownership:shadow]
```

Registrar no [relatório](./sprint-2-hml-validation-report.md) seção 2.

---

## 6. Validação manual (browser)

| Persona | Login | UI |
|---------|-------|-----|
| Admin | admin@insureflow.com | sem "Meus leads"; menus completos |
| Gerência | gerencia@insureflow.com | equipe; teamIds no /api/auth/me |
| Comercial | comercial@insureflow.com | "Meus leads"; create lead |
| Parceiro | parceiro@insureflow.com | sem "Meus leads"; só shared (shadow: lista legado + log) |

Checklist completo: [sprint-2-hml-checklist.md](./sprint-2-hml-checklist.md)

---

## 7. Sign-off

Preencher [sprint-2-hml-validation-report.md](./sprint-2-hml-validation-report.md) e anexar ao PR.

Somente após aprovação: considerar `OWNERSHIP_ENFORCEMENT=on` em HML piloto (não produção).

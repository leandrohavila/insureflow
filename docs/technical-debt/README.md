# Dívida técnica conhecida

Inventário vivo. Priorizar itens que afetam **integridade de dados** ou **UX do corretor**.

## Crítico

| ID | Descrição | Área |
|----|-----------|------|
| TD-01 | Delete de lead sem validar `dealId` ou questionários | Leads |
| TD-02 | `assignedTo` sem FK — valores órfãos ou nomes livres | Domínio |
| TD-03 | Lead sem `document` — duplicatas inevitáveis | Domínio |
| TD-04 | Stage `fechado` desacoplado de `status: won` | CRM |

## Alto

| ID | Descrição | Área |
|----|-----------|------|
| TD-05 | Role seed `sales` sem `questionnaires:*` | Auth/seed |
| TD-06 | Submissão `submitted` editável sem workflow de revisão | Questionários |
| TD-07 | `submittedAt` não auto-preenchido no server | Questionários |
| TD-08 | Múltiplos drafts por lead+template possíveis | Questionários |
| TD-09 | Sem paginação/filtro em `GET /crm/deals` | CRM |

## Médio

| ID | Descrição | Área |
|----|-----------|------|
| TD-10 | CRM contacts/activities sem entidade própria | CRM UI |
| TD-11 | `reviewed` / `archived` submission sem UI | Questionários |
| TD-12 | FILE field validado como string apenas | Questionários |
| TD-13 | Drift potencial validação questionário client/server | Frontend |
| TD-14 | `apps/api/dist` e artefatos build no working tree | Repo hygiene |

## Baixo

| ID | Descrição | Área |
|----|-----------|------|
| TD-15 | EXTERNAL mode questionário não usado no web | Questionários |
| TD-16 | Listas `companies`, `policies` em query-keys sem módulo completo | Frontend |

## Como registrar novo item

```markdown
| TD-XX | Descrição curta | Área | Sugestão de mitigação |
```

Atualizar quando item for resolvido (linkar PR ou commit).

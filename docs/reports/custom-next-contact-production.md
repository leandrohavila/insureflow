# Próximo contato com data personalizada — produção

**Data:** 2026-09-01  
**Branch:** `release/crm-operacao-avila`  
**SHA:** `33d057d` (`feat(crm): allow custom next-contact date on Lead and feed Agenda Comercial`)  
**Ambiente:** https://corretoraavila.com.br · https://api.corretoraavila.com.br

Não foi criado módulo novo. A data personalizada reutiliza `Activity` e a Agenda Comercial já existentes.

---

## Veredicto

| Item | Resultado |
|------|-----------|
| Opção **Data personalizada** no cadastro do Lead | ✅ no próprio formulário (sem modal sobre modal) |
| Data + hora + tipo + observação | ✅ |
| Tipos Ligação / WhatsApp / E-mail / Reunião / Visita / Follow-up / Renovação / Tarefa | ✅ |
| Ao salvar: Activity vinculada ao Lead e ao responsável | ✅ |
| Envio para Agenda Comercial | ✅ janela **Futuro** (além de Hoje / Atrasados / 7 / 30) |
| D-60 / D-30 / D-15 sugeridos e editáveis quando há `policyExpiresAt` | ✅ |
| Homologação Bruna Lopes Coelho | ✅ lead + 4 atividades em produção |
| Conclusão / reagendamento | ✅ APIs existentes da Activity |
| Lint (arquivos da feature) | ✅ |
| `tsc --noEmit` API | ✅ |
| `nest build` API | ✅ local + Railway |
| `next build` Web | ✅ Vercel produção |
| Testes unitários da feature | ✅ 34 Jest + 25 Vitest |
| Deploy Vercel + Railway | ✅ |

`check-types` do working tree local ainda falha em `governance-companies.tsx` **não commitado**. O build publicado saiu do worktree limpo em `33d057d`.

---

## Deploys

### Web — Vercel

| Campo | Valor |
|-------|--------|
| Deployment | `dpl_CknTAwM6F147x4EHAJUroPWTNjGe` |
| URL | https://web-ojhojv20d-leandro-avila-s-projects.vercel.app |
| Alias | https://corretoraavila.com.br |
| Inspect | https://vercel.com/leandro-avila-s-projects/web/CknTAwM6F147x4EHAJUroPWTNjGe |
| Origem | worktree limpo `C:\Projetos\InsureFlow-wt-agenda` em `33d057d` |

### API — Railway

| Campo | Valor |
|-------|--------|
| Serviço | `insureflow-api` |
| Deploy | `3b7bdecc-1577-4f62-880f-4bfac6ce3a89` |
| Logs | https://railway.com/project/645fb36c-1714-408c-a927-ffdf838ed780/service/6c04caad-c270-4ab8-91a6-7c47cba59d87?id=3b7bdecc-1577-4f62-880f-4bfac6ce3a89 |
| Imagem | `sha256:eac344d205776e078fca7581c01e363f436ecdabea7db884df99d24f3b0ef277` |
| Health | `GET /api/v1/health` 200 · `GET /api/v1/health/db` connected |
| SHA | `33d057d` |

Sem migration nova: `Activity` já tinha `occurredAt`, `nextFollowUpAt`, `operationalEventKind` e vínculo com Lead/responsável.

---

## Comportamento

No cadastro/edição de Lead, a seção **Próxima ação** oferece:

- Não agendar agora
- Amanhã / 3 / 7 / 15 dias (continua criando follow-up rápido)
- **Data personalizada** → Data, Hora, Tipo, Observação no próprio formulário

Se `policyExpiresAt` estiver preenchido, o formulário sugere D-60, D-30 e D-15 (09:00) e permite editar cada data/hora.

Ao salvar:

- `nextContactAt` cria/atualiza Activity `operationalEventKind = lead_next_contact`
- renovação cria/atualiza Activities `lead_renewal_d60|d30|d15`
- ambas vão para `/crm/agenda`

A coleta da agenda passou de **+30 dias** para **+800 dias**, com janela `future` (depois dos próximos 30 dias). Um contato em março/2027 **não** entra em Hoje / 7 / 30 — entra em **Futuro**, e migra sozinho para 30/7/Hoje/Atrasados quando a data chegar.

A Agenda respeita a empresa ativa. O operador precisa estar em **Corretora Ávila** para ver atividades de leads da corretora.

---

## Homologação em produção — Bruna Lopes Coelho

Cenário: apólice hoje em outra corretora, vencimento abril/2027, contato comercial em março/2027 para trazer a apólice à Corretora Ávila.

| Campo | Valor |
|-------|--------|
| Lead | Bruna Lopes Coelho |
| Id | `cmti2icbe0005o22q5f7x6bd9` |
| `opportunityType` | `renewal` |
| `policyExpiresAt` | 2027-04-15 |
| `currentInsurer` | Porto Seguro |
| Responsável | Leandro (`ownerUserId` resolvido) |
| Próximo contato | 2027-03-15 13:00 UTC · WhatsApp |
| Empresa | Corretora Ávila |

Atividades criadas (visíveis em `/crm/agenda` → **Futuro**, com empresa Corretora Ávila):

| Tipo | Kind | Quando |
|------|------|--------|
| WhatsApp | `lead_next_contact` | 2027-03-15 |
| Renovação D-60 | `lead_renewal_d60` | ~2027-02-14 (editável) |
| Renovação D-30 | `lead_renewal_d30` | 2027-03-16 |
| Renovação D-15 | `lead_renewal_d15` | 2027-03-31 |

Janelas no dia da homologação (2026-09-01):

| Janela | Bruna |
|--------|--------|
| Hoje | 0 |
| Atrasados | 0 |
| Próximos 7 dias | 0 |
| Próximos 30 dias | 0 |
| Futuro | 4 |

Conclusão: `PATCH /api/v1/activities/:id` com `status=completed` grava `completedAt`.  
Reagendamento: na Agenda, em atividade **pendente**, `nextFollowUpAt` reabre como pending e atualiza a data.

---

## Testes executados

API (`apps/api`):

```
npx jest lead-next-contact.util.spec lead-next-contact.sync.spec
         lead-renewal-agenda.util.spec lead-renewal-agenda.sync.spec
         lead.dto.spec leads.service.spec
         commercial-agenda-window.util.spec activity-complete.util.spec
→ 8 suites, 34 tests passed
```

Web (`apps/web`):

```
npx vitest run lead-next-contact-form.spec.ts create-lead-payload.spec.ts lead-dialog-form.spec.ts
→ 3 files, 25 tests passed
```

Cobertura da regra:

- data personalizada → ISO
- atividade futura março/2027
- D-60/D-30/D-15 sugeridos e override
- janelas today / overdue / next7 / next30 / future
- conclusão (`completedAt`) e reagendamento (`pending` + nova data)

---

## Arquivos principais

- `apps/api/src/modules/leads/lead-next-contact.util.ts`
- `apps/api/src/modules/leads/lead-next-contact.sync.ts`
- `apps/api/src/modules/leads/lead-renewal-agenda.util.ts`
- `apps/api/src/modules/leads/dto/lead.dto.ts`
- `apps/api/src/modules/leads/leads.service.ts`
- `apps/api/src/modules/commercial-agenda/commercial-agenda-window.util.ts`
- `apps/web/components/leads/lead-dialog.tsx`
- `apps/web/lib/data-access/modules/leads/lead-next-contact-form.ts`
- `apps/web/components/crm/commercial-agenda-workspace.tsx`

Não foram publicados portal, `.env`, captura imobiliária WIP nem diagnósticos de lista de leads.

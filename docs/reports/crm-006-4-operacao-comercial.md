# CRM-006.4 — Operação comercial (importação, carteira e agenda)

**Data:** 21 de agosto de 2026  
**Ambiente:** local (`api` :4000, PostgreSQL `insureflow`, tenant `insureflow`)  
**Persona de homologação:** `admin@insureflow.com`  
**Escopo:** preparar a Ávila Corretora para operação real **antes** de WhatsApp Inbox e Instagram. Sem alterar fluxos já homologados (HOTFIX-001: Kanban, Customer 360, WON → comissão, ownership de leads).

## Classificação

# APROVADO COM RESSALVAS

O fluxo ponta a ponta pedido na Fase 5 fechou em runtime na API: importar lead → importar cliente com apólice → carteira de renovação → criar atividade → abrir Customer 360 → criar deal de renovação. As telas novas existem no CRM. Há ressalvas de modelo (campos extras da planilha em notas; status “Proposta Enviada” ainda não é enum) e a UI de agenda substitui a listagem anterior sem remover o motor de atividades.

---

## O que foi implementado

### Fase 1 — Importador comercial

Módulo `CRM Importador Comercial`.

| Item | Entrega |
|------|---------|
| Menu | CRM → **Importações** |
| Hub | `/crm/importacoes` |
| Leads | `/crm/importacoes/leads` |
| Clientes | `/crm/importacoes/clientes` |
| Modelo XLSX | botão **Baixar Modelo** (ExcelJS) |
| Preview | total / válidos / com erro + download do log CSV |
| Commit | lote com upsert por CPF/CNPJ (atualiza se existir, cria se não) |

API:

- `GET /api/v1/commercial-import/leads/template`
- `POST /api/v1/commercial-import/leads/preview`
- `POST /api/v1/commercial-import/leads/commit`
- equivalentes em `/clientes/...`

ACL: `leads:view/manage` para leads; `clients:view/manage` para clientes. Upsert de lead respeita ownership (`assertCanAccessLead` quando enforcement = on). Business Unit resolvida por id/slug/nome (fallback `corretora-avila` / BU corrente). Responsável resolvido por id, e-mail ou nome.

Importação de **cliente** com Número de Apólice + seguradora + produto + vencimento cria/atualiza `Policy` e entra na fila `PolicyRenewal` (`RENEWAL_PENDING`), sem duplicar número de apólice no tenant.

### Fase 2 — Carteira de renovação

Nova tela `/crm/renovacoes-carteira` (a fila `/crm/renovacoes` **não foi removida**).

Filtros: vence em 30/60/90 dias, período personalizado, produto, seguradora, empresa, corretor (ID), status.

Colunas: cliente, produto, seguradora, número, início, fim, dias para vencer, responsável, status.

Ações: Customer 360, criar Deal de renovação, criar atividade, enviar ao pipeline (`POST /policy-renewals/:id/deal` e `/:id/activity`).

Labels da carteira (sem quebrar a fila antiga):

| Enum persistido | Tela da carteira |
|-----------------|------------------|
| ACTIVE / RENEWAL_PENDING | Pendente |
| RENEWAL_IN_PROGRESS | Em Cotação |
| RENEWED | Renovado |
| LOST | Perdido |

### Fase 3 — Agenda comercial

`/crm/agenda` passou a usar a agenda unificada (`GET /api/v1/commercial-agenda`).

Visões: Hoje, Atrasadas, Próximos 7, Próximos 30.

Tipos: Follow-up, Renovação, Reativação, SLA, Ligação, WhatsApp, Email, Reunião.

Colunas: data, hora, cliente, lead, tipo, responsável, status, origem.

Ações: concluir / reagendar (atividade e follow-up), abrir lead, cliente, 360 e deal.

KPIs: atividades hoje, atrasadas, renovações próximas, reativações pendentes, SLA atrasados.

### Fase 4 — Customer 360

Aba **Renovações** ampliada: histórico de apólices, fila (anteriores/futuras), valor total segurado, receita gerada.

Nova aba **Agenda**: atividades futuras e concluídas.

Payload extra: `renewalBook` e `agenda` em `GET /customers/:id/360`.

### Isolamento

Todas as rotas novas exigem JWT + permissão. Filtros de tenant são obrigatórios. BU via `BusinessUnitAccessService`. Ownership no upsert de lead. Detalhe fora do ACL continua 404 nas rotas já existentes de renovação.

---

## O que foi homologado

Script: `apps/api/scripts/homolog-crm-006-4.cjs` contra `http://localhost:4000`, admin do tenant `insureflow`.

Fluxo:

```
Importar Leads
  → Importar Clientes (apólice)
  → Carteira de renovação (dueInDays=30)
  → Criar atividade
  → Customer 360
  → Criar deal de renovação (sourceType=RENEWAL)
```

### Evidências (lote `094544`)

| Passo | Resultado |
|-------|-----------|
| Preview leads | total 1, válidos 1, erros 0 |
| Commit leads | created 1 / updated 0 / failed 0 |
| Preview clientes | total 1, válidos 1, erros 0 |
| Commit clientes | created 1 / policies 1 / failed 0 |
| CPF lead | `39053309462` |
| CPF cliente | `52998209416` |
| Apólice | `CRM0064-094544` |
| Renovação | `cmt308jil000bkw48j1b87w5r` · vence em **20** dias · `RENEWAL_PENDING` |
| Cliente | `cmt308jgz0007kw48pta6ehzy` · CRM0064 Cliente 094544 |
| Deal renovação | `cmt308jms000hkw48wb9infig` |
| 360 políticas | 1 |
| 360 renovações | 1 |
| 360 agenda futura | 1 |
| 360 agenda concluída | 2 |
| Valor segurado | R$ 4.800 |
| Agenda next30 | 17 itens · métricas today 14 / overdue 48 / renewalsUpcoming 1 / slaOverdue 24 |

Unidade usada na planilha: `corretora-avila`.

Testes unitários: mapping do importador, PolicyRenewalsService e Customer360Service — **11 passed**. `tsc --noEmit` da API — limpo.

---

## Fluxos validados

1. Planilha de leads válida gera preview e grava lead novo com documento único.
2. Planilha de clientes válida gera cliente + apólice + item na carteira (não duplica `policyNumber`).
3. Filtro “vence em 30 dias” encontra a apólice importada (20 dias).
4. Criar atividade da renovação aparece na aba Agenda do 360 (`upcoming`).
5. Criar deal envia ao pipeline com `sourceType=RENEWAL` e liga `dealId` na renovação.
6. Customer 360 devolve histórico de apólice, renovação, totais e agenda.
7. Agenda comercial agrega atividades, follow-ups, carteira, reativação e SLA.

---

## Pendências encontradas

1. **Campos extras da planilha** (cidade, UF, WhatsApp, seguradora atual no lead) não viraram colunas no schema. No lead, vão para `notes`. No cliente, cidade/UF não persistem em campo próprio.
2. **Status “Proposta Enviada”** não existe no enum `CommercialRenewalStatus`. A carteira mostra “Em Cotação” para `RENEWAL_IN_PROGRESS`. Incluir o quinto status exige migration de enum.
3. **Filtro de corretor** na carteira usa ID de usuário, não lista nominal.
4. **Upsert de cliente** não aplica o mesmo recorte de ownership dos leads (CustomersService da listagem já era gap residual do HOTFIX-001).
5. **UI da agenda antiga** (`agenda-page.tsx`) deixou de ser a página `/crm/agenda`. Concluir/reagendar de follow-up e atividade permanecem; itens de renovação/SLA/reativação não têm “concluir” no mesmo sentido.
6. Homologação da Fase 5 foi **API + payload 360**, não clique a clique no browser. As rotas Next (`/crm/importacoes`, `/crm/renovacoes-carteira`, `/crm/agenda`) estão ligadas ao BFF.
7. WhatsApp Inbox e Instagram **não iniciados**, conforme o epic.

---

## O que não foi alterado (homologado)

- Kanban `/crm/negocios` e contrato de deals
- Conversão lead → deal e WON → comissão
- Ownership enforcement de leads
- Fila `/crm/renovacoes` (workspace anterior)
- CRM-007 / inbox / Instagram

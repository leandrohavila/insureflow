# Auditoria operacional InsureFlow

**Data:** 20 de agosto de 2026  
**Ambiente:** local (`web` :3000, `api` :4000, PostgreSQL :5432, Redis :6379)  
**Tenant:** `insureflow`  
**Regra desta auditoria:** não conta código compilando nem teste unitário. Conta evidência de ponta a ponta (banco → API → BFF → tela → ACL → React Query → navegação → fluxo).

---

## Resumo executivo

O InsureFlow **não está pronto para a Ávila Corretora operar 100% nele**.

Há um núcleo comercial **realmente vivo** (login, leads, clientes, questionários, SLA, business units, atividades). Há também um buraco crítico de **schema vs código**: a API já espera `product_type` em `deals` e as tabelas `sales_targets` / `sales_commissions` / `commission_rules`, mas a migration `20260820250000_sales_targets_commissions` **não está aplicada**. Isso derruba, neste ambiente, o Kanban de negócios, o Customer 360, o dashboard executivo, metas e comissões.

Além disso, **apólices, sinistros e WhatsApp no menu são placeholder**. Não há Instagram. Follow-ups, renovações, comunicações e cross-sell têm API/tela, mas **zero registros operacionais**. Ownership padrão está **desligado**, então `comercial` e `parceiro` enxergam a carteira inteira de leads.

**Percentual real do sistema: 48%.**

Isso é a média dos 25 módulos abaixo, ponderada por evidência de runtime. Não é percentual de linhas de código.

### O que funciona

- Autenticação JWT (API) e sessão web (admin logado no browser).
- Health: API `ok`, PostgreSQL `connected`, Redis `connected`.
- Leads: lista com 35 registros, filtros, paginação, botões de criar/editar/converter.
- Clientes: lista com 8 registros, CRUD na UI, filtros PF/PJ/status.
- ACL por Business Unit para `sales@` (20 leads / 5 clientes) vs `imoveis@` (15 / 3).
- RBAC de permissão: `parceiro` recebe 403 em clientes, deals e dashboard SLA.
- Questionários: 9 templates, 21 submissões, builder abre.
- SLA: API `inSla=6`, `overdue=24`.
- Atividades: 53 registros na API.
- Pipelines cadastrados: 2 (Corretora Ávila + Ávila Imóveis).

### O que não funciona (bloqueia operação)

- `GET /api/v1/crm/deals` → **500**. Kanban mostra 0 negócios apesar de **33 deals no banco**.
- `GET /api/v1/customers/:id/360` → **500**. Tela: “Não foi possível abrir o Customer 360.”
- `GET /api/v1/crm/dashboard-executivo`, `/performance`, `/sales-targets`, `/commissions`, `/commission-rules` → **500**.
- `/apolices`, `/sinistros`, `/whatsapp` → placeholder (“Estamos preparando esta área”).
- 0 follow-ups, 0 renovações, 0 comunicações, 0 oportunidades de cross-sell, 0 leads `lost`.
- Provider de comunicação = `INTERNAL` (Evolution não está ativo neste runtime).
- Instagram: inexistente no código.

### O que impede operação real

1. Migration de metas/comissões não aplicada → Prisma consulta colunas/tabelas que não existem.
2. Pipeline inutilizável na UI enquanto o list de deals estiver 500.
3. Customer 360 inutilizável (mesma causa).
4. Sem tela operacional de apólice, renovação não fecha o ciclo.
5. WhatsApp sem inbox; Evolution não homologado neste ambiente.
6. Ownership `off` → vazamento de carteira para comercial/parceiro.
7. Sem dados reais de follow-up, renovação, reativação e comunicação.

---

## Método e evidências

| Camada | Como foi validado |
|--------|-------------------|
| Banco | `psql` no container `insureflow-postgres`; `_prisma_migrations`; contagens |
| API | Login JWT das 7 personas; GET autenticado dos módulos |
| BFF | Rotas `apps/web/app/api/**` + React Query nos hooks |
| Front | Browser em `http://localhost:3000` com sessão admin |
| ACL | Comparação de totais `admin` / `sales` / `imoveis` / `gerencia` / `comercial` / `parceiro` |

Última migration **aplicada:** `20260820240000_sales_pipeline_inteligente`.  
Migration **presente no repo e ausente no banco:** `20260820250000_sales_targets_commissions`.  
Coluna `deals.product_type`: **não existe**. Tabelas `sales_targets`, `sales_commissions`, `commission_rules`: **não existem**.

Personas com login **200** na API: `admin`, `sales`, `imoveis`, `gerencia`, `comercial`, `parceiro`, `viewer`.

Esta auditoria **não clicou** criar/editar/excluir em formulários (evitar poluir a base). CRUD de leads/clientes é inferido por UI + dados já persistidos (ex.: lead “Lead E2E 1158 Editado”, 18 leads `converted`, 8 clientes).

---

## Fase 1 — Inventário funcional

| Módulo | Status | Percentual | Observação |
|--------|--------|------------|------------|
| 1. CRM | PARCIAL | 50% | Visão geral, nav e deals no banco (33). List/Kanban quebrados (API 500). |
| 2. Leads | FUNCIONANDO | 82% | Tela lista 35; filtros e paginação visíveis; converter/editar na grid. Hydration error no dropdown. |
| 3. Clientes | FUNCIONANDO | 78% | `/clientes` lista 8; Novo/Editar/Excluir; filtros. 360 quebra ao abrir ficha profunda. |
| 4. Customer 360 | IMPLEMENTADO MAS NÃO HOMOLOGADO | 28% | Rota existe; GET detalhe do cliente 200; GET `/360` 500 (`salesCommission` sem tabela). |
| 5. Pipeline | IMPLEMENTADO MAS NÃO HOMOLOGADO | 32% | `/crm/negocios` abre; métricas 0; 33 deals no DB; list 500. |
| 6. Follow-ups | PARCIAL | 42% | Fila `/crm/follow-ups` abre; API total=0. Sem evidência de criação ponta a ponta. |
| 7. Reativação | PARCIAL | 38% | Settings/metrics 200; tela `/automacao/reativacao` existe. 0 leads `lost`; 0 comunicações. |
| 8. Renovações | PARCIAL | 35% | `/crm/renovacoes` abre; API total=0. 2 apólices no banco. `/apolices` é placeholder. |
| 9. Cross-sell | PARCIAL | 28% | API `/cross-sell/opportunities` 200 total=0; `/opportunities` 0. Sem operação. |
| 10. Dashboard Comercial | PARCIAL | 68% | API `/commercial/dashboard` 200; tela `/crm/dashboard-comercial` existe. Filas vazias. |
| 11. Dashboard Executivo | IMPLEMENTADO MAS NÃO HOMOLOGADO | 30% | Tela `/crm/dashboard-executivo`; API 500 (schema). |
| 12. Dashboard SLA | FUNCIONANDO | 72% | API 200 (`inSla=6`, `overdue=24`); tela `/crm/dashboard-sla` abre. Números na UI não confirmados no 1º snapshot (React Query ainda carregando). |
| 13. Business Units | FUNCIONANDO | 78% | 2 BUs no banco e no seletor da UI. Isolamento sales/imoveis comprovado. Sem tela rica de gestão além de `/configuracoes/unidades`. |
| 14. ACL | PARCIAL | 55% | Permissões (`parceiro` 403) e BU (`sales`≠`imoveis`) funcionam. Ownership não filtra leads. |
| 15. Ownership | PARCIAL | 35% | Modelo/seed existem. Default `OWNERSHIP_ENFORCEMENT=off`. `comercial` e `parceiro` viram 35 leads. |
| 16. Questionários | FUNCIONANDO | 75% | Builder abre; 9 templates / 21 submissões. CRUD completo do builder não clicado nesta sessão. |
| 17. Comunicações | PARCIAL | 32% | API lista 200 total=0; provider `INTERNAL`. Sem inbox. |
| 18. Evolution API | PARCIAL | 28% | Código/migration no repo. Runtime: provider `INTERNAL`. `/whatsapp` placeholder. |
| 19. Metas | IMPLEMENTADO MAS NÃO HOMOLOGADO | 22% | Código + tela `/crm/performance`. Tabelas não migradas → 500. |
| 20. Comissões | IMPLEMENTADO MAS NÃO HOMOLOGADO | 22% | Idem metas. Deal WON no código não pode persistir comissão neste banco. |
| 21. Quotes | PARCIAL | 55% | `/cotacoes` abre; API 1 comparativo, 0 linhas de cotação, 0 propostas. Sem list GET `/quotes/comparisons` (list é `GET /quotes`). |
| 22. Activities | FUNCIONANDO | 70% | API 53; agenda/atividades existem. Não homologado criar atividade nesta sessão. |
| 23. Usuários | PARCIAL | 35% | 7 users no banco; `GET /users` 200. Sem tela/BFF de CRUD de usuários. |
| 24. Perfis | PARCIAL | 40% | Roles no seed (`admin`, `gerencia`, `comercial`, `parceiro`…). Painel RBAC em configurações é leitura. Sem CRUD de papéis na UI. |
| 25. Configurações | PARCIAL | 58% | `/configuracoes` abre (RBAC, unidades, comunicação, motivos de perda). Sem gestão de usuários. |

**Média: 48%.**

---

## Fase 2 — Validação de telas

Legenda: **Homologado** = evidência de runtime nesta auditoria. **Não clicado** = botão existe, não executamos mutação.

### `/login`

- Existe: sim
- Abre: sim
- Contas demo: Admin, Gerência, Comercial, Parceiro
- ACL: n/a

### `/leads`

- Tela abre: sim (admin)
- Lista dados: sim — **35** leads, 18 convertidos, 1 qualificado
- Criar: botão “Novo lead” visível — **não clicado**
- Editar: botão “Editar lead” visível — **não clicado** (há registros já editados no banco)
- Excluir: botão visível em várias linhas — **não clicado**
- Filtros: status, origem, empresa, interesse — UI presente
- Paginação: Anterior (disabled) / Próxima — presente
- ACL: não validado no browser por persona; na API, BU isola `sales`/`imoveis`
- React Query: lista hidrata de 0 → 35 após o fetch
- Falha: hydration error em `DropdownMenuTrigger`

### `/clientes`

- Tela abre: sim
- Lista dados: sim — **8** clientes (1 PJ, 5 com e-mail)
- CRUD: Novo / Editar / Excluir visíveis — mutações **não clicadas**
- Filtros: tipo e status presentes
- Paginação: presente (Próxima disabled — cabe em uma página)
- ACL: `parceiro` 403 na API
- Falha: hydration error no sidebar

### `/crm/negocios` (pipeline)

- Tela abre: sim
- Lista dados: **não** — UI “0 registros no banco” com **33 deals** no PostgreSQL
- CRUD: “Novo negócio” visível; list 500 impede edição/kanban
- Filtros: busca + Corretora/Imobiliária presentes
- Paginação: Kanban/Lista presentes; dados não carregam
- ACL: `parceiro` 403 na API; demais personas também 500 no GET
- **Bloqueio:** contrato Prisma vs schema do banco

### `/crm/customer-360/:id`

- Existe: sim
- Abre: rota carrega
- Possui dados: **não** — erro de escopo/indisponível
- API GET cliente: 200; GET 360: 500
- CRUD / filtros / paginação: n/a
- ACL: não homologável enquanto 500

### `/crm/dashboard-sla`

- Existe / abre: sim
- Dados: API 200; UI no 1º snapshot ainda em “—”
- CRUD: n/a

### `/crm/dashboard-executivo`

- Existe: sim
- Dados: API **500**

### `/crm/performance`

- Existe / abre: sim
- Dados: “—” (API 500)
- CRUD de metas: **não** na UI (só visualização)

### `/crm/follow-ups`

- Existe / abre: sim
- Dados: 0 pendentes / 0 atrasados / 0 concluídos
- CRUD: não evidenciado
- Filtros: Hoje / Atrasados / 7 dias / unidade

### `/crm/renovacoes`

- Existe / abre: sim
- Dados: carregando → API total=0
- Filtros de status presentes
- CRUD: não

### `/crm/agenda`

- Existe: sim (componente de agenda ligado a activities)
- **Não aberta nesta sessão de browser**
- Dados: 53 activities na API; 0 follow-ups

### `/crm/dashboard-comercial` e `/crm/recuperacao`

- Rotas de dashboard comercial / recuperação existem
- API comercial 200; filas vazias

### `/crm/dashboard-360`

- Existe (dashboard agregado, distinto do 360 por cliente)
- API `/customers/dashboard-360` 200 (conv=0)

### `/questionarios/templates`

- Existe / abre: sim — Builder
- Dados: API 9 templates (lista da sidebar ainda “selecione um template” no snapshot)
- CRUD: Novo / Importar / Publicar visíveis — **não clicados**
- Filtros: busca + status

### `/cotacoes`

- Existe / abre: sim
- Dados: API 1 comparativo, 0 quotes; UI pede seleção
- CRUD completo: não homologado

### `/propostas`

- Existe (página dedicada)
- API propostas total=0
- **Não aberta nesta sessão**

### `/apolices`

- Existe: catch-all placeholder
- Abre: sim
- Dados / CRUD / filtros / paginação: **não**
- API `GET /policies` 200 total=**2** — backend existe, **tela não**

### `/sinistros`

- Placeholder. Sem evidência de módulo operacional.

### `/whatsapp`

- Placeholder. Evolution não aparece na UI.

### `/automacao` e `/automacao/reativacao`

- Existem; settings/metrics 200
- Sem lead perdido para homologar o job

### `/configuracoes`

- Abre: sim
- Dados: tenant `insureflow`, painel RBAC
- Subrotas: unidades, comunicação, motivos de perda
- CRUD de usuários/perfis: **não**
- ACL: `settings:view`

### `/` (Dashboard comercial home)

- Existe; não foi o foco desta sessão. Depende de deals — risco de métricas 0/erro.

---

## Fase 3 — Validação operacional

### Fluxo Lead

```
Criar Lead → Editar → Criar Follow-up → Converter Cliente → Criar Deal → Mover Pipeline → Ganhar
```

**Resultado: FALHOU**

| Passo | Evidência | Status |
|-------|-----------|--------|
| Criar lead | 35 leads no banco; UI “Novo lead” | Provável (não clicado agora) |
| Editar | Registros com nomes de teste/edição | Provável |
| Follow-up | `lead_follow_ups` = **0** | Falhou |
| Converter cliente | Convert **cria Deal**, não Customer. Customer nasce no WON | Divergente do fluxo pedido |
| Criar deal | 18 leads `converted`; 33 deals | Histórico ok |
| Mover pipeline | `GET/PATCH` deals 500 | Falhou **agora** |
| Ganhar | 2 deals `won` no banco | Histórico ok; list quebrado |

O produto implementa **Lead → Deal (convert) → Customer (WON)**, não Lead → Cliente → Deal.

### Fluxo Renovação

```
Cliente → Apólice → Renovação → Lembrete → Deal de renovação
```

**Resultado: FALHOU**

- Clientes: 8 (tela ok).
- Apólices: 2 no banco; **tela `/apolices` placeholder**.
- `policy_renewals` = 0.
- Sem evidência de lembrete enviado (`communication_logs` = 0).
- Sem deal de renovação observável.

### Fluxo Reativação

```
Lead perdido → Agendamento → Job → Nova tentativa
```

**Resultado: FALHOU**

- Leads `lost` = **0**.
- Settings/metrics de reativação respondem 200.
- Job diário existe no código; **não há fila para processar**.
- 0 comunicações geradas.

### Fluxo Customer 360

```
Cliente → Timeline → Deals → Comunicações → Financeiro
```

**Resultado: FALHOU**

- Cliente avulso: GET 200.
- Workspace 360: **500** (query de comissões em tabela inexistente).
- Comunicações: 0.
- Financeiro 360: não abre.

---

## Fase 4 — Validação ACL

Personas pedidas vs o que existe no seed:

| Pedido | Conta real | Papel |
|--------|------------|--------|
| admin | `admin@insureflow.com` | `admin` |
| gerencia | `gerencia@insureflow.com` | `gerencia` |
| sales | `sales@insureflow.com` **e** `comercial@insureflow.com` | `sales` / `comercial` |
| imoveis | `imoveis@insureflow.com` | papel `sales` + membership Ávila Imóveis |
| parceiro | `parceiro@insureflow.com` | `parceiro` |

Não existe role slug `imoveis`. Isolamento é por **Business Unit**, não por papel.

### O que cada um consegue (API, evidência numérica)

| Persona | Leads | Clientes | Deals | SLA |
|---------|-------|----------|-------|-----|
| admin | 35 | 8 | 500 | 200 |
| gerencia | 35 | 8 | 500 | 200 |
| comercial | 35 | 8 | 500 | 200 |
| sales (Corretora) | **20** | **5** | 500 | 200 |
| imoveis | **15** | **3** | 500 | 200 |
| parceiro | **35** | **403** | **403** | **403** |

### Visualizar / editar / excluir (desenho + evidência)

**admin**  
- Visualiza tudo do tenant (leads 35, clientes 8, 2 BUs).  
- Editar/excluir: permissões `*:manage`. Mutações não clicadas.  
- Deals/360/performance: **impedidos por 500**, não por ACL.

**gerencia**  
- Visualiza leads/clientes no mesmo volume do admin (tem `business-units:view-all`).  
- CRM manage no seed.  
- Deals 500.

**sales (`sales@`, Corretora)**  
- Visualiza só carteira da Corretora (20/5) — **BU ACL ok**.  
- `crm:manage` no papel sales.  
- Não vê os 15 leads de Imóveis.

**imoveis (`imoveis@`)**  
- Visualiza só Imóveis (15/3) — **BU ACL ok**.  
- Mesmo papel `sales`; não é um perfil “imobiliária” distinto.

**parceiro**  
- Deveria ver só leads **compartilhados**.  
- Na prática, com ownership off, vê **35 leads** (falha grave).  
- Não visualiza clientes/deals/SLA (403) — RBAC de permissão **ok**.  
- Sem `*:manage` → não edita/exclui clientes/deals.

### Falhas ACL encontradas

1. **Ownership default `off`:** `comercial` (scope `own`) e `parceiro` (scope `shared`) listam **todos** os leads.
2. **Parceiro + share:** existe `LeadShare` e lead “Lead demo compartilhado”, mas o filtro `shared` não está efetivo neste runtime.
3. **Deals 500** mascara o teste de isolamento de negócios (não dá para afirmar ACL de deal além do 403 do parceiro).
4. **404 vs 403 em detalhe fora da BU:** padrão conhecido do produto (não retestado no 360 porque o 360 já 500).
5. Hydration errors no shell não são ACL, mas poluem a UX de todos os perfis.

---

## Fase 5 — A Ávila Corretora conseguiria operar hoje?

| Capacidade | Classificação | Motivo |
|------------|---------------|--------|
| Carteira de clientes | PARCIAL | Cadastro e lista funcionam (8 registros). Sem 360, sem apólices na UI, sem financeiro. |
| Carteira de renovação | NÃO | 0 renewals; tela de apólice placeholder; sem lembretes. |
| Pipeline | NÃO | 33 deals no banco, Kanban 0, API 500. |
| Follow-ups | PARCIAL | Tela e API existem; fila vazia; criação no fluxo lead não evidenciada. |
| Agenda comercial | PARCIAL | Agenda/activities no produto; 53 atividades; 0 follow-ups; não aberta no browser nesta sessão. |
| Reativação | NÃO | Zero leads perdidos; zero disparos; WhatsApp não operacional. |
| Cross-sell | NÃO | Zero oportunidades. |
| Customer 360 | NÃO | Tela e API `/360` quebradas neste ambiente. |

**Veredito:** a corretora **não** consegue operar o dia a dia comercial completo no InsureFlow hoje. Consegue, no máximo, **cadastrar e listar leads/clientes e preencher questionários**, sem pipeline utilizável e sem pós-venda.

---

## Fase 6 — Gaps

### CRÍTICO

1. Aplicar (ou reverter) a migration `20260820250000_sales_targets_commissions` para o banco e o Prisma Client ficarem alinhados. Sem isso, pipeline, 360, executivo, metas e comissões ficam 500.
2. Restaurar `GET /crm/deals` (e detalhe por id) até o Kanban listar os 33 negócios existentes.
3. Restaurar `GET /customers/:id/360`.
4. Ligar **ownership enforcement** (`strict` ou `shadow` → `strict`) antes de qualquer usuário não-admin em produção. Parceiro não pode ver 35 leads.
5. Tela operacional de **apólices** (hoje placeholder com 2 apólices no banco).
6. Fechar o ciclo **renovação**: popular `policy_renewals`, lembrete, deal de renovação.

### ALTO

7. Inbox WhatsApp real (hoje `/whatsapp` placeholder) e ativar Evolution neste ambiente (`communications/provider` = `INTERNAL`).
8. Follow-ups de verdade no fluxo do lead (hoje 0 registros).
9. Homologar converter lead → mover estágio → WON **depois** do fix de schema.
10. Tela de usuários (convite, papel, BU, desativar). API `GET /users` existe; BFF/UI não.
11. Isolar `parceiro` de verdade (`dataScope=shared` + `LeadShare`).
12. Customer 360: timeline + deals + comunicações + financeiro **depois** do 500.

### MÉDIO

13. Dashboard executivo e `/crm/performance` só após migration.
14. Reativação: homologar com lead `lost` + job 07:00 + mensagem.
15. Cross-sell: gerar oportunidades e UI de trabalho.
16. Quotes: completar comparativo com linhas e proposta (hoje 1 comparison vazia).
17. Hydration errors (`app-sidebar`, `dropdown-menu`) em várias telas.
18. Agenda: confirmar React Query + filtros no browser.
19. CRUD de papéis na UI (hoje só seed + painel de leitura).

### BAIXO

20. Instagram: **não implementado** (nenhuma ocorrência no repo).
21. Sinistros: placeholder.
22. UI Kit `/ui-kit` (dev, não operacional).
23. Listagem `GET /quotes/comparisons` (404) — o list correto é `GET /quotes`.
24. Distinguir persona “sales” vs “comercial” na documentação de treino da corretora.

---

## Fase 7 — Roadmap (Ávila Corretora 100% no InsureFlow)

Sem integração com seguradoras. Ordem: CRM → Pipeline → Renovação → Customer 360 → WhatsApp → Instagram.

### Sprint 0 — Destravar o que já existe (3–5 dias)

- Aplicar migration de metas/comissões **ou** retirar as queries até a migration estar no ambiente.
- Smoke: `GET /crm/deals` 200 com 33 itens; Kanban mostra cards.
- Smoke: Customer 360 abre para um cliente real.
- Ligar ownership `shadow` e medir divergências; depois `strict`.
- Checklist ACL: admin / gerencia / sales Corretora / imoveis / parceiro.

### Sprint 1 — CRM + Pipeline utilizável

- Homologar ponta a ponta: criar lead → editar → follow-up → converter → mover estágio → WON.
- Fila `/crm/follow-ups` com dados reais da Corretora.
- Agenda comercial ligada a follow-ups e activities.
- Corrigir hydration do shell.

### Sprint 2 — Renovação

- Tela `/apolices` de verdade (lista, detalhe, vínculo com cliente).
- Job/lembretes de renovação visíveis na fila.
- Deal `sourceType=RENEWAL` criado a partir da apólice.
- Carteira de renovação da Corretora Ávila como tela diária.

### Sprint 3 — Customer 360 operacional

- Timeline, negócios, comunicações, financeiro (comissões) estáveis.
- Health / lifecycle / pendências de SLA na ficha.
- Entrada a partir de `/clientes` e `/crm/clientes`.

### Sprint 4 — WhatsApp

- Trocar `/whatsapp` placeholder por inbox (threads Evolution).
- Provider Evolution homologado em HML (não `INTERNAL`).
- Disparo de follow-up / reativação / renovação no canal que o corretor já usa.
- Registrar tudo em `communication_logs` e na timeline do 360.

### Sprint 5 — Instagram (depois do WhatsApp)

- Definir canal (Direct / comentários / anúncios) — **hoje zero código**.
- Entrada de lead a partir do Instagram, com `source` e owner da Corretora.
- Mesma timeline do 360; sem segundo CRM paralelo.

### Sprint 6 — Operação plena

- Reativação com leads perdidos reais.
- Cross-sell da carteira Ávila.
- Metas/comissões com migration aplicada e regras da Corretora.
- Gestão de usuários/perfis na UI.
- Treino das 5 personas e go-live só da Corretora (Imóveis pode continuar isolada).

---

## Próximas sprints recomendadas (resumo)

| Sprint | Objetivo | Critério de pronto |
|--------|----------|-------------------|
| 0 | Schema + deals + 360 + ownership | Kanban lista deals; 360 abre; parceiro não vê carteira toda |
| 1 | Fluxo lead→WON + follow-up + agenda | Fluxo Fase 3 Lead = PASSOU |
| 2 | Apólices + renovação | Fluxo Renovação = PASSOU |
| 3 | Customer 360 completo | Fluxo 360 = PASSOU |
| 4 | WhatsApp / Evolution | Inbox + pelo menos um disparo real registrado |
| 5 | Instagram | Lead entra no CRM a partir do Instagram |
| 6 | Reativação, cross-sell, metas, usuários | Ávila opera o dia a dia sem planilha paralela |

---

## Apêndice — Contagens do banco (runtime)

| Entidade | Qtd |
|----------|-----|
| leads | 35 (new 15, contacted 1, qualified 1, converted 18, lost 0) |
| customers | 8 |
| deals | 33 (open 30, won 2, lost 0) |
| activities | 53 |
| policies | 2 |
| policy_renewals | 0 |
| lead_follow_ups | 0 |
| communication_logs | 0 |
| cross_sell / opportunities | 0 |
| quote_comparisons | 1 |
| quotes (linhas) | 0 |
| proposals | 0 |
| questionnaire_templates | 9 |
| questionnaire_submissions | 21 |
| business_units | 2 |
| users | 7 |

---

*Auditoria funcional. Nenhuma feature nova foi desenvolvida. Relatório gerado a partir de evidência de runtime em 20/08/2026.*

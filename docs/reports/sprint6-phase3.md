# Sprint 6.3 — Commercial Intelligence

**Data:** 2026-07-09  
**Escopo:** Jornada comercial guiada no Deal Workspace — frontend + módulo de domínio puro, sem alteração de contratos REST, RBAC, multi-tenant, Activity Engine ou Design System.

---

## Resumo

O Deal Workspace passou a exibir um **painel lateral Commercial Journey** com jornada visual, checklist comercial, score parametrizado e recomendações rule-based. Toda a lógica está centralizada em `CommercialJourneyService`; o frontend apenas agrega dados via React Query e renderiza componentes do Design System existente.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│ DealSheetV2                                                      │
│  ├─ EntitySheetShell.Body (seção ativa)                         │
│  └─ CommercialIntelligencePanel (aside lateral xl+)             │
│       ├─ CommercialJourney                                       │
│       ├─ CommercialScoreCard                                     │
│       ├─ CommercialChecklist                                     │
│       └─ CommercialRecommendations                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ useCommercialIntelligence(deal)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ React Query (cache compartilhado — sem fetch duplicado)          │
│  useLeadContext · useQuestionnaireSubmission · useQuestionnaireFields │
│  useDealQuoteComparisons · useDealProposals                      │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ CommercialJourneyService.evaluate(input)                         │
│  → journey · checklist · score · recommendations · timeline map  │
└─────────────────────────────────────────────────────────────────┘
```

### Princípios

| Restrição | Como foi respeitada |
|---|---|
| Sem contratos API novos | Cálculo 100% client-side a partir de endpoints existentes |
| Sem alterar RBAC | Painel read-only; mesmas permissões do deal sheet |
| Sem alterar Activity Engine | Eventos correlacionados mapeados para kinds existentes |
| Sem alterar Design System | `SectionPanel`, `StatusPill`, tokens CRM |
| Performance | `useMemo` no hook; queries com mesmas keys do hub de cotações |

---

## Serviços

| Serviço | Caminho | Responsabilidade |
|---|---|---|
| `CommercialJourneyService` | `apps/web/lib/crm/commercial-journey/commercial-journey.service.ts` | Orquestra jornada, checklist, score e recomendações |
| `field-resolvers` | `apps/web/lib/crm/commercial-journey/field-resolvers.ts` | Resolução de respostas do questionário por key/label |
| `useCommercialIntelligence` | `apps/web/lib/data-access/modules/commercial-intelligence/hooks.ts` | Agregação React Query + memoização |

---

## Componentes

| Componente | Caminho |
|---|---|
| `CommercialIntelligencePanel` | `apps/web/components/crm/commercial-intelligence/commercial-intelligence-panel.tsx` |
| `CommercialJourney` | `apps/web/components/crm/commercial-intelligence/commercial-journey.tsx` |
| `CommercialScoreCard` | `apps/web/components/crm/commercial-intelligence/commercial-score-card.tsx` |
| `CommercialChecklist` | `apps/web/components/crm/commercial-intelligence/commercial-checklist.tsx` |
| `CommercialRecommendations` | `apps/web/components/crm/commercial-intelligence/commercial-recommendations.tsx` |

Integração: `apps/web/components/crm/deal-sheet-v2.tsx` — layout two-column com aside sticky em `xl+`.

---

## Regras da jornada

| Etapa | Concluída quando | Em andamento | Bloqueada |
|---|---|---|---|
| Lead | Lead convertido vinculado | — | Sem lead |
| Qualificação | Lead qualified/converted ou stage ≠ novo | Lead ok, não qualificado | Sem lead |
| Questionário | Status submitted/reviewed | Draft ou parcial | Sem qualificação |
| Cliente | `customerId` ou status won | Proposta sem cliente | Questionário incompleto |
| Cotações | Comparativo com ≥1 linha | Questionário ok, sem cotação | Questionário incompleto |
| Comparativo | ≥2 linhas no comparativo | 1 linha | Sem comparativo |
| Proposta | ≥1 proposta | Cotação selecionada, sem proposta | Sem seleção |
| Apólice | `hasPolicies` (pendente API) | Proposta ok, sem apólice | Sem proposta |
| Pós-venda | Apólice + deal won | Apólice sem pós-venda | Sem apólice |
| Renovação | `hasRenewals` (pendente API) | Pós-venda sem renovação | Sem pós-venda |

Status possíveis: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`.

---

## Checklist comercial

| Item | Fonte de dados | Obrigatório |
|---|---|---|
| CPF | Lead.document ou resposta questionário | Sim |
| Nome | Lead.name / deal.contact | Sim |
| Telefone | Lead.phone / commercialContext.phone | Sim (válido) |
| Email | Lead.email / deal.email | Não |
| CEP | Resposta questionário (8 dígitos) | Sim |
| Veículo | Resposta questionário | Sim se produto Auto |
| Condutor Principal | Resposta ou CPF+nome | Sim se produto Auto |
| Produto | deal.product | Sim |
| Questionário Respondido | commercialContext.questionnaire.status | Sim |
| Cliente Criado | deal.customerId / status won | Não |
| Possui Cotação | quoteComparisons / commercialContext.quote | Não |
| Cotação Selecionada | selectedQuoteId / hasSelectedQuote | Não |
| Proposta Emitida | useDealProposals | Não |

Exibe: percentual geral, obrigatórios concluídos, lista de pendências.

---

## Regras de score (0–100)

| Critério | Peso |
|---|---|
| Cadastro completo (nome + CPF) | 8 |
| Telefone válido | 8 |
| Email informado | 7 |
| CPF válido | 10 |
| Questionário completo | 15 |
| CEP válido | 7 |
| Veículo identificado | 8 |
| Condutor principal | 5 |
| Produto informado | 5 |
| Cliente convertido | 10 |
| Cotação criada | 10 |
| Cotação selecionada | 9 |
| Proposta emitida | 8 |

**Classificação:**

| Faixa | Tier |
|---|---|
| 85–100 | Excelente |
| 70–84 | Bom |
| 50–69 | Regular |
| 0–49 | Baixo |

---

## Recomendações (rule-based, sem IA)

| Regra | Mensagem exemplo |
|---|---|
| CPF pendente | Informe o CPF do segurado… |
| Bônus ausente (Auto) | Falta informar bônus. |
| Sem 2º condutor (Auto) | Adicionar segundo condutor pode melhorar… |
| Questionário incompleto | Questionário incompleto. |
| Cotação selecionada sem proposta | Cliente ainda não possui proposta. |
| Comparativo não enviado | Cotação não enviada. |
| Telefone inválido | Cadastre um telefone válido… |
| CEP ausente | Informe o CEP no questionário… |
| Linha única | Adicione ao menos mais uma seguradora… |

---

## Eventos / Timeline (Fase 5)

**Sem alteração no Activity Engine.** O painel expõe `correlatedTimelineKinds` — mapeamento read-only entre etapas da jornada e eventos **já publicados** pelo engine:

| Etapa ativa/concluída | Kinds correlacionados |
|---|---|
| Lead / Qualificação | `lead_converted` |
| Questionário | `questionnaire_submitted`, `questionnaire_reviewed` |
| Cotações / Comparativo | `quote_created`, `quote_updated`, `quote_sent` |
| Proposta | `proposal_created`, `proposal_sent` |
| Apólice | `policy_issued` |
| Renovação | `renewal_started` |

Mudanças em cotações, questionários e propostas continuam invalidando `activities` via hooks existentes (Sprint 6.2), atualizando a Timeline automaticamente.

**Pendente Sprint 7:** kinds dedicados (`commercial_score_updated`, `journey_stage_changed`, `checklist_completed`, `recommendation_generated`) exigem extensão do catálogo + publish server-side.

---

## Arquivos alterados / criados

```
apps/web/lib/crm/commercial-journey/
  types.ts
  field-resolvers.ts
  commercial-journey.service.ts
  commercial-journey.service.spec.ts
  index.ts

apps/web/lib/data-access/modules/commercial-intelligence/
  hooks.ts
  index.ts

apps/web/components/crm/commercial-intelligence/
  commercial-journey.tsx
  commercial-score-card.tsx
  commercial-checklist.tsx
  commercial-recommendations.tsx
  commercial-intelligence-panel.tsx
  index.ts

apps/web/components/crm/deal-sheet-v2.tsx

docs/reports/sprint6-phase3.md
```

---

## Validação

| Check | Resultado |
|---|---|
| lint | ✅ Passou |
| typecheck | ✅ Passou |
| testes API (jest) | ⚠️ 56/58 — 2 falhas legadas pré-existentes |
| build | ✅ Passou |
| testes vitest (web spec) | Spec em `commercial-journey.service.spec.ts`; runner vitest não configurado no workspace web |

---

## Pendências — Sprint 7

1. **Endpoint ou enrichment** `commercialIntelligence` em `GET /crm/deals/:id` (opcional, se cálculo server-side for desejado).
2. **Novos event kinds** no Activity Engine + publish ao cruzar marcos da jornada.
3. **Integração apólices/renovações** — alimentar `hasPolicies` / `hasRenewals` via módulo Policies.
4. **Questionário inteligente** — validação dinâmica por template, campos condicionais e sugestões contextuais.
5. **Persistência de score histórico** — tendência e alertas de regressão.
6. **Lead Workspace** — reutilizar painel em `LeadSheetV2`.
7. **Ações rápidas** nas recomendações (deep-link para aba/questionário/cotação).

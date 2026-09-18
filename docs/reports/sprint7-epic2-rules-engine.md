# Sprint 7.2 — EPIC 2: Rules Engine + Conditional Engine Foundation

**Data:** 2026-07-09  
**Status:** Concluído  
**Escopo:** núcleo genérico de regras condicionais compartilhado entre frontend, backend e preview.

---

## 1. Resumo

Implementado o **Rules Engine** em `@repo/forms-engine` com registry extensível, modelo JSON persistido em `template.settings.rules`, **Conditional Engine** como consumidor, editor visual no builder, **Rule Tester** e integração com Validation Engine + QuestionnairesService.

Nenhuma regra de negócio de seguros foi codificada — apenas infraestrutura configurável.

---

## 2. Arquitetura

```
template.settings.rules[]  +  answers
            │
            ▼
      RuleEngine.evaluate()
            │
     ┌──────┴──────┐
     ▼             ▼
ConditionEvaluator  ActionExecutor
     │             │
     └──────┬──────┘
            ▼
   RuleEngineResult (visible/required/disabled/sections)
            │
     ┌──────┴──────────────────┐
     ▼                         ▼
ConditionalEngine        ValidationEngine
 (fieldStates)           (visibleFieldKeys, requiredFieldKeys…)
```

**Pacote:** `packages/forms-engine/src/rules/`

| Arquivo | Papel |
|---------|-------|
| `rule-engine.ts` | Orquestração — evaluate*, testRule |
| `rule-registry.ts` | Registry de operadores e ações |
| `condition-evaluator.ts` | Avalia condições e grupos AND/OR |
| `action-executor.ts` | Executa ações sobre estado derivado |
| `rule-context.ts` | Contexto (template, answers, user, tenant…) |
| `rule-evaluator.ts` | Avalia regra individual |
| `conditional-engine.ts` | API de consumo — estados por campo/seção |
| `operators/`, `actions/`, `types/`, `utils/` | Operadores nativos, ações, tipos, helpers |

---

## 3. Modelo de regra (JSON)

```json
{
  "id": "rule_abc",
  "name": "Exemplo",
  "enabled": true,
  "conditionLogic": "and",
  "conditions": [
    { "fieldKey": "campo", "operator": "equals", "value": "x" },
    {
      "logic": "or",
      "conditions": [
        { "fieldKey": "a", "operator": "equals", "value": "1" },
        { "fieldKey": "b", "operator": "isFilled" }
      ]
    }
  ],
  "actions": [
    { "type": "showField", "targetFieldKey": "destino" }
  ]
}
```

---

## 4. Operadores nativos

`equals`, `notEquals`, `greaterThan`, `greaterOrEqual`, `lessThan`, `lessOrEqual`, `contains`, `startsWith`, `endsWith`, `between`, `in`, `notIn`, `isEmpty`, `isFilled`, `exists`, `notExists`.

Extensível via `RuleRegistry.registerOperator()`.

---

## 5. Ações nativas

`showField`, `hideField`, `requireField`, `optionalField`, `enableField`, `disableField`, `setValue`, `clearValue`, `showSection`, `hideSection`, `jumpToSection`.

Extensível via `RuleRegistry.registerAction()`.

---

## 6. Registry Pattern

Evita switches monolíticos — operadores e ações registrados em mapas tipados. Validators (EPIC 1) e Rules (EPIC 2) seguem o mesmo padrão.

---

## 7. Conditional Engine

`ConditionalEngine.evaluate()` delega ao `RuleEngine` e expõe:

- `fieldStates[key].visible | required | disabled | value?`
- `sectionStates[section].visible`

Usado pelo preview e disponível para runtime de submissão.

---

## 8. Integrações

| Camada | Arquivo | Comportamento |
|--------|---------|---------------|
| Backend | `questionnaires.service.ts` | RuleEngine antes de ValidationEngine |
| Frontend validation | `questionnaire-field-validation.ts` | Mesmo fluxo client-side |
| Preview | `form-preview.tsx` | Filtra campos/seções; required/disabled em tempo real |
| Builder | `rules-editor-panel.tsx` | Editor visual When→Then |
| Rule Tester | `rule-tester-dialog.tsx` | TRUE/FALSE + ações + entidades afetadas |

---

## 9. Editor visual

Fluxo implementado:

**Quando** → Campo → Operador → Valor → **Então** → Ação → Destino

- Múltiplas condições com lógica AND/OR no nível raiz
- Grupos AND/OR aninhados
- Toggle motor v1/v2 (`settings.engineVersion`)
- Autosave debounced em `template.settings`

---

## 10. Rule Tester

Botão **Testar regra** no editor:

- Inputs para campos referenciados
- Resultado **TRUE** / **FALSE**
- Lista de ações executadas
- Campos e seções afetados

---

## 11. Compatibilidade

| engineVersion | Comportamento |
|---------------|---------------|
| `1` (default) | Regras ignoradas; comportamento legado |
| `2` | RuleEngine executado; validação respeita visibilidade/obrigatoriedade dinâmica |

APIs públicas, RBAC, multi-tenant, Activity Engine, templates v1 e submissões existentes **inalterados**.

---

## 12. Cobertura de testes

**Arquivo:** `packages/forms-engine/src/rules/rule-engine.spec.ts`

| Área | Cenários |
|------|----------|
| Operadores | comparação, strings, in/notIn, empty/filled, between |
| RuleRegistry | operadores/ações nativos + registro customizado |
| RuleEngine | PF/PJ, segundo condutor, blindado, hide section, disable |
| Grupos | AND/OR aninhados |
| testRule | TRUE/FALSE + entidades afetadas |
| ConditionalEngine | fieldStates / sectionStates |
| Compatibilidade | engineVersion 1 ignora regras |

---

## 13. Performance

- Avaliação in-memory O(rules × conditions)
- Sem I/O no hot path
- Estado derivado recalculado a cada mudança de resposta (preview) — adequado para formulários com dezenas de campos
- Pendente EPIC 3+: indexação de regras por `fieldKey` para forms muito grandes

---

## 14. Validação executada

| Check | Resultado |
|-------|-----------|
| `packages/forms-engine` tests | ✅ 32/32 |
| lint / typecheck | ✅ |
| build (web + api) | ✅ |

---

## 15. Pendências para EPIC 3

- [ ] Scoring Engine consumindo RuleEngine/ConditionalEngine
- [ ] Recommendation Engine
- [ ] Indexação de regras por fieldKey
- [ ] Simulador dedicado (além do Rule Tester)
- [ ] Persistência de regras em tabela dedicada (opcional; hoje `settings.rules`)
- [ ] `jumpToSection` no preview paginado

---

## 16. Critérios de sucesso

| Critério | Status |
|----------|--------|
| Um único Rule Engine | ✅ |
| Frontend e backend compartilham o motor | ✅ |
| Preview usa o mesmo mecanismo | ✅ |
| Builder visual de regras | ✅ |
| Conditional Engine sem lógica duplicada | ✅ |
| Pronto para Scoring/Recommendation | ✅ |
| Infra genérica (sem regras de seguro hardcoded) | ✅ |

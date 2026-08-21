import type { QuestionnaireField, QuestionnaireTemplate } from "@/lib/data-access/modules/questionnaires"
import {
  ConditionalEngine,
  RuleEngine,
  fieldsToDescriptors,
  type ConditionalEngineResult,
  type FormRuleDefinition,
} from "@repo/forms-engine"

const ruleEngine = new RuleEngine()
const conditionalEngine = new ConditionalEngine()

export function buildTemplateDescriptor(
  template: Pick<QuestionnaireTemplate, "name" | "settings">,
  fields: QuestionnaireField[],
) {
  return {
    name: template.name,
    settings: (template.settings ?? {}) as Record<string, unknown>,
    fields: fieldsToDescriptors(fields),
  }
}

export function evaluateQuestionnaireRules(
  template: Pick<QuestionnaireTemplate, "name" | "settings">,
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
  rules?: FormRuleDefinition[],
): ConditionalEngineResult {
  return conditionalEngine.evaluate({
    template: buildTemplateDescriptor(template, fields),
    answers,
    rules,
  })
}

export function testQuestionnaireRule(
  rule: FormRuleDefinition,
  template: Pick<QuestionnaireTemplate, "name" | "settings">,
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
) {
  return ruleEngine.testRule(rule, {
    template: buildTemplateDescriptor(template, fields),
    answers,
  })
}

export function applyRulesToAnswers(
  answers: Record<string, unknown>,
  result: ConditionalEngineResult,
): Record<string, unknown> {
  return ruleEngine.applyValueOverrides(answers, result)
}

export function isRulesEngineActive(
  settings?: Record<string, unknown> | null,
): boolean {
  return settings?.engineVersion === 2
}

export {
  ruleEngine,
  conditionalEngine,
  type ConditionalEngineResult,
  type FormRuleDefinition,
}

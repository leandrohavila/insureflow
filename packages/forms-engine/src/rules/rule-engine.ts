import type { FormFieldDescriptor, TemplateDescriptor } from "../validation/types/index"
import { getFieldSection } from "../validation/utils/field.util"
import type {
  FormRuleDefinition,
  RuleEngineResult,
  RuleEvaluationState,
  SingleRuleTestResult,
} from "./types/index"
import { buildRuleContext, type BuildRuleContextInput } from "./rule-context"
import { defaultRuleEvaluator, type RuleEvaluator } from "./rule-evaluator"
import {
  createBaselineEvaluationState,
  isFieldDisabledByRules,
  isFieldRequiredByRules,
  isFieldVisibleByRules,
  isSectionVisibleByRules,
  parseRulesFromSettings,
  resolveRulesProfile,
} from "./utils/rules.util"

export type RuleEngineEvaluateInput = BuildRuleContextInput & {
  rules?: FormRuleDefinition[]
}

export class RuleEngine {
  constructor(private readonly evaluator: RuleEvaluator = defaultRuleEvaluator) {}

  evaluate(input: RuleEngineEvaluateInput): RuleEngineResult {
    const profile = resolveRulesProfile(input.template.settings)
    const rules =
      input.rules ?? parseRulesFromSettings(input.template.settings ?? {})

    if (profile !== "v2") {
      return this.buildInactiveResult(input.template)
    }

    const context = buildRuleContext(input)
    const state = createBaselineEvaluationState(input.template)

    for (const rule of rules) {
      this.evaluator.evaluateRule(rule, state, context)
    }

    return this.toResult(state, true)
  }

  evaluateField(
    field: FormFieldDescriptor,
    input: RuleEngineEvaluateInput,
  ): RuleEngineResult {
    const section = getFieldSection(field)
    return this.evaluate({
      ...input,
      currentField: field,
      currentSection: section,
    })
  }

  evaluateSection(
    section: string,
    input: RuleEngineEvaluateInput,
  ): RuleEngineResult {
    return this.evaluate({
      ...input,
      currentSection: section,
    })
  }

  evaluateTemplate(input: RuleEngineEvaluateInput): RuleEngineResult {
    return this.evaluate(input)
  }

  evaluateSubmission(input: RuleEngineEvaluateInput): RuleEngineResult {
    return this.evaluate(input)
  }

  testRule(
    rule: FormRuleDefinition,
    input: RuleEngineEvaluateInput,
  ): SingleRuleTestResult {
    const profile = resolveRulesProfile(input.template.settings)
    if (profile !== "v2") {
      const inactive = this.buildInactiveResult(input.template)
      return {
        matched: false,
        executedActions: [],
        affectedFieldKeys: [],
        affectedSections: [],
        state: inactive,
      }
    }

    const context = buildRuleContext(input)
    const state = createBaselineEvaluationState(input.template)
    const matched = this.evaluator.evaluateRule(rule, state, context)
    const result = this.toResult(state, true)

    const affectedFieldKeys = new Set<string>()
    const affectedSections = new Set<string>()

    for (const executed of result.executedActions) {
      if (executed.action.targetFieldKey) {
        affectedFieldKeys.add(executed.action.targetFieldKey)
      }
      if (executed.action.targetSection) {
        affectedSections.add(executed.action.targetSection)
      }
    }

    return {
      matched,
      executedActions: result.executedActions,
      affectedFieldKeys: [...affectedFieldKeys],
      affectedSections: [...affectedSections],
      state: result,
    }
  }

  isFieldVisible(fieldKey: string, result: RuleEngineResult): boolean {
    return isFieldVisibleByRules(
      fieldKey,
      result.visibleFieldKeys,
      result.hiddenFieldKeys,
    )
  }

  isFieldRequired(
    field: FormFieldDescriptor,
    result: RuleEngineResult,
  ): boolean {
    return isFieldRequiredByRules(
      field,
      result.requiredFieldKeys,
      result.optionalFieldKeys,
    )
  }

  isFieldDisabled(fieldKey: string, result: RuleEngineResult): boolean {
    return isFieldDisabledByRules(
      fieldKey,
      result.disabledFieldKeys,
      result.enabledFieldKeys,
    )
  }

  isSectionVisible(section: string, result: RuleEngineResult): boolean {
    return isSectionVisibleByRules(
      section,
      result.visibleSections,
      result.hiddenSections,
    )
  }

  applyValueOverrides(
    answers: Record<string, unknown>,
    result: RuleEngineResult,
  ): Record<string, unknown> {
    if (!result.rulesActive) return answers

    const next = { ...answers }
    for (const [key, value] of Object.entries(result.valueOverrides)) {
      next[key] = value
    }
    for (const key of result.clearedFieldKeys) {
      delete next[key]
    }
    return next
  }

  private buildInactiveResult(template: TemplateDescriptor): RuleEngineResult {
    const baseline = createBaselineEvaluationState(template)
    return this.toResult(baseline, false)
  }

  private toResult(
    state: RuleEvaluationState,
    rulesActive: boolean,
  ): RuleEngineResult {
    return {
      rulesActive,
      matchedRuleIds: [...state.matchedRuleIds],
      visibleFieldKeys: new Set(state.visibleFieldKeys),
      hiddenFieldKeys: new Set(state.hiddenFieldKeys),
      requiredFieldKeys: new Set(state.requiredFieldKeys),
      optionalFieldKeys: new Set(state.optionalFieldKeys),
      disabledFieldKeys: new Set(state.disabledFieldKeys),
      enabledFieldKeys: new Set(state.enabledFieldKeys),
      visibleSections: new Set(state.visibleSections),
      hiddenSections: new Set(state.hiddenSections),
      valueOverrides: { ...state.valueOverrides },
      clearedFieldKeys: new Set(state.clearedFieldKeys),
      jumpToSection: state.jumpToSection,
      executedActions: [...state.executedActions],
    }
  }
}

export const defaultRuleEngine = new RuleEngine()

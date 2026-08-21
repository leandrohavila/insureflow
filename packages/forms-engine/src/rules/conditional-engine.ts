import type { FormFieldDescriptor, TemplateDescriptor } from "../validation/types/index"
import { getFieldSection } from "../validation/utils/field.util"
import type {
  ConditionalEngineResult,
  ConditionalFieldState,
  ConditionalSectionState,
  FormRuleDefinition,
  RuleEngineResult,
} from "./types/index"
import { defaultRuleEngine, type RuleEngine, type RuleEngineEvaluateInput } from "./rule-engine"
import {
  isFieldDisabledByRules,
  isFieldRequiredByRules,
  isFieldVisibleByRules,
  isSectionVisibleByRules,
} from "./utils/rules.util"

/**
 * Consumidor de alto nível do RuleEngine — expõe estado condicional
 * para campos e seções sem duplicar lógica de avaliação.
 */
export class ConditionalEngine {
  constructor(private readonly ruleEngine: RuleEngine = defaultRuleEngine) {}

  evaluate(input: RuleEngineEvaluateInput): ConditionalEngineResult {
    const result = this.ruleEngine.evaluate(input)
    return {
      ...result,
      fieldStates: this.buildFieldStates(input.template, result),
      sectionStates: this.buildSectionStates(input.template, result),
    }
  }

  evaluateWithRules(
    template: TemplateDescriptor,
    answers: Record<string, unknown>,
    rules: FormRuleDefinition[],
  ): ConditionalEngineResult {
    return this.evaluate({ template, answers, rules })
  }

  getFieldState(
    field: FormFieldDescriptor,
    result: RuleEngineResult,
  ): ConditionalFieldState {
    const visible = isFieldVisibleByRules(
      field.key,
      result.visibleFieldKeys,
      result.hiddenFieldKeys,
    )
    const required = isFieldRequiredByRules(
      field,
      result.requiredFieldKeys,
      result.optionalFieldKeys,
    )
    const disabled = isFieldDisabledByRules(
      field.key,
      result.disabledFieldKeys,
      result.enabledFieldKeys,
    )
    const value = result.valueOverrides[field.key]

    return {
      visible,
      required,
      disabled,
      ...(value !== undefined ? { value } : {}),
    }
  }

  getSectionState(
    section: string,
    result: RuleEngineResult,
  ): ConditionalSectionState {
    return {
      visible: isSectionVisibleByRules(
        section,
        result.visibleSections,
        result.hiddenSections,
      ),
    }
  }

  private buildFieldStates(
    template: TemplateDescriptor,
    result: RuleEngineResult,
  ): Record<string, ConditionalFieldState> {
    return Object.fromEntries(
      template.fields.map((field) => [field.key, this.getFieldState(field, result)]),
    )
  }

  private buildSectionStates(
    template: TemplateDescriptor,
    result: RuleEngineResult,
  ): Record<string, ConditionalSectionState> {
    const sections = new Set(
      template.fields.map((field) => getFieldSection(field)),
    )
    return Object.fromEntries(
      [...sections].map((section) => [section, this.getSectionState(section, result)]),
    )
  }
}

export const defaultConditionalEngine = new ConditionalEngine()

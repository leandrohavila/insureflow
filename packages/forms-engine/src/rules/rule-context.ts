import type { FormFieldDescriptor, TemplateDescriptor } from "../validation/types/index"
import { getFieldSection } from "../validation/utils/field.util"
import type {
  RuleContext,
  RuleSubmissionContext,
  RuleTenantContext,
  RuleUserContext,
} from "./types/index"
import {
  collectTemplateFieldKeys,
  collectTemplateSections,
} from "./utils/rules.util"

export type BuildRuleContextInput = {
  template: TemplateDescriptor
  answers: Record<string, unknown>
  submission?: RuleSubmissionContext
  currentField?: FormFieldDescriptor
  currentSection?: string
  currentUser?: RuleUserContext
  tenant?: RuleTenantContext
  metadata?: Record<string, unknown>
}

export function buildRuleContext(input: BuildRuleContextInput): RuleContext {
  const fieldKeys = collectTemplateFieldKeys(input.template)
  const sections = collectTemplateSections(input.template)

  return {
    template: input.template,
    submission: input.submission,
    answers: input.answers,
    visibleFieldKeys: new Set(fieldKeys),
    hiddenFieldKeys: new Set<string>(),
    currentField: input.currentField,
    currentSection: input.currentSection,
    currentUser: input.currentUser,
    tenant: input.tenant,
    metadata: input.metadata,
    // Expose section lists through metadata for consumers
    ...(sections.length > 0
      ? {}
      : {}),
  }
}

export function resolveFieldSection(
  field: FormFieldDescriptor,
): string {
  return getFieldSection(field)
}

export function resolveAnswerValue(
  answers: Record<string, unknown>,
  fieldKey: string,
): unknown {
  return answers[fieldKey]
}

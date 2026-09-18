import type { FormFieldDescriptor, TemplateDescriptor } from "../../validation/types/index"
import { getFieldSection } from "../../validation/utils/field.util"
import type {
  FormRuleDefinition,
  RuleConditionGroup,
  RuleConditionNode,
} from "../types/index"

export function resolveRulesProfile(
  settings?: Record<string, unknown> | null,
): "v1" | "v2" {
  const engineVersion = settings?.engineVersion
  return engineVersion === 2 ? "v2" : "v1"
}

export function isConditionGroup(node: RuleConditionNode): node is RuleConditionGroup {
  return (
    typeof node === "object" &&
    node !== null &&
    "logic" in node &&
    "conditions" in node &&
    Array.isArray((node as RuleConditionGroup).conditions)
  )
}

export function parseRulesFromSettings(
  settings?: Record<string, unknown> | null,
): FormRuleDefinition[] {
  if (!settings || !Array.isArray(settings.rules)) return []

  return settings.rules.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const record = item as Record<string, unknown>
    const id = typeof record.id === "string" ? record.id.trim() : ""
    const name = typeof record.name === "string" ? record.name.trim() : ""
    if (!id || !name) return []

    const conditions = Array.isArray(record.conditions)
      ? (record.conditions as RuleConditionNode[])
      : []
    const actions = Array.isArray(record.actions) ? record.actions : []

    return [
      {
        id,
        name,
        enabled: record.enabled !== false,
        conditionLogic:
          record.conditionLogic === "or" || record.conditionLogic === "and"
            ? record.conditionLogic
            : "and",
        conditions,
        actions: actions.filter(
          (action): action is FormRuleDefinition["actions"][number] =>
            Boolean(action && typeof action === "object" && "type" in action),
        ),
      },
    ]
  })
}

export function collectTemplateSections(
  template: TemplateDescriptor,
): string[] {
  const sections = new Set<string>()
  for (const field of template.fields) {
    sections.add(getFieldSection(field))
  }
  return [...sections]
}

export function collectTemplateFieldKeys(template: TemplateDescriptor): string[] {
  return template.fields.map((field) => field.key)
}

export function createBaselineEvaluationState(template: TemplateDescriptor) {
  const fieldKeys = collectTemplateFieldKeys(template)
  const sections = collectTemplateSections(template)

  return {
    visibleFieldKeys: new Set(fieldKeys),
    hiddenFieldKeys: new Set<string>(),
    requiredFieldKeys: new Set(
      template.fields.filter((field) => field.required).map((field) => field.key),
    ),
    optionalFieldKeys: new Set<string>(),
    disabledFieldKeys: new Set<string>(),
    enabledFieldKeys: new Set<string>(),
    visibleSections: new Set(sections),
    hiddenSections: new Set<string>(),
    valueOverrides: {} as Record<string, unknown>,
    clearedFieldKeys: new Set<string>(),
    executedActions: [] as import("../types/index").ExecutedAction[],
    matchedRuleIds: [] as string[],
  }
}

export function isFieldRequiredByRules(
  field: FormFieldDescriptor,
  requiredFieldKeys: ReadonlySet<string>,
  optionalFieldKeys: ReadonlySet<string>,
): boolean {
  if (optionalFieldKeys.has(field.key)) return false
  if (requiredFieldKeys.has(field.key)) return true
  return field.required
}

export function isFieldVisibleByRules(
  fieldKey: string,
  visibleFieldKeys: ReadonlySet<string>,
  hiddenFieldKeys: ReadonlySet<string>,
): boolean {
  if (hiddenFieldKeys.has(fieldKey)) return false
  return visibleFieldKeys.has(fieldKey)
}

export function isFieldDisabledByRules(
  fieldKey: string,
  disabledFieldKeys: ReadonlySet<string>,
  enabledFieldKeys: ReadonlySet<string>,
): boolean {
  if (enabledFieldKeys.has(fieldKey)) return false
  return disabledFieldKeys.has(fieldKey)
}

export function isSectionVisibleByRules(
  section: string,
  visibleSections: ReadonlySet<string>,
  hiddenSections: ReadonlySet<string>,
): boolean {
  if (hiddenSections.has(section)) return false
  return visibleSections.has(section)
}

export function createRuleId(): string {
  return `rule_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyRule(name = "Nova regra"): FormRuleDefinition {
  return {
    id: createRuleId(),
    name,
    enabled: true,
    conditionLogic: "and",
    conditions: [],
    actions: [],
  }
}

export function createConditionGroup(
  logic: "and" | "or" = "and",
): RuleConditionGroup {
  return { logic, conditions: [] }
}

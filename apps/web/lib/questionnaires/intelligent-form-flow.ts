import type {
  JsonObject,
  QuestionnaireField,
  QuestionnaireTemplate,
} from "@/lib/data-access/modules/questionnaires"

import type { QuestionnaireFieldErrors } from "./questionnaire-field-validation"
import { evaluateQuestionnaireRules } from "./questionnaire-rules"

export type IntelligentFormStep = {
  key: string
  title: string
  fields: QuestionnaireField[]
}

type SectionSettings = {
  section?: string
  sectionTitle?: string
}

function sectionSettings(field: QuestionnaireField): SectionSettings {
  const settings = field.settings
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return {}
  return settings as SectionSettings
}

export function buildIntelligentSteps(fields: QuestionnaireField[]): IntelligentFormStep[] {
  const steps: IntelligentFormStep[] = []
  const ordered = [...fields].sort((left, right) => left.order - right.order)
  for (const field of ordered) {
    const settings = sectionSettings(field)
    const key = settings.section?.trim() || "geral"
    const title = settings.sectionTitle?.trim() || key
    const current = steps.find((step) => step.key === key)
    if (current) {
      current.fields.push(field)
    } else {
      steps.push({ key, title, fields: [field] })
    }
  }
  return steps
}

export function adjacentStep(
  index: number,
  count: number,
  direction: "next" | "back",
) {
  if (count <= 0) return 0
  if (direction === "back") return Math.max(0, index - 1)
  return Math.min(count - 1, index + 1)
}

export function retainAnswer(
  answers: JsonObject,
  key: string,
  value: unknown,
): JsonObject {
  return { ...answers, [key]: value }
}

export function stepProgress(index: number, count: number) {
  const total = Math.max(count, 1)
  const current = Math.min(Math.max(index, 0), total - 1)
  return {
    index: current,
    total,
    percent: Math.round(((current + 1) / total) * 100),
    label: `Etapa ${current + 1} de ${total}`,
  }
}

export function visibleIntelligentFields(
  template: Pick<QuestionnaireTemplate, "name" | "settings">,
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
) {
  const result = evaluateQuestionnaireRules(template, fields, answers)
  return {
    fields: fields.filter((field) => result.visibleFieldKeys.has(field.key)),
    requiredKeys: result.requiredFieldKeys,
  }
}

export function errorsForFields(
  errors: QuestionnaireFieldErrors,
  fields: readonly QuestionnaireField[],
) {
  const keys = new Set(fields.map((field) => field.key))
  return Object.fromEntries(
    Object.entries(errors).filter(([key]) => keys.has(key)),
  )
}

export function firstStepWithError(
  steps: readonly IntelligentFormStep[],
  errors: QuestionnaireFieldErrors,
) {
  return steps.findIndex((step) =>
    step.fields.some((field) => Boolean(errors[field.key])),
  )
}

import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"

import {
  DEFAULT_SECTION,
  fieldTypeLabels,
  questionKindOptions,
} from "./constants"
import type {
  FieldSettings,
  InsuranceQuestionKind,
  SectionGroup,
  TemplateSettings,
} from "./types"

export function optionalFormValue(value: string) {
  return value.trim() || undefined
}

export function formatDate(value: string) {
  if (!value) return "Sem data"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value))
}

export function getFieldSettings(
  field: Pick<QuestionnaireField, "settings">,
): FieldSettings {
  return field.settings as FieldSettings
}

export function getTemplateSettings(
  template: Pick<{ settings: unknown }, "settings">,
): TemplateSettings {
  return template.settings as TemplateSettings
}

export function normalizeSectionName(value: string) {
  return value.trim() || DEFAULT_SECTION
}

export function getFieldSection(field: QuestionnaireField) {
  return normalizeSectionName(getFieldSettings(field).section ?? "")
}

export function getQuestionKindFromField(
  field: QuestionnaireField,
): InsuranceQuestionKind {
  const settings = getFieldSettings(field)
  if (settings.inputKind) return settings.inputKind
  if (field.type === "TEXTAREA") return "long_text"
  if (field.type === "NUMBER") return "number"
  if (field.type === "BOOLEAN") return "yes_no"
  if (field.type === "SELECT") return "single_choice"
  if (field.type === "MULTI_SELECT") return "multi_choice"
  if (field.type === "EMAIL") return "email"
  if (field.type === "PHONE") return "phone"
  if (field.type === "DATE") return "date"
  if (field.type === "CURRENCY") return "currency"
  if (field.type === "FILE") return "file"
  return "short_text"
}

export function getQuestionKindLabel(field: QuestionnaireField) {
  const kind = getQuestionKindFromField(field)
  return (
    questionKindOptions.find((option) => option.value === kind)?.label ??
    fieldTypeLabels[field.type]
  )
}

export function slugifyKey(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70)

  if (!slug) return "pergunta"
  return /^[a-z]/.test(slug) ? slug : `campo_${slug}`
}

export function uniqueQuestionKey(
  label: string,
  fields: QuestionnaireField[],
  currentKey?: string,
) {
  const base = slugifyKey(label)
  const used = new Set(
    fields.map((field) => field.key).filter((key) => key !== currentKey),
  )
  if (!used.has(base)) return base

  let index = 2
  while (used.has(`${base}_${index}`)) index += 1
  return `${base}_${index}`
}

function slugifyOption(value: string) {
  return slugifyKey(value).replace(/^campo_/, "")
}

function uniqueOptionValue(value: string, usedValues: Set<string>) {
  if (!usedValues.has(value)) return value

  let index = 2
  while (usedValues.has(`${value}_${index}`)) index += 1
  return `${value}_${index}`
}

export function buildFieldOptions(
  labels: string[],
  existingOptions: QuestionnaireField["options"] = [],
) {
  const usedValues = new Set<string>()

  return labels.map((label) => {
    const existingValue = existingOptions?.find(
      (option) => option.label === label && !usedValues.has(option.value),
    )?.value
    const value = uniqueOptionValue(
      existingValue ?? slugifyOption(label),
      usedValues,
    )
    usedValues.add(value)
    return { label, value }
  })
}

export function uniqueSectionNames(values: string[]) {
  const sections: string[] = []
  for (const value of values) {
    const section = normalizeSectionName(value)
    if (!sections.includes(section)) sections.push(section)
  }
  return sections
}

export function getTemplateSectionNames(
  template: Pick<{ settings: unknown }, "settings">,
) {
  const sections = getTemplateSettings(template).questionnaireSections
  if (!Array.isArray(sections)) return []
  return uniqueSectionNames(
    sections.filter((section): section is string => typeof section === "string"),
  )
}

export function getQuestionnaireSections(
  template: Pick<{ settings: unknown }, "settings">,
  fields: QuestionnaireField[],
) {
  return uniqueSectionNames([
    ...getTemplateSectionNames(template),
    ...fields.map(getFieldSection),
  ])
}

export function groupFieldsBySection(
  fields: QuestionnaireField[],
  sections: string[] = [],
): SectionGroup[] {
  const groups = uniqueSectionNames(sections).map((section) => ({
    section,
    fields: [] as QuestionnaireField[],
  }))

  for (const field of [...fields].sort((a, b) => a.order - b.order)) {
    const section = getFieldSection(field)
    const group = groups.find((item) => item.section === section)
    if (group) {
      group.fields.push(field)
    } else {
      groups.push({ section, fields: [field] })
    }
  }
  return groups
}

export function buildFlatFieldOrder(groups: SectionGroup[]) {
  return groups.flatMap((group) => group.fields.map((field) => field.id))
}

export function reorderSectionGroups(
  groups: SectionGroup[],
  activeSection: string,
  overSection: string,
) {
  const next = [...groups]
  const oldIndex = next.findIndex((group) => group.section === activeSection)
  const newIndex = next.findIndex((group) => group.section === overSection)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return groups

  const [removed] = next.splice(oldIndex, 1)
  next.splice(newIndex, 0, removed!)
  return next
}

export function reorderFieldsInGroup(
  group: SectionGroup,
  activeFieldId: string,
  overFieldId: string,
) {
  const fields = [...group.fields]
  const oldIndex = fields.findIndex((field) => field.id === activeFieldId)
  const newIndex = fields.findIndex((field) => field.id === overFieldId)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return group

  const [removed] = fields.splice(oldIndex, 1)
  fields.splice(newIndex, 0, removed!)
  return { ...group, fields }
}

export function moveFieldBetweenGroups(
  groups: SectionGroup[],
  activeFieldId: string,
  targetSection: string,
  overFieldId?: string,
) {
  const next = groups.map((group) => ({
    ...group,
    fields: [...group.fields],
  }))

  let movingField: QuestionnaireField | undefined
  for (const group of next) {
    const index = group.fields.findIndex((field) => field.id === activeFieldId)
    if (index >= 0) {
      movingField = group.fields.splice(index, 1)[0]
      break
    }
  }
  if (!movingField) return groups

  const targetGroup = next.find((group) => group.section === targetSection)
  if (!targetGroup) return groups

  if (overFieldId) {
    const insertIndex = targetGroup.fields.findIndex(
      (field) => field.id === overFieldId,
    )
    targetGroup.fields.splice(
      insertIndex >= 0 ? insertIndex : targetGroup.fields.length,
      0,
      movingField,
    )
  } else {
    targetGroup.fields.push(movingField)
  }

  return next.filter(
    (group) => group.fields.length > 0 || groups.some((g) => g.section === group.section),
  )
}

export function duplicateSectionName(section: string, existing: string[]) {
  const base = `${section} (cópia)`
  if (!existing.includes(base)) return base
  let index = 2
  while (existing.includes(`${section} (cópia ${index})`)) index += 1
  return `${section} (cópia ${index})`
}

import {
  QUESTIONNAIRE_FIELD_TYPES,
  type JsonObject,
  type QuestionnaireField,
  type QuestionnaireFieldOption,
  type QuestionnaireFieldType,
} from "@/lib/data-access/modules/questionnaires"

const FIELD_TYPES = new Set<string>(QUESTIONNAIRE_FIELD_TYPES)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function fieldOptions(value: unknown): QuestionnaireFieldOption[] | null {
  if (!Array.isArray(value)) return null
  const options = value.flatMap((item) => {
    if (!isRecord(item)) return []
    if (typeof item.label !== "string" || typeof item.value !== "string") return []
    return [{ label: item.label, value: item.value }]
  })
  return options.length > 0 ? options : null
}

export function formFromVersionDefinition(
  definition: unknown,
  meta: { templateId: string; tenantId: string; name: string },
) {
  if (!isRecord(definition)) return null
  if (definition.schemaVersion !== 1) return null
  if (!Array.isArray(definition.fields) || definition.fields.length === 0) return null

  const sectionTitles = new Map<string, string>()
  if (Array.isArray(definition.sections)) {
    for (const section of definition.sections) {
      if (!isRecord(section)) continue
      if (typeof section.key === "string" && typeof section.title === "string") {
        sectionTitles.set(section.key, section.title)
      }
    }
  }

  const fields: QuestionnaireField[] = []
  for (const raw of definition.fields) {
    if (!isRecord(raw)) continue
    if (typeof raw.key !== "string" || typeof raw.label !== "string") continue
    const type = FIELD_TYPES.has(String(raw.type))
      ? (raw.type as QuestionnaireFieldType)
      : "TEXT"
    const settings: JsonObject = isRecord(raw.settings) ? { ...raw.settings } : {}
    const sectionKey =
      typeof settings.section === "string"
        ? settings.section
        : typeof raw.sectionKey === "string"
          ? raw.sectionKey
          : null
    if (sectionKey && typeof settings.section !== "string") {
      settings.section = sectionKey
    }
    if (sectionKey && typeof settings.sectionTitle !== "string") {
      const title = sectionTitles.get(sectionKey)
      if (title) settings.sectionTitle = title
    }
    fields.push({
      id: `version-${raw.key}`,
      tenantId: meta.tenantId,
      templateId: meta.templateId,
      key: raw.key,
      label: raw.label,
      type,
      required: raw.required === true,
      order: typeof raw.order === "number" ? raw.order : fields.length,
      placeholder: typeof raw.placeholder === "string" ? raw.placeholder : null,
      helpText: typeof raw.helpText === "string" ? raw.helpText : null,
      options: fieldOptions(raw.options),
      validation: isRecord(raw.validation) ? raw.validation : null,
      settings,
      createdAt: "",
      updatedAt: "",
    })
  }

  if (fields.length === 0) return null
  return {
    name: meta.name,
    settings: {
      engineVersion: 2,
      rules: Array.isArray(definition.rules) ? definition.rules : [],
      ...(typeof definition.branch === "string" ? { branch: definition.branch } : {}),
    } satisfies JsonObject,
    fields,
  }
}

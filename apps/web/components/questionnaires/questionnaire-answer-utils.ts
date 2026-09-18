import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"

const DEFAULT_SECTION = "Geral"

type FieldSettings = {
  section?: string
}

function resolveOptionLabel(field: QuestionnaireField, value: unknown) {
  const options = field.options ?? []
  const raw = String(value)
  const match = options.find(
    (option) => option.value === raw || option.label === raw,
  )
  return match?.label
}

export function getFieldSection(field: QuestionnaireField) {
  const settings = field.settings as FieldSettings
  return settings.section?.trim() || DEFAULT_SECTION
}

export function groupFieldsBySection(fields: QuestionnaireField[]) {
  const groups: Array<{ section: string; fields: QuestionnaireField[] }> = []
  for (const field of fields) {
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

export function formatFieldAnswer(
  field: QuestionnaireField,
  value: unknown,
): string {
  if (value === undefined || value === null || value === "") {
    return "—"
  }

  switch (field.type) {
    case "BOOLEAN":
      return value === true || value === "true" ? "Sim" : "Não"
    case "DATE": {
      const date = new Date(String(value))
      if (Number.isNaN(date.getTime())) return String(value)
      return new Intl.DateTimeFormat("pt-BR").format(date)
    }
    case "SELECT":
      return resolveOptionLabel(field, value) ?? String(value)
    case "MULTI_SELECT": {
      const items = Array.isArray(value) ? value : [value]
      const labels = items
        .map((item) => resolveOptionLabel(field, item) ?? String(item))
        .filter(Boolean)
      return labels.length > 0 ? labels.join(", ") : "—"
    }
    case "CURRENCY": {
      const amount = Number(value)
      if (Number.isFinite(amount)) {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount)
      }
      return String(value)
    }
    case "NUMBER": {
      const amount = Number(value)
      if (Number.isFinite(amount)) {
        return new Intl.NumberFormat("pt-BR").format(amount)
      }
      return String(value)
    }
    default:
      if (Array.isArray(value)) {
        return value.map(String).join(", ")
      }
      return String(value)
  }
}

export function formatSubmissionDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export function submissionResponsible(
  assignedTo?: string | null,
  fallback?: string | null,
) {
  return assignedTo?.trim() || fallback?.trim() || "Sem responsável"
}

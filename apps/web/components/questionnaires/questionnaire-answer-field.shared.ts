import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"

export type QuestionnaireAnswerFieldProps = {
  field: QuestionnaireField
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  registerRef?: (element: HTMLDivElement | null) => void
}

function slugifyOptionValue(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return slug || "opcao"
}

function firstStringValue(value: Record<string, unknown>) {
  return Object.values(value).find(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  )
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function parseOptionString(value: string): unknown[] {
  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return parsed
    if (isPlainRecord(parsed)) return Object.values(parsed)
  } catch {
    return trimmed
      .split(/\n|,/)
      .map((option) => option.trim())
      .filter(Boolean)
  }

  return [trimmed]
}

export function getFieldOptions(field: QuestionnaireField) {
  const rawOptions = field.options as unknown
  const optionItems =
    typeof rawOptions === "string"
      ? parseOptionString(rawOptions)
      : Array.isArray(rawOptions)
        ? rawOptions
        : isPlainRecord(rawOptions)
          ? Object.values(rawOptions)
          : []

  return optionItems
    .map((option, index) => {
      if (typeof option === "string") {
        return {
          label: option,
          value: `${slugifyOptionValue(option)}_${index}`,
        }
      }
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        return null
      }

      const record = option as Record<string, unknown>
      const label =
        typeof record.label === "string" && record.label.trim()
          ? record.label.trim()
          : typeof record.value === "string" && record.value.trim()
            ? record.value.trim()
            : firstStringValue(record)?.trim()
      if (!label) return null

      const value =
        typeof record.value === "string" && record.value.trim()
          ? record.value.trim()
          : `${slugifyOptionValue(label)}_${index}`

      return { label, value }
    })
    .filter(
      (option): option is { label: string; value: string } => option !== null,
    )
}

import type { FormFieldDescriptor } from "../types/index"
import { parseDateBrToIso } from "./validators.util"
import { resolveSemanticKind } from "./field.util"

export function isEmptyAnswer(field: FormFieldDescriptor, value: unknown): boolean {
  const kind = resolveSemanticKind(field)

  if (field.type === "BOOLEAN" || kind === "checkbox") {
    return value === null || value === undefined
  }

  if (field.type === "MULTI_SELECT" || kind === "multiselect") {
    return !Array.isArray(value) || value.length === 0
  }

  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function normalizeAnswerForSubmit(
  field: FormFieldDescriptor,
  value: unknown,
): unknown {
  const kind = resolveSemanticKind(field)

  if (kind === "date" || field.type === "DATE") {
    if (typeof value !== "string") return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }

    const iso = parseDateBrToIso(trimmed)
    return iso ?? undefined
  }

  if (kind === "number" || kind === "currency" || kind === "decimal") {
    if (value === "" || value === null || value === undefined) return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
  }

  if (kind === "multiselect" || field.type === "MULTI_SELECT") {
    return Array.isArray(value) ? value : []
  }

  return value
}

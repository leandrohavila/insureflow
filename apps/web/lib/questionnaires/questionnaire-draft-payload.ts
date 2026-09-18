import type { JsonObject, QuestionnaireField } from "@/lib/data-access/modules/questionnaires"

import { buildDraftAnswers } from "./questionnaire-field-validation"

/** JSON estável (chaves ordenadas) para comparar payloads de rascunho. */
export function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(",")}}`
}

export function hashDraftAnswersPayload(answers: Record<string, unknown>) {
  return stableSerialize(answers)
}

export function buildDraftPayloadHash(
  fields: QuestionnaireField[],
  formAnswers: JsonObject,
) {
  return hashDraftAnswersPayload(buildDraftAnswers(fields, formAnswers))
}

export const AUTOSAVE_LOG = {
  trigger: "AUTOSAVE_TRIGGER",
  skipped: "AUTOSAVE_SKIPPED",
  success: "AUTOSAVE_SUCCESS",
  error: "AUTOSAVE_ERROR",
  rehydrated: "FORM_REHYDRATED",
} as const

export function logAutosave(
  event: (typeof AUTOSAVE_LOG)[keyof typeof AUTOSAVE_LOG],
  detail?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "production") return
  console.debug(`[questionnaire-autosave] ${event}`, detail ?? {})
}

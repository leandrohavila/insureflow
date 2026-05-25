import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"

import {
  firstInvalidFieldKey,
  formatDateBrMask,
  isDateField,
  type QuestionnaireFieldErrors,
} from "./questionnaire-field-validation"

export function emptyAnswerFor(field: QuestionnaireField) {
  if (field.type === "BOOLEAN") return false
  if (field.type === "MULTI_SELECT") return []
  return ""
}

function isoDateToBr(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return value
  return `${match[3]}/${match[2]}/${match[1]}`
}

export function storedAnswerToFormValue(
  field: QuestionnaireField,
  value: unknown,
) {
  if (value === undefined || value === null) return emptyAnswerFor(field)
  if (field.type === "DATE" || isDateField(field)) {
    return formatDateBrMask(isoDateToBr(String(value)))
  }
  return value
}

export function answersToFormState(
  fields: QuestionnaireField[],
  stored: Record<string, unknown>,
) {
  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      stored[field.key] !== undefined
        ? storedAnswerToFormValue(field, stored[field.key])
        : emptyAnswerFor(field),
    ]),
  )
}

export function mergeAnswersWithFields(
  fields: QuestionnaireField[],
  current: Record<string, unknown>,
) {
  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      current[field.key] ?? emptyAnswerFor(field),
    ]),
  )
}

export function questionnaireCompletionPercent(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
  isEmpty: (field: QuestionnaireField, value: unknown) => boolean,
) {
  const required = fields.filter((field) => field.required)
  if (required.length === 0) return 100
  const filled = required.filter((field) => !isEmpty(field, answers[field.key]))
  return Math.round((filled.length / required.length) * 100)
}

export function scrollFieldIntoView(
  element: HTMLElement,
  scrollRoot?: HTMLElement | null,
) {
  if (scrollRoot) {
    const rootRect = scrollRoot.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const targetTop =
      scrollRoot.scrollTop +
      (elementRect.top - rootRect.top) -
      rootRect.height / 2 +
      elementRect.height / 2
    scrollRoot.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" })
    return
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" })
}

export function focusFirstFieldError(
  errors: QuestionnaireFieldErrors,
  refs: Record<string, HTMLElement | null>,
  orderedFields: QuestionnaireField[],
  scrollRoot?: HTMLElement | null,
) {
  const key = firstInvalidFieldKey(errors, orderedFields)
  if (!key) return

  const element = refs[key]
  if (!element) return

  scrollFieldIntoView(element, scrollRoot)

  const focusable = element.querySelector<HTMLElement>(
    "input:not([type=hidden]), textarea, select, button, [tabindex]:not([tabindex='-1'])",
  )
  focusable?.focus({ preventScroll: true })
}

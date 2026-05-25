import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import { ApiClientError } from "@/lib/data-access/errors"

export type FieldSettings = {
  section?: string
  inputKind?: string
  mask?: "cpf" | "cnpj" | "cep" | "phone" | "plate"
}

export type QuestionnaireFieldErrors = Record<string, string>

const GENERIC_HTTP_MESSAGES = new Set([
  "Bad Request",
  "Unauthorized",
  "Forbidden",
  "Not Found",
  "Conflict",
  "Internal Server Error",
  "Unprocessable Entity",
])

export function getFieldSettings(field: QuestionnaireField): FieldSettings {
  return field.settings as FieldSettings
}

export function getFieldMask(field: QuestionnaireField): FieldSettings["mask"] {
  const settings = getFieldSettings(field)
  if (settings.mask) return settings.mask
  if (settings.inputKind === "cpf") return "cpf"
  if (settings.inputKind === "cnpj") return "cnpj"
  if (settings.inputKind === "cep") return "cep"
  if (settings.inputKind === "plate") return "plate"
  if (field.type === "PHONE" || settings.inputKind === "phone") return "phone"
  return undefined
}

export function isDateField(field: QuestionnaireField) {
  return field.type === "DATE"
}

export function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}

export function formatDateBrMask(value: string) {
  const digits = onlyDigits(value, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function parseDateBrToIso(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 9999) {
    return null
  }

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function isValidDateBr(value: string) {
  return parseDateBrToIso(value) !== null
}

export function applyInputMask(value: string, mask?: FieldSettings["mask"]) {
  if (mask === "cpf") {
    return onlyDigits(value, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  if (mask === "cnpj") {
    return onlyDigits(value, 14)
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
  }

  if (mask === "cep") {
    return onlyDigits(value, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2")
  }

  if (mask === "phone") {
    const digits = onlyDigits(value, 11)
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d{1,4})$/, "$1-$2")
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
  }

  if (mask === "plate") {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 7)
  }

  return value
}

export function isEmptyAnswer(field: QuestionnaireField, value: unknown) {
  if (field.type === "BOOLEAN") return false
  if (field.type === "MULTI_SELECT") {
    return !Array.isArray(value) || value.length === 0
  }
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value, 11)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index)
  }
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== Number(cpf[9])) return false

  sum = 0
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index)
  }
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  return digit === Number(cpf[10])
}

export function isValidPhone(value: string) {
  const digits = onlyDigits(value, 11)
  return digits.length >= 10 && digits.length <= 11
}

function friendlyMessageForBackend(raw: string, field?: QuestionnaireField) {
  const label = field?.label?.trim()

  if (/deve ser uma data válida/i.test(raw)) {
    return "Informe uma data válida"
  }
  if (/deve ser um e-mail válido/i.test(raw)) {
    return "Informe um e-mail válido"
  }
  if (/deve ser número/i.test(raw)) {
    return "Informe um número válido"
  }
  if (/deve ser uma opção/i.test(raw) || /possui opção inválida/i.test(raw)) {
    return "Selecione uma opção válida"
  }
  if (/deve ser uma lista de opções/i.test(raw)) {
    return "Selecione ao menos uma opção"
  }
  if (/Campo obrigatório sem resposta/i.test(raw)) {
    return "Preencha este campo"
  }
  if (/deve ser texto/i.test(raw)) {
    return "Preencha este campo corretamente"
  }
  if (label && raw.includes(label)) {
    return "Revise este campo"
  }
  if (GENERIC_HTTP_MESSAGES.has(raw)) {
    return null
  }
  return "Não foi possível salvar. Revise os campos destacados."
}

function findFieldByBackendMessage(
  message: string,
  fields: QuestionnaireField[],
) {
  const requiredMatch = message.match(/Campo obrigatório sem resposta:\s*(.+)$/i)
  if (requiredMatch?.[1]) {
    const label = requiredMatch[1].trim()
    return fields.find((field) => field.label.trim() === label)
  }

  return fields.find((field) => message.includes(field.label.trim()))
}

export function mapBackendMessagesToFieldErrors(
  messages: string[],
  fields: QuestionnaireField[],
): QuestionnaireFieldErrors {
  const errors: QuestionnaireFieldErrors = {}

  for (const raw of messages) {
    const trimmed = raw.trim()
    if (!trimmed || GENERIC_HTTP_MESSAGES.has(trimmed)) continue

    const field = findFieldByBackendMessage(trimmed, fields)
    const friendly =
      friendlyMessageForBackend(trimmed, field) ??
      "Revise este campo antes de salvar."

    if (field) {
      errors[field.key] = friendly
      continue
    }
  }

  return errors
}

export function extractApiErrorMessages(error: unknown): string[] {
  if (!(error instanceof ApiClientError) || !error.payload) return []

  const { message } = error.payload
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === "string")
  }
  if (typeof message === "string" && message.trim()) {
    return [message.trim()]
  }
  return []
}

export function parseQuestionnaireSubmissionErrors(
  error: unknown,
  fields: QuestionnaireField[],
): { fieldErrors: QuestionnaireFieldErrors; summary: string | null } {
  const messages = extractApiErrorMessages(error)
  const fieldErrors = mapBackendMessagesToFieldErrors(messages, fields)

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      summary: "Corrija os campos destacados antes de salvar.",
    }
  }

  if (messages.length > 0) {
    const friendly = friendlyMessageForBackend(messages[0]!)
    return {
      fieldErrors: {},
      summary:
        friendly ?? "Não foi possível salvar o questionário. Tente novamente.",
    }
  }

  return {
    fieldErrors: {},
    summary: "Não foi possível salvar o questionário. Tente novamente.",
  }
}

function validateFilledAnswerFormat(
  field: QuestionnaireField,
  value: unknown,
): string | undefined {
  const mask = getFieldMask(field)

  if (field.type === "DATE" || isDateField(field)) {
    const display = String(value ?? "")
    if (!isValidDateBr(display)) return "Informe uma data válida"
    return undefined
  }

  if (mask === "cpf" || getFieldSettings(field).inputKind === "cpf") {
    if (!isValidCpf(String(value))) return "Informe um CPF válido"
    return undefined
  }

  if (
    field.type === "PHONE" ||
    mask === "phone" ||
    getFieldSettings(field).inputKind === "phone"
  ) {
    if (!isValidPhone(String(value))) return "Informe um telefone válido"
    return undefined
  }

  if (field.type === "EMAIL" && typeof value === "string") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return "Informe um e-mail válido"
    }
    return undefined
  }

  if ((field.type === "NUMBER" || field.type === "CURRENCY") && value !== "") {
    const number = Number(value)
    if (!Number.isFinite(number)) return "Informe um número válido"
  }

  return undefined
}

/** Apenas formato dos campos preenchidos — sem checar obrigatórios (rascunho/autosave). */
export function validateFilledQuestionnaireAnswers(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
): QuestionnaireFieldErrors {
  const errors: QuestionnaireFieldErrors = {}

  for (const field of fields) {
    const value = answers[field.key]
    if (isEmptyAnswer(field, value)) continue

    const formatError = validateFilledAnswerFormat(field, value)
    if (formatError) errors[field.key] = formatError
  }

  return errors
}

/** Validação completa para finalizar (obrigatórios + formato). */
export function validateQuestionnaireAnswersForFinalize(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
): QuestionnaireFieldErrors {
  const errors: QuestionnaireFieldErrors = {}

  for (const field of fields) {
    const value = answers[field.key]

    if (field.required && isEmptyAnswer(field, value)) {
      errors[field.key] = "Preencha este campo"
      continue
    }

    if (isEmptyAnswer(field, value)) continue

    if (field.type === "MULTI_SELECT" && field.required) {
      const selected = Array.isArray(value) ? value : []
      if (selected.length === 0) {
        errors[field.key] = "Selecione ao menos uma opção"
        continue
      }
    }

    if (field.type === "SELECT" && field.required) {
      if (typeof value !== "string" || !value.trim()) {
        errors[field.key] = "Selecione uma opção"
        continue
      }
    }

    const formatError = validateFilledAnswerFormat(field, value)
    if (formatError) errors[field.key] = formatError
  }

  return errors
}

/** @deprecated Use validateQuestionnaireAnswersForFinalize para submit final. */
export function validateQuestionnaireAnswers(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
): QuestionnaireFieldErrors {
  return validateQuestionnaireAnswersForFinalize(fields, answers)
}

export function normalizeAnswerForSubmit(
  field: QuestionnaireField,
  value: unknown,
) {
  if (field.type === "DATE" || isDateField(field)) {
    const iso = parseDateBrToIso(String(value ?? ""))
    return iso ?? undefined
  }

  if (field.type === "NUMBER" || field.type === "CURRENCY") {
    if (value === "") return undefined
    const number = Number(value)
    return Number.isFinite(number) ? number : value
  }

  if (field.type === "MULTI_SELECT") {
    return Array.isArray(value) ? value : []
  }

  return value
}

export function buildSubmitAnswers(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
) {
  return Object.fromEntries(
    fields
      .map((field) => [
        field.key,
        normalizeAnswerForSubmit(field, answers[field.key]),
      ])
      .filter(([, value]) => value !== undefined),
  )
}

/** Respostas parciais para rascunho — ignora vazios, inválidos e incompletos. */
export function buildDraftAnswers(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
) {
  const invalidFilled = validateFilledQuestionnaireAnswers(fields, answers)
  const result: Record<string, unknown> = {}

  for (const field of fields) {
    const value = answers[field.key]
    if (isEmptyAnswer(field, value)) continue
    if (invalidFilled[field.key]) continue

    if (field.type === "DATE" || isDateField(field)) {
      const iso = parseDateBrToIso(String(value ?? ""))
      if (iso) result[field.key] = iso
      continue
    }

    const normalized = normalizeAnswerForSubmit(field, value)
    if (normalized !== undefined) result[field.key] = normalized
  }

  return result
}

export function hasQuestionnaireValidationErrors(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
) {
  return (
    Object.keys(validateQuestionnaireAnswersForFinalize(fields, answers)).length >
    0
  )
}

export function firstInvalidFieldKey(
  errors: QuestionnaireFieldErrors,
  orderedFields: QuestionnaireField[] = [],
) {
  const orderedKey = orderedFields.find((field) => errors[field.key])?.key
  if (orderedKey) return orderedKey
  return Object.keys(errors)[0] ?? null
}

import { stripDocumentDigits, isValidCpfDigits } from "@/lib/documents/document"
import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import type { JsonObject } from "@/lib/data-access/modules/questionnaires"

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function fieldTokens(field: QuestionnaireField) {
  return [field.key, field.label].map(normalizeToken)
}

function matchesAny(field: QuestionnaireField, patterns: string[]) {
  const tokens = fieldTokens(field)
  return patterns.some((pattern) =>
    tokens.some(
      (token) => token.includes(pattern) || pattern.includes(token),
    ),
  )
}

function readAnswer(answers: JsonObject, field: QuestionnaireField): unknown {
  if (field.key in answers) return answers[field.key]
  if (field.id in answers) return answers[field.id]
  return undefined
}

function hasFilledValue(value: unknown) {
  if (value === undefined || value === null) return false
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function findAnswerByPatterns(
  answers: JsonObject | null | undefined,
  fields: QuestionnaireField[],
  patterns: string[],
) {
  if (!answers || fields.length === 0) return null
  for (const field of fields) {
    if (!matchesAny(field, patterns)) continue
    const value = readAnswer(answers, field)
    if (hasFilledValue(value)) return String(value).trim()
  }
  return null
}

export function hasAnswerByPatterns(
  answers: JsonObject | null | undefined,
  fields: QuestionnaireField[],
  patterns: string[],
) {
  return Boolean(findAnswerByPatterns(answers, fields, patterns))
}

export function isValidCep(value: string | null | undefined) {
  if (!value) return false
  const digits = stripDocumentDigits(value)
  return digits.length === 8
}

export function resolveQuestionnaireCpf(
  answers: JsonObject | null | undefined,
  fields: QuestionnaireField[],
) {
  const raw = findAnswerByPatterns(answers, fields, [
    "cpf",
    "documento",
    "doc_segurado",
  ])
  if (!raw) return null
  const digits = stripDocumentDigits(raw)
  return isValidCpfDigits(digits) ? digits : null
}

export function resolveQuestionnaireBonus(
  answers: JsonObject | null | undefined,
  fields: QuestionnaireField[],
) {
  return findAnswerByPatterns(answers, fields, ["bonus", "classe", "bm"])
}

export function resolveSecondDriver(
  answers: JsonObject | null | undefined,
  fields: QuestionnaireField[],
) {
  return hasAnswerByPatterns(answers, fields, [
    "segundo_condutor",
    "condutor_2",
    "condutor2",
    "second_driver",
  ])
}

export function isAutoProduct(product: string | null | undefined) {
  if (!product) return false
  const token = normalizeToken(product)
  return (
    token.includes("auto") ||
    token.includes("veiculo") ||
    token.includes("carro") ||
    token.includes("motocicleta")
  )
}

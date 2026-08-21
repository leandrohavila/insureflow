import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import { ApiClientError } from "@/lib/data-access/errors"
import {
  ValidationEngine,
  RuleEngine,
  applyInputMask,
  createClientValidationContext,
  errorsToFieldMap,
  fieldsToDescriptors,
  formatDateBrMask,
  getFieldMask as engineGetFieldMask,
  isEmptyAnswer as engineIsEmptyAnswer,
  isValidCpf,
  isValidDateBr,
  isValidPhone,
  onlyDigits,
  parseDateBrToIso,
  resolveValidationProfile,
  toFormFieldDescriptor,
  normalizeAnswerForSubmit as engineNormalizeAnswer,
} from "@repo/forms-engine"
import { evaluateQuestionnaireRules } from "@/lib/questionnaires/questionnaire-rules"

export type FieldSettings = {
  section?: string
  inputKind?: string
  mask?: "cpf" | "cnpj" | "cep" | "phone" | "plate"
}

export type QuestionnaireFieldErrors = Record<string, string>

const engine = new ValidationEngine()
const ruleEngine = new RuleEngine()

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
  return engineGetFieldMask(toFormFieldDescriptor(field)) as FieldSettings["mask"]
}

export function isDateField(field: QuestionnaireField) {
  return field.type === "DATE"
}

export { onlyDigits, formatDateBrMask, parseDateBrToIso, isValidDateBr, applyInputMask, isValidCpf, isValidPhone }

export function isEmptyAnswer(field: QuestionnaireField, value: unknown) {
  return engineIsEmptyAnswer(toFormFieldDescriptor(field), value)
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

function validateWithEngine(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
  mode: "draft" | "finalize",
  templateSettings?: Record<string, unknown> | null,
  templateName = "Questionnaire",
): QuestionnaireFieldErrors {
  const descriptors = fieldsToDescriptors(fields)
  const profile = resolveValidationProfile(templateSettings)

  const ruleResult = evaluateQuestionnaireRules(
    { name: templateName, settings: templateSettings ?? {} },
    fields,
    answers,
  )

  const effectiveAnswers = ruleEngine.applyValueOverrides(answers, ruleResult)

  const context = createClientValidationContext(effectiveAnswers, {
    mode,
    profile,
    visibleFieldKeys: ruleResult.visibleFieldKeys,
    requiredFieldKeys: ruleResult.requiredFieldKeys,
    optionalFieldKeys: ruleResult.optionalFieldKeys,
    disabledFieldKeys: ruleResult.disabledFieldKeys,
  })
  const result = engine.validateSubmission(descriptors, effectiveAnswers, context)
  return errorsToFieldMap(result.errors)
}

/** Apenas formato dos campos preenchidos — sem checar obrigatórios (rascunho/autosave). */
export function validateFilledQuestionnaireAnswers(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
  templateSettings?: Record<string, unknown> | null,
  templateName?: string,
): QuestionnaireFieldErrors {
  return validateWithEngine(fields, answers, "draft", templateSettings, templateName)
}

/** Validação completa para finalizar (obrigatórios + formato). */
export function validateQuestionnaireAnswersForFinalize(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
  templateSettings?: Record<string, unknown> | null,
  templateName?: string,
): QuestionnaireFieldErrors {
  return validateWithEngine(fields, answers, "finalize", templateSettings, templateName)
}

/** @deprecated Use validateQuestionnaireAnswersForFinalize para submit final. */
export function validateQuestionnaireAnswers(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
  templateSettings?: Record<string, unknown> | null,
): QuestionnaireFieldErrors {
  return validateQuestionnaireAnswersForFinalize(fields, answers, templateSettings)
}

export function normalizeAnswerForSubmit(
  field: QuestionnaireField,
  value: unknown,
) {
  return engineNormalizeAnswer(toFormFieldDescriptor(field), value)
}

export function buildSubmitAnswers(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
) {
  return engine.buildSubmitAnswers(fieldsToDescriptors(fields), answers)
}

/** Respostas parciais para rascunho — ignora vazios, inválidos e incompletos. */
export function buildDraftAnswers(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
  templateSettings?: Record<string, unknown> | null,
  templateName = "Questionnaire",
) {
  const descriptors = fieldsToDescriptors(fields)
  const profile = resolveValidationProfile(templateSettings)

  const ruleResult = evaluateQuestionnaireRules(
    { name: templateName, settings: templateSettings ?? {} },
    fields,
    answers,
  )

  const effectiveAnswers = ruleEngine.applyValueOverrides(answers, ruleResult)

  const context = createClientValidationContext(effectiveAnswers, {
    mode: "draft",
    profile,
    visibleFieldKeys: ruleResult.visibleFieldKeys,
    requiredFieldKeys: ruleResult.requiredFieldKeys,
    optionalFieldKeys: ruleResult.optionalFieldKeys,
    disabledFieldKeys: ruleResult.disabledFieldKeys,
  })
  return engine.buildDraftAnswers(descriptors, effectiveAnswers, context)
}

export function hasQuestionnaireValidationErrors(
  fields: QuestionnaireField[],
  answers: Record<string, unknown>,
  templateSettings?: Record<string, unknown> | null,
) {
  return (
    Object.keys(
      validateQuestionnaireAnswersForFinalize(fields, answers, templateSettings),
    ).length > 0
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

export function validateFieldRealtime(
  field: QuestionnaireField,
  value: unknown,
  templateSettings?: Record<string, unknown> | null,
) {
  const profile = resolveValidationProfile(templateSettings)
  const context = createClientValidationContext(
    { [field.key]: value },
    { mode: "finalize", profile },
  )
  const result = engine.validateField(toFormFieldDescriptor(field), value, context)
  return result.errors[0]?.message ?? null
}

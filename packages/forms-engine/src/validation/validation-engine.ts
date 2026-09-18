import type {
  FormFieldDescriptor,
  TemplateDescriptor,
  ValidationContext,
  ValidationError,
  ValidationResult,
} from "./types/index"
import { isEmptyAnswer, normalizeAnswerForSubmit } from "./utils/answer.util"
import {
  getFieldSection,
  isFieldDisabled,
  isFieldRequired,
  isFieldVisible,
  resolveSemanticKind,
  createValidationError,
} from "./utils/field.util"
import {
  defaultValidationRegistry,
  type ValidationRegistry,
} from "./validation-registry"
import { applyGenericRules } from "./validators/index"

export class ValidationEngine {
  constructor(private readonly registry: ValidationRegistry = defaultValidationRegistry) {}

  validateField(
    field: FormFieldDescriptor,
    value: unknown,
    context: ValidationContext,
  ): ValidationResult {
    if (!isFieldVisible(field, context)) {
      return { valid: true, errors: [], warnings: [] }
    }

    if (isFieldDisabled(field, context)) {
      return { valid: true, errors: [], warnings: [] }
    }

    const errors: ValidationError[] = []
    const empty = isEmptyAnswer(field, value)
    const shouldRequire =
      isFieldRequired(field, context) &&
      (context.mode === "finalize" || context.enforceRequired === true)

    if (empty) {
      if (shouldRequire) {
        errors.push(
          createValidationError(
            field,
            "required",
            context.surface === "server"
              ? `Campo obrigatório sem resposta: ${field.label}`
              : "Preencha este campo",
            "required",
          ),
        )
      }
      return { valid: errors.length === 0, errors, warnings: [] }
    }

    if (context.mode === "draft" && !shouldRequire) {
      const kind = resolveSemanticKind(field)
      const validators = this.registry.getValidatorsForKind(kind)
      for (const validator of validators) {
        errors.push(...validator.validate(value, field, context))
      }
      errors.push(...applyGenericRules(value, field, context))
      return { valid: errors.length === 0, errors, warnings: [] }
    }

    const kind = resolveSemanticKind(field)
    const validators = this.registry.getValidatorsForKind(kind)

    if (validators.length === 0) {
      errors.push(
        createValidationError(
          field,
          "unsupported_kind",
          `Tipo de campo não suportado: ${kind}`,
        ),
      )
    }

    for (const validator of validators) {
      errors.push(...validator.validate(value, field, context))
    }

    errors.push(...applyGenericRules(value, field, context))

    return { valid: errors.length === 0, errors, warnings: [] }
  }

  validateSection(
    fields: FormFieldDescriptor[],
    answers: Record<string, unknown>,
    section: string,
    context: ValidationContext,
  ): ValidationResult {
    const sectionFields = fields
      .filter((field) => getFieldSection(field) === section)
      .sort((a, b) => a.order - b.order)

    return this.validateFields(sectionFields, answers, context)
  }

  validateSubmission(
    fields: FormFieldDescriptor[],
    answers: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult {
    const sortedFields = [...fields].sort((a, b) => a.order - b.order)
    const fieldResult = this.validateFields(sortedFields, answers, context)

    const fieldsByKey = new Map(sortedFields.map((field) => [field.key, field]))
    const unknownKeys = Object.keys(answers).filter((key) => !fieldsByKey.has(key))

    if (unknownKeys.length > 0 && context.surface === "server") {
      fieldResult.errors.push({
        fieldKey: unknownKeys[0]!,
        code: "unknown_field",
        message: `Campos inexistentes no template: ${unknownKeys.join(", ")}`,
      })
      fieldResult.valid = false
    }

    return fieldResult
  }

  validateTemplate(template: TemplateDescriptor): ValidationResult {
    const errors: ValidationError[] = []
    const keys = new Set<string>()

    if (!template.name?.trim()) {
      errors.push({
        fieldKey: "__template__",
        code: "template_name_required",
        message: "Nome do template é obrigatório",
      })
    }

    for (const field of template.fields) {
      if (!field.key?.trim()) {
        errors.push({
          fieldKey: "__template__",
          code: "field_key_required",
          message: "Campo sem key",
        })
        continue
      }

      if (keys.has(field.key)) {
        errors.push({
          fieldKey: field.key,
          code: "duplicate_key",
          message: `Key duplicada: ${field.key}`,
        })
      }
      keys.add(field.key)

      if (!field.label?.trim()) {
        errors.push({
          fieldKey: field.key,
          code: "field_label_required",
          message: "Label é obrigatório",
        })
      }

      const kind = resolveSemanticKind(field)
      if (
        (kind === "select" || kind === "multiselect" || kind === "radio") &&
        (!field.options || field.options.length === 0)
      ) {
        errors.push({
          fieldKey: field.key,
          code: "options_required",
          message: "Campos de escolha precisam de opções",
        })
      }
    }

    return { valid: errors.length === 0, errors, warnings: [] }
  }

  buildSubmitAnswers(
    fields: FormFieldDescriptor[],
    answers: Record<string, unknown>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      fields
        .map((field) => [
          field.key,
          normalizeAnswerForSubmit(field, answers[field.key]),
        ])
        .filter(([, value]) => value !== undefined),
    )
  }

  buildDraftAnswers(
    fields: FormFieldDescriptor[],
    answers: Record<string, unknown>,
    context: ValidationContext,
  ): Record<string, unknown> {
    const draftContext: ValidationContext = { ...context, mode: "draft" }
    const result: Record<string, unknown> = {}

    for (const field of fields) {
      const value = answers[field.key]
      if (isEmptyAnswer(field, value)) continue

      const fieldResult = this.validateField(field, value, draftContext)
      if (!fieldResult.valid) continue

      const normalized = normalizeAnswerForSubmit(field, value)
      if (normalized !== undefined) {
        result[field.key] = normalized
      }
    }

    return result
  }

  private validateFields(
    fields: FormFieldDescriptor[],
    answers: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult {
    const errors: ValidationError[] = []

    for (const field of fields) {
      const result = this.validateField(field, answers[field.key], context)
      errors.push(...result.errors)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    }
  }
}

export const defaultValidationEngine = new ValidationEngine()

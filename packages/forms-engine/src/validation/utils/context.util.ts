import type {
  FormFieldDescriptor,
  ValidationContext,
  ValidationMode,
  ValidationProfile,
  ValidationSurface,
} from "../types/index"
import { toFormFieldDescriptor } from "./field.util"

export function createValidationContext(options: {
  mode: ValidationMode
  profile: ValidationProfile
  surface: ValidationSurface
  answers: Record<string, unknown>
  enforceRequired?: boolean
  visibleFieldKeys?: ReadonlySet<string>
  requiredFieldKeys?: ReadonlySet<string>
  optionalFieldKeys?: ReadonlySet<string>
  disabledFieldKeys?: ReadonlySet<string>
}): ValidationContext {
  return {
    locale: "pt-BR",
    ...options,
  }
}

export function createClientValidationContext(
  answers: Record<string, unknown>,
  options: {
    mode: ValidationMode
    profile: ValidationProfile
    enforceRequired?: boolean
    visibleFieldKeys?: ReadonlySet<string>
    requiredFieldKeys?: ReadonlySet<string>
    optionalFieldKeys?: ReadonlySet<string>
    disabledFieldKeys?: ReadonlySet<string>
  },
): ValidationContext {
  return createValidationContext({
    ...options,
    surface: "client",
    answers,
  })
}

export function createServerValidationContext(
  answers: Record<string, unknown>,
  options: {
    mode: ValidationMode
    profile: ValidationProfile
    enforceRequired?: boolean
    visibleFieldKeys?: ReadonlySet<string>
    requiredFieldKeys?: ReadonlySet<string>
    optionalFieldKeys?: ReadonlySet<string>
    disabledFieldKeys?: ReadonlySet<string>
  },
): ValidationContext {
  return createValidationContext({
    ...options,
    surface: "server",
    answers,
  })
}

export function fieldsToDescriptors(
  fields: Array<{
    key: string
    label: string
    type: string
    required: boolean
    order: number
    placeholder?: string | null
    helpText?: string | null
    options?: unknown
    validation?: unknown
    settings?: unknown
  }>,
): FormFieldDescriptor[] {
  return fields.map((field) => toFormFieldDescriptor(field))
}

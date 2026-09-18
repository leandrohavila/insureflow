import type { FormFieldDescriptor, SemanticFieldKind } from "../types/index"

type FieldSettings = {
  section?: string
  inputKind?: string
  mask?: string
  defaultValue?: unknown
}

const INPUT_KIND_MAP: Record<string, SemanticFieldKind> = {
  short_text: "short_text",
  long_text: "long_text",
  number: "number",
  cpf: "cpf",
  cnpj: "cnpj",
  cep: "cep",
  phone: "phone",
  email: "email",
  date: "date",
  yes_no: "checkbox",
  single_choice: "select",
  multi_choice: "multiselect",
  plate: "plate",
  currency: "currency",
  file: "file",
  url: "url",
  time: "time",
  datetime: "datetime",
  renavam: "renavam",
  chassi: "chassi",
  decimal: "decimal",
  radio: "radio",
}

const MASK_KIND_MAP: Record<string, SemanticFieldKind> = {
  cpf: "cpf",
  cnpj: "cnpj",
  cep: "cep",
  phone: "phone",
  plate: "plate",
}

export function getFieldSettings(field: FormFieldDescriptor): FieldSettings {
  return (field.settings ?? {}) as FieldSettings
}

export function resolveSemanticKind(field: FormFieldDescriptor): SemanticFieldKind {
  const settings = getFieldSettings(field)
  const mask = settings.mask

  if (mask && MASK_KIND_MAP[mask]) {
    return MASK_KIND_MAP[mask]!
  }

  const inputKind = settings.inputKind
  if (inputKind && INPUT_KIND_MAP[inputKind]) {
    return INPUT_KIND_MAP[inputKind]!
  }

  switch (field.type) {
    case "TEXTAREA":
      return "long_text"
    case "NUMBER":
      return "number"
    case "CURRENCY":
      return "currency"
    case "EMAIL":
      return "email"
    case "PHONE":
      return "phone"
    case "DATE":
      return "date"
    case "BOOLEAN":
      return "checkbox"
    case "SELECT":
      return settings.inputKind === "radio" ? "radio" : "select"
    case "MULTI_SELECT":
      return "multiselect"
    case "FILE":
      return "file"
    case "TEXT":
    default:
      return "short_text"
  }
}

export function resolveValidationProfile(
  settings?: Record<string, unknown> | null,
): "v1" | "v2" {
  const engineVersion = settings?.engineVersion
  return engineVersion === 2 ? "v2" : "v1"
}

export function getFieldSection(field: FormFieldDescriptor): string {
  const section = getFieldSettings(field).section
  return typeof section === "string" && section.trim() ? section.trim() : "Geral"
}

export function isFieldVisible(
  field: FormFieldDescriptor,
  context: { visibleFieldKeys?: ReadonlySet<string> },
): boolean {
  if (!context.visibleFieldKeys) return true
  return context.visibleFieldKeys.has(field.key)
}

export function isFieldDisabled(
  field: FormFieldDescriptor,
  context: { disabledFieldKeys?: ReadonlySet<string> },
): boolean {
  if (!context.disabledFieldKeys) return false
  return context.disabledFieldKeys.has(field.key)
}

export function isFieldRequired(
  field: FormFieldDescriptor,
  context: {
    requiredFieldKeys?: ReadonlySet<string>
    optionalFieldKeys?: ReadonlySet<string>
  },
): boolean {
  if (context.optionalFieldKeys?.has(field.key)) return false
  if (context.requiredFieldKeys?.has(field.key)) return true
  return field.required
}

export function createValidationError(
  field: FormFieldDescriptor,
  code: string,
  message: string,
  rule?: string,
) {
  return {
    fieldKey: field.key,
    code,
    message,
    rule,
  }
}

export function errorsToFieldMap(
  errors: Array<{ fieldKey: string; message: string }>,
): Record<string, string> {
  return Object.fromEntries(errors.map((error) => [error.fieldKey, error.message]))
}

export function toFormFieldDescriptor(field: {
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
}): FormFieldDescriptor {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    order: field.order,
    placeholder: field.placeholder,
    helpText: field.helpText,
    options: normalizeOptionsFromUnknown(field.options),
    validation: parseValidationSchema(field.validation),
    settings:
      field.settings && typeof field.settings === "object"
        ? (field.settings as Record<string, unknown>)
        : {},
  }
}

function normalizeOptionsFromUnknown(options: unknown) {
  if (!Array.isArray(options)) return null
  return options.flatMap((item) => {
    if (typeof item === "string") {
      const label = item.trim()
      if (!label) return []
      return [{ label, value: label.toLowerCase().replace(/\s+/g, "_") }]
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>
      const label = String(record.label ?? "").trim()
      if (!label) return []
      const value = String(record.value ?? label).trim()
      return [{ label, value }]
    }
    return []
  })
}

function parseValidationSchema(
  validation: unknown,
): FormFieldDescriptor["validation"] {
  if (!validation || typeof validation !== "object") return null
  const record = validation as Record<string, unknown>
  if (record.version === 1) {
    return validation as FormFieldDescriptor["validation"]
  }
  return null
}

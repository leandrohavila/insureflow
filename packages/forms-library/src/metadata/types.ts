import type { FormRuleDefinition, ValidationSchemaV1 } from "@repo/forms-engine"

export const FIELD_CATEGORIES = [
  "dados_pessoais",
  "documentos",
  "contato",
  "endereco",
  "veiculos",
  "condutores",
  "imovel",
  "empresa",
  "financeiro",
  "beneficiarios",
  "coberturas",
  "anexos",
] as const

export type FieldCategoryId = (typeof FIELD_CATEGORIES)[number]

export const INSURANCE_PRODUCTS = [
  "auto",
  "vida",
  "residencial",
  "empresarial",
  "shared",
] as const

export type InsuranceProductId = (typeof INSURANCE_PRODUCTS)[number]

export type FieldInputKind =
  | "short_text"
  | "long_text"
  | "number"
  | "cpf"
  | "cnpj"
  | "cep"
  | "phone"
  | "email"
  | "date"
  | "yes_no"
  | "single_choice"
  | "multi_choice"
  | "plate"
  | "currency"
  | "file"

export type FieldDefinition = {
  id: string
  name: string
  label: string
  description: string
  inputKind: FieldInputKind
  /** Prisma QuestionnaireFieldType equivalent */
  fieldType:
    | "TEXT"
    | "TEXTAREA"
    | "NUMBER"
    | "DATE"
    | "BOOLEAN"
    | "SELECT"
    | "MULTI_SELECT"
    | "EMAIL"
    | "PHONE"
    | "CURRENCY"
    | "FILE"
  validation?: ValidationSchemaV1 | null
  defaultRules?: FormRuleDefinition[]
  defaultMask?: "cpf" | "cnpj" | "cep" | "phone" | "plate"
  defaultPlaceholder?: string
  category: FieldCategoryId
  product: InsuranceProductId
  tags: string[]
  icon: string
  documentation?: string
  required?: boolean
  helpText?: string
  options?: Array<{ label: string; value: string }>
  defaultValue?: unknown
  /** Base key used when instantiating in templates */
  key: string
}

export type BlockPreview = {
  summary: string
  fieldCount: number
  highlights: string[]
}

export type BlockDefinition = {
  id: string
  name: string
  label: string
  description: string
  product: Exclude<InsuranceProductId, "shared">
  section: string
  fieldIds: string[]
  defaultRules?: FormRuleDefinition[]
  tags: string[]
  icon: string
  documentation?: string
  preview: BlockPreview
}

export type InstantiatedField = {
  key: string
  label: string
  type: FieldDefinition["fieldType"]
  required: boolean
  order: number
  placeholder?: string
  helpText?: string
  options?: Array<{ label: string; value: string }>
  validation?: ValidationSchemaV1 | null
  settings: Record<string, unknown>
}

export type BlockInstantiationResult = {
  blockId: string
  section: string
  fields: InstantiatedField[]
  rules: FormRuleDefinition[]
}

export type FieldSearchFilters = {
  query?: string
  category?: FieldCategoryId | "all"
  product?: InsuranceProductId | "all"
  tag?: string | "all"
  inputKind?: FieldInputKind | "all"
}

export type BlockSearchFilters = {
  query?: string
  product?: InsuranceProductId | "all"
  tag?: string | "all"
}

export type LibraryFavorites = {
  fieldIds: string[]
  blockIds: string[]
}

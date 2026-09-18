export type InsuranceQuestionKind =
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

export type FieldSettings = {
  section?: string
  inputKind?: InsuranceQuestionKind
  mask?: "cpf" | "cnpj" | "cep" | "phone" | "plate"
  [key: string]: unknown
}

export type TemplateSettings = {
  questionnaireSections?: unknown
  [key: string]: unknown
}

export type PreviewViewport = "desktop" | "tablet" | "mobile"

export type SectionGroup = {
  section: string
  fields: import("@/lib/data-access/modules/questionnaires").QuestionnaireField[]
}

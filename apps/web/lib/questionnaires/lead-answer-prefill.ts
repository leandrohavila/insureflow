export type LeadAnswerSource = {
  name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  document?: string | null
  documentType?: string | null
}

const FIELD_SOURCES: Record<string, keyof LeadAnswerSource> = {
  full_name: "name",
  name: "name",
  nome: "name",
  cpf: "document",
  cnpj: "document",
  email: "email",
  phone: "phone",
  telefone: "phone",
  company_name: "company",
  company: "company",
  empresa: "company",
}

function isEmptyAnswer(value: unknown) {
  if (value == null) return true
  if (typeof value === "string") return value.trim().length === 0
  return false
}

function documentDigits(value: string) {
  return value.replace(/\D/g, "")
}

function valueForField(key: string, lead: LeadAnswerSource) {
  const source = FIELD_SOURCES[key]
  if (!source) return undefined
  if (source === "document") {
    const digits = lead.document ? documentDigits(lead.document) : ""
    if (key === "cpf" || key === "cnpj") {
      if (lead.documentType === "cpf") {
        return key === "cpf" ? lead.document?.trim() || undefined : undefined
      }
      if (lead.documentType === "cnpj") {
        return key === "cnpj" ? lead.document?.trim() || undefined : undefined
      }
      if (!lead.documentType) {
        if (key === "cpf" && digits.length === 11) return lead.document?.trim()
        if (key === "cnpj" && digits.length === 14) return lead.document?.trim()
      }
      return undefined
    }
  }
  const value = lead[source]
  if (typeof value !== "string" || !value.trim()) return undefined
  return value.trim()
}

export function prefillLeadAnswers(
  fields: readonly { key: string }[],
  answers: Record<string, unknown>,
  lead: LeadAnswerSource,
  persistedKeys?: ReadonlySet<string>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...answers }
  for (const field of fields) {
    if (persistedKeys?.has(field.key)) continue
    if (!isEmptyAnswer(next[field.key])) continue
    const value = valueForField(field.key, lead)
    if (value) next[field.key] = value
  }
  return next
}

export function retainClearedDraftAnswers(
  fields: readonly { key: string }[],
  formAnswers: Record<string, unknown>,
  draft: Record<string, unknown>,
  materializedKeys: ReadonlySet<string>,
): Record<string, unknown> {
  const next = { ...draft }
  for (const field of fields) {
    if (!materializedKeys.has(field.key)) continue
    if (!isEmptyAnswer(formAnswers[field.key])) continue
    next[field.key] = ""
  }
  return next
}

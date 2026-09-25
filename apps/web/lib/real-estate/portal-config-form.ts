export const PORTAL_UPDATE_KEYS = [
  "businessUnitId",
  "companyName",
  "heroTitle",
  "heroSubtitle",
  "heroImage",
  "logoUrl",
  "aboutTitle",
  "aboutText",
  "aboutImage",
  "differentials",
  "whatsapp",
  "phone",
  "email",
  "instagram",
  "facebook",
  "youtube",
  "creci",
  "address",
] as const

export type PortalUpdateKey = (typeof PORTAL_UPDATE_KEYS)[number]

export const PORTAL_TEXT_LIMITS = {
  companyName: 120,
  heroTitle: 160,
  heroSubtitle: 240,
  aboutTitle: 160,
  aboutText: 8000,
  whatsapp: 32,
  phone: 32,
  email: 160,
  instagram: 240,
  facebook: 240,
  youtube: 240,
  creci: 40,
  address: 240,
} as const

export const PORTAL_IMAGE_LIMIT = 2048
export const PORTAL_DIFFERENTIAL_LIMIT = 160

export type PortalTextKey = keyof typeof PORTAL_TEXT_LIMITS
export type PortalImageKey = "logoUrl" | "heroImage" | "aboutImage"

export type PortalConfigForm = {
  companyName: string
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  logoUrl: string
  aboutTitle: string
  aboutText: string
  aboutImage: string
  differentials: string
  whatsapp: string
  phone: string
  email: string
  instagram: string
  facebook: string
  youtube: string
  creci: string
  address: string
}

export type PortalConfigPayload = {
  businessUnitId: string
  companyName: string
  heroTitle: string | null
  heroSubtitle: string | null
  heroImage: string | null
  logoUrl: string | null
  aboutTitle: string | null
  aboutText: string | null
  aboutImage: string | null
  differentials: string[]
  whatsapp: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
  creci: string | null
  address: string | null
}

export const EMPTY_PORTAL_CONFIG: PortalConfigForm = {
  companyName: "",
  heroTitle: "",
  heroSubtitle: "",
  heroImage: "",
  logoUrl: "",
  aboutTitle: "",
  aboutText: "",
  aboutImage: "",
  differentials: "",
  whatsapp: "",
  phone: "",
  email: "",
  instagram: "",
  facebook: "",
  youtube: "",
  creci: "",
  address: "",
}

const TITLE_KEYS = new Set<PortalTextKey>(["heroTitle", "aboutTitle"])

export type PortalFieldFeedback = {
  error: string | null
  atLimit: boolean
}

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function portalConfigFromApi(data: unknown): PortalConfigForm {
  const row = isRecord(data) ? data : {}
  const differentials = Array.isArray(row.differentials)
    ? row.differentials.filter((item): item is string => typeof item === "string")
    : []
  return {
    companyName: asString(row.companyName),
    heroTitle: asString(row.heroTitle),
    heroSubtitle: asString(row.heroSubtitle),
    heroImage: asString(row.heroImage),
    logoUrl: asString(row.logoUrl),
    aboutTitle: asString(row.aboutTitle),
    aboutText: asString(row.aboutText),
    aboutImage: asString(row.aboutImage),
    differentials: differentials.join("\n"),
    whatsapp: asString(row.whatsapp),
    phone: asString(row.phone),
    email: asString(row.email),
    instagram: asString(row.instagram),
    facebook: asString(row.facebook),
    youtube: asString(row.youtube),
    creci: asString(row.creci),
    address: asString(row.address),
  }
}

export function portalConfigToPayload(
  form: PortalConfigForm,
  businessUnitId: string,
): PortalConfigPayload {
  return {
    businessUnitId,
    companyName: form.companyName.trim(),
    heroTitle: emptyToNull(form.heroTitle),
    heroSubtitle: emptyToNull(form.heroSubtitle),
    heroImage: emptyToNull(form.heroImage),
    logoUrl: emptyToNull(form.logoUrl),
    aboutTitle: emptyToNull(form.aboutTitle),
    aboutText: emptyToNull(form.aboutText),
    aboutImage: emptyToNull(form.aboutImage),
    differentials: form.differentials
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    whatsapp: emptyToNull(form.whatsapp),
    phone: emptyToNull(form.phone),
    email: emptyToNull(form.email),
    instagram: emptyToNull(form.instagram),
    facebook: emptyToNull(form.facebook),
    youtube: emptyToNull(form.youtube),
    creci: emptyToNull(form.creci),
    address: emptyToNull(form.address),
  }
}

export function sanitizePortalUpdateBody(input: unknown) {
  const source = isRecord(input) ? input : {}
  const body: Partial<Record<PortalUpdateKey, unknown>> = {}
  for (const key of PORTAL_UPDATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      body[key] = source[key]
    }
  }
  return body
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "")
}

function phoneIsValid(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (/[^\d\s()+-]/.test(trimmed)) return false
  const digits = phoneDigits(trimmed)
  return digits.length >= 10 && digits.length <= 15
}

function emailIsValid(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function overLimitMessage(key: PortalTextKey, max: number) {
  if (TITLE_KEYS.has(key)) return `O título não pode ultrapassar ${max} caracteres.`
  if (key === "companyName") return `O nome não pode ultrapassar ${max} caracteres.`
  if (key === "email") return `O e-mail não pode ultrapassar ${max} caracteres.`
  if (key === "phone" || key === "whatsapp") {
    return `O telefone não pode ultrapassar ${max} caracteres.`
  }
  return `Este campo não pode ultrapassar ${max} caracteres.`
}

export function assessTextField(key: PortalTextKey, value: string): PortalFieldFeedback {
  const max = PORTAL_TEXT_LIMITS[key]
  const length = value.length
  if (key === "companyName" && !value.trim()) {
    return { error: "Informe o nome da imobiliária.", atLimit: false }
  }
  if (length > max) {
    return { error: overLimitMessage(key, max), atLimit: false }
  }
  if (key === "email" && !emailIsValid(value)) {
    return { error: "E-mail inválido.", atLimit: false }
  }
  if ((key === "phone" || key === "whatsapp") && !phoneIsValid(value)) {
    return { error: "Informe um telefone válido.", atLimit: false }
  }
  return { error: null, atLimit: length === max && max > 0 }
}

export function assessImageField(value: string): PortalFieldFeedback {
  if (value.length > PORTAL_IMAGE_LIMIT) {
    return {
      error: `A imagem não pode ultrapassar ${PORTAL_IMAGE_LIMIT} caracteres.`,
      atLimit: false,
    }
  }
  return { error: null, atLimit: value.length === PORTAL_IMAGE_LIMIT && value.length > 0 }
}

export function differentialLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean)
}

export function assessDifferentials(value: string): PortalFieldFeedback {
  const lines = value.split("\n")
  const tooLong = lines.some((line) => line.trim().length > PORTAL_DIFFERENTIAL_LIMIT)
  if (tooLong) {
    return {
      error: `Nenhum diferencial pode ultrapassar ${PORTAL_DIFFERENTIAL_LIMIT} caracteres.`,
      atLimit: false,
    }
  }
  const longest = lines.reduce((max, line) => Math.max(max, line.trim().length), 0)
  return { error: null, atLimit: longest === PORTAL_DIFFERENTIAL_LIMIT }
}

export function portalFormFeedback(form: PortalConfigForm) {
  return {
    companyName: assessTextField("companyName", form.companyName),
    heroTitle: assessTextField("heroTitle", form.heroTitle),
    heroSubtitle: assessTextField("heroSubtitle", form.heroSubtitle),
    heroImage: assessImageField(form.heroImage),
    logoUrl: assessImageField(form.logoUrl),
    aboutTitle: assessTextField("aboutTitle", form.aboutTitle),
    aboutText: assessTextField("aboutText", form.aboutText),
    aboutImage: assessImageField(form.aboutImage),
    differentials: assessDifferentials(form.differentials),
    whatsapp: assessTextField("whatsapp", form.whatsapp),
    phone: assessTextField("phone", form.phone),
    email: assessTextField("email", form.email),
    instagram: assessTextField("instagram", form.instagram),
    facebook: assessTextField("facebook", form.facebook),
    youtube: assessTextField("youtube", form.youtube),
    creci: assessTextField("creci", form.creci),
    address: assessTextField("address", form.address),
  }
}

export function portalFormIsValid(form: PortalConfigForm) {
  return Object.values(portalFormFeedback(form)).every((field) => !field.error)
}

export function characterCounter(length: number, max: number) {
  const remaining = Math.max(0, max - length)
  return {
    length,
    max,
    remaining,
    label: `${length} / ${max} caracteres · restam ${remaining}`,
  }
}

export function longestDifferentialLength(value: string) {
  return value.split("\n").reduce((max, line) => Math.max(max, line.trim().length), 0)
}

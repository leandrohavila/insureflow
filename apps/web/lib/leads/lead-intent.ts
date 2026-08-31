import {
  INTEREST_CATEGORIES,
  type InterestCategory,
} from "../business-units/constants"

export type LeadCreateIntent = "insurance" | "real-estate"

export function parseLeadCreateIntent(
  value: string | null | undefined,
): LeadCreateIntent | null {
  if (!value) return null
  if (value === "real-estate" || value === "imobiliario") return "real-estate"
  if (value === "insurance" || value === "seguro" || value === "lead") {
    return "insurance"
  }
  return null
}

export function interestsForLeadIntent(
  intent: LeadCreateIntent,
): InterestCategory[] {
  return INTEREST_CATEGORIES.filter((category) =>
    intent === "real-estate"
      ? category.startsWith("PROPERTY_")
      : category.endsWith("_INSURANCE"),
  )
}

export function defaultInterestsForLeadIntent(
  intent: LeadCreateIntent,
): InterestCategory[] {
  return intent === "real-estate" ? ["PROPERTY_BUY"] : []
}

export function leadIntentFromUnitType(
  type: string | null | undefined,
): LeadCreateIntent {
  return type === "REAL_ESTATE" ? "real-estate" : "insurance"
}

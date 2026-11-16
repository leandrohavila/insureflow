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

/** União estável das qualificações das unidades selecionadas, sem duplicar código. */
export function interestsForBusinessUnitTypes(
  types: Array<string | null | undefined>,
): InterestCategory[] {
  const intents = new Set<LeadCreateIntent>()
  for (const type of types) {
    if (type === "REAL_ESTATE") intents.add("real-estate")
    else if (type === "INSURANCE") intents.add("insurance")
  }
  const allowed = new Set<InterestCategory>()
  for (const intent of intents) {
    for (const category of interestsForLeadIntent(intent)) allowed.add(category)
  }
  return INTEREST_CATEGORIES.filter((category) => allowed.has(category))
}

export function incompatibleInterestCategories(
  selected: readonly InterestCategory[],
  available: readonly InterestCategory[],
): InterestCategory[] {
  const allowed = new Set(available)
  return selected.filter((category) => !allowed.has(category))
}

export function resolveInterestAvailability(input: {
  selectedUnitIds: readonly string[]
  units: ReadonlyArray<{ id: string; type: string }>
  selectedInterests: readonly InterestCategory[]
  /** Quando a consulta de unidades já terminou, um id sem tipo não trava o formulário. */
  settled?: boolean
}) {
  const typeById = new Map<string, string>()
  for (const unit of input.units) {
    if (unit.id && unit.type) typeById.set(unit.id, unit.type)
  }
  const types: string[] = []
  let pending = false
  for (const id of input.selectedUnitIds) {
    const type = typeById.get(id)
    if (!type) pending = true
    else types.push(type)
  }
  const available = interestsForBusinessUnitTypes(types)
  if (input.selectedUnitIds.length === 0) {
    return {
      available,
      incompatible: incompatibleInterestCategories(
        input.selectedInterests,
        available,
      ),
      pending: false,
    }
  }
  if (pending && !input.settled) {
    return { available, incompatible: [] as InterestCategory[], pending: true }
  }
  if (types.length === 0) {
    return {
      available: [...input.selectedInterests],
      incompatible: [] as InterestCategory[],
      pending: false,
    }
  }
  return {
    available,
    incompatible: incompatibleInterestCategories(
      input.selectedInterests,
      available,
    ),
    pending: false,
  }
}

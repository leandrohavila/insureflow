import type { BusinessUnitContext } from "@/lib/data-access/modules/business-units/types"

export function isRealEstateContext(
  context: BusinessUnitContext | null | undefined,
): boolean {
  if (!context?.units.length) return false

  const currentId = context.currentBusinessUnitId
  if (currentId) {
    const current = context.units.find((unit) => unit.id === currentId)
    return current?.type === "REAL_ESTATE"
  }

  if (context.units.length === 1) {
    return context.units[0]?.type === "REAL_ESTATE"
  }

  return false
}

function resolveBusinessUnitIdByType(
  context: BusinessUnitContext | null | undefined,
  type: "INSURANCE" | "REAL_ESTATE",
): string | null {
  if (!context?.units.length) return null
  const currentId = context.currentBusinessUnitId
  if (currentId) {
    const current = context.units.find((unit) => unit.id === currentId)
    if (current?.type === type) return current.id
  }
  return context.units.find((unit) => unit.type === type)?.id ?? null
}

export function resolveRealEstateBusinessUnitId(
  context: BusinessUnitContext | null | undefined,
): string | null {
  return resolveBusinessUnitIdByType(context, "REAL_ESTATE")
}

export function resolveInsuranceBusinessUnitId(
  context: BusinessUnitContext | null | undefined,
): string | null {
  return resolveBusinessUnitIdByType(context, "INSURANCE")
}

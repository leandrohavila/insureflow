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

export function resolveRealEstateBusinessUnitId(
  context: BusinessUnitContext | null | undefined,
): string | null {
  if (!context?.units.length) return null
  const currentId = context.currentBusinessUnitId
  if (currentId) {
    const current = context.units.find((unit) => unit.id === currentId)
    if (current?.type === "REAL_ESTATE") return current.id
  }
  const reUnit = context.units.find((unit) => unit.type === "REAL_ESTATE")
  return reUnit?.id ?? null
}

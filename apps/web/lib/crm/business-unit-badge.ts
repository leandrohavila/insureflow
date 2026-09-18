import type { BusinessUnitType } from "@/lib/business-units/constants"

export function businessUnitPipelineBadge(type?: BusinessUnitType | null) {
  return type === "REAL_ESTATE" ? "IMOBILIÁRIA" : "SEGUROS"
}

export function isInsuranceBusinessUnit(type?: BusinessUnitType | null) {
  return type !== "REAL_ESTATE"
}

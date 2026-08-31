import type { Customer360Payload } from "../data-access/modules/customer-360/types"

export type Customer360DomainId = "INSURANCE" | "REAL_ESTATE"

export type Customer360DomainSummary = {
  id: Customer360DomainId
  label: string
  active: boolean
  leads: number
  opportunities: number
  assets: number
}

function unitTypeIs(
  type: string | null | undefined,
  domain: Customer360DomainId,
) {
  return type === domain
}

export function summarizeCustomer360Domains(
  payload: Customer360Payload,
): Customer360DomainSummary[] {
  const insuranceLeads = payload.leads.filter((item) =>
    unitTypeIs(item.businessUnit?.type, "INSURANCE"),
  ).length
  const realEstateLeads = payload.leads.filter((item) =>
    unitTypeIs(item.businessUnit?.type, "REAL_ESTATE"),
  ).length
  const insuranceOpps = payload.opportunities.filter((item) =>
    unitTypeIs(item.businessUnit?.type, "INSURANCE"),
  ).length
  const realEstateOpps = payload.opportunities.filter((item) =>
    unitTypeIs(item.businessUnit?.type, "REAL_ESTATE"),
  ).length
  const insuranceDeals = payload.deals.filter((item) =>
    unitTypeIs(item.businessUnit?.type, "INSURANCE"),
  ).length
  const realEstateDeals = payload.deals.filter((item) =>
    unitTypeIs(item.businessUnit?.type, "REAL_ESTATE"),
  ).length
  const linkedInsurance = Boolean(
    payload.customer.businessUnits?.some((unit) => unit.type === "INSURANCE") ||
      payload.customer.businessUnit?.type === "INSURANCE",
  )
  const linkedRealEstate = Boolean(
    payload.customer.businessUnits?.some((unit) => unit.type === "REAL_ESTATE") ||
      payload.customer.businessUnit?.type === "REAL_ESTATE",
  )

  const insuranceAssets = payload.policies.length + insuranceDeals
  const realEstateAssets = payload.properties.length + realEstateDeals

  return [
    {
      id: "INSURANCE",
      label: "Seguros",
      active:
        linkedInsurance ||
        insuranceLeads > 0 ||
        insuranceOpps > 0 ||
        insuranceAssets > 0,
      leads: insuranceLeads,
      opportunities: insuranceOpps,
      assets: insuranceAssets,
    },
    {
      id: "REAL_ESTATE",
      label: "Imóveis",
      active:
        linkedRealEstate ||
        realEstateLeads > 0 ||
        realEstateOpps > 0 ||
        realEstateAssets > 0,
      leads: realEstateLeads,
      opportunities: realEstateOpps,
      assets: realEstateAssets,
    },
  ]
}

import { describe, expect, it } from "vitest"

import type { BusinessUnitContext } from "@/lib/data-access/modules/business-units/types"

import {
  resolveInsuranceBusinessUnitId,
  resolveRealEstateBusinessUnitId,
} from "./nav-context"

const context: BusinessUnitContext = {
  currentBusinessUnitId: "ins-1",
  canViewAll: true,
  canManage: true,
  units: [
    {
      id: "ins-1",
      name: "Corretora Ávila",
      slug: "corretora-avila",
      type: "INSURANCE",
      isActive: true,
    },
    {
      id: "re-1",
      name: "Ávila Imóveis",
      slug: "avila-imoveis",
      type: "REAL_ESTATE",
      isActive: true,
    },
  ],
}

describe("resolve business unit ids", () => {
  it("resolves insurance and real-estate units independently of the current selection", () => {
    expect(resolveInsuranceBusinessUnitId(context)).toBe("ins-1")
    expect(resolveRealEstateBusinessUnitId(context)).toBe("re-1")
  })

  it("prefers the current unit when it matches the requested type", () => {
    expect(
      resolveRealEstateBusinessUnitId({
        ...context,
        currentBusinessUnitId: "re-1",
      }),
    ).toBe("re-1")
  })

  it("returns null without units", () => {
    expect(resolveInsuranceBusinessUnitId(null)).toBeNull()
    expect(resolveRealEstateBusinessUnitId({ ...context, units: [] })).toBeNull()
  })
})

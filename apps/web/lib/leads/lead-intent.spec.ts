import { describe, expect, it } from "vitest"

import {
  defaultInterestsForLeadIntent,
  incompatibleInterestCategories,
  interestsForBusinessUnitTypes,
  interestsForLeadIntent,
  leadIntentFromUnitType,
  parseLeadCreateIntent,
  resolveInterestAvailability,
} from "./lead-intent"

describe("lead create intent", () => {
  it("parses deep-link aliases", () => {
    expect(parseLeadCreateIntent("lead")).toBe("insurance")
    expect(parseLeadCreateIntent("insurance")).toBe("insurance")
    expect(parseLeadCreateIntent("seguro")).toBe("insurance")
    expect(parseLeadCreateIntent("real-estate")).toBe("real-estate")
    expect(parseLeadCreateIntent("imobiliario")).toBe("real-estate")
    expect(parseLeadCreateIntent("other")).toBeNull()
  })

  it("scopes interest chips by domain", () => {
    expect(interestsForLeadIntent("insurance")).toEqual([
      "AUTO_INSURANCE",
      "HOME_INSURANCE",
      "LIFE_INSURANCE",
      "HEALTH_INSURANCE",
    ])
    expect(interestsForLeadIntent("real-estate")).toEqual([
      "PROPERTY_BUY",
      "PROPERTY_RENT",
      "PROPERTY_SELL",
      "PROPERTY_INVESTMENT",
    ])
    expect(defaultInterestsForLeadIntent("real-estate")).toEqual(["PROPERTY_BUY"])
    expect(defaultInterestsForLeadIntent("insurance")).toEqual([])
  })

  it("maps business unit type to intent", () => {
    expect(leadIntentFromUnitType("REAL_ESTATE")).toBe("real-estate")
    expect(leadIntentFromUnitType("INSURANCE")).toBe("insurance")
  })

  it("une as qualificações das unidades selecionadas sem duplicar", () => {
    expect(interestsForBusinessUnitTypes(["INSURANCE"])).toEqual(
      interestsForLeadIntent("insurance"),
    )
    expect(interestsForBusinessUnitTypes(["REAL_ESTATE"])).toEqual(
      interestsForLeadIntent("real-estate"),
    )
    expect(
      interestsForBusinessUnitTypes(["INSURANCE", "REAL_ESTATE", "INSURANCE"]),
    ).toEqual([
      ...interestsForLeadIntent("insurance"),
      ...interestsForLeadIntent("real-estate"),
    ])
    expect(interestsForBusinessUnitTypes([])).toEqual([])
  })

  it("preserva a seleção incompatível até a remoção explícita", () => {
    const available = interestsForLeadIntent("insurance")
    expect(
      incompatibleInterestCategories(
        ["AUTO_INSURANCE", "PROPERTY_RENT"],
        available,
      ),
    ).toEqual(["PROPERTY_RENT"])
  })

  it("não marca incompatibilidade enquanto o tipo da unidade não chegou", () => {
    const pending = resolveInterestAvailability({
      selectedUnitIds: ["re-1"],
      units: [],
      selectedInterests: ["PROPERTY_BUY"],
    })
    expect(pending.pending).toBe(true)
    expect(pending.incompatible).toEqual([])

    const resolved = resolveInterestAvailability({
      selectedUnitIds: ["ins-1", "re-1"],
      units: [
        { id: "ins-1", type: "INSURANCE" },
        { id: "re-1", type: "REAL_ESTATE" },
      ],
      selectedInterests: ["AUTO_INSURANCE", "PROPERTY_BUY"],
    })
    expect(resolved.pending).toBe(false)
    expect(resolved.incompatible).toEqual([])
    expect(resolved.available).toHaveLength(8)
  })
})

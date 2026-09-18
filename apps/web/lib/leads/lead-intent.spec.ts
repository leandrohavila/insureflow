import { describe, expect, it } from "vitest"

import {
  defaultInterestsForLeadIntent,
  interestsForLeadIntent,
  leadIntentFromUnitType,
  parseLeadCreateIntent,
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
})

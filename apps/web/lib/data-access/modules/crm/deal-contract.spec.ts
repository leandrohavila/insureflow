import { describe, expect, it } from "vitest"

import { toCreateDealPayload, toUpdateDealPayload } from "./deal-contract"

const input = {
  title: "TESTE AVILA 19/11",
  company: "TESTE AVILA 19/11",
  value: 100,
  stage: "novo" as const,
  status: "open" as const,
  assignedTo: "Ana Costa",
  businessUnitId: "unit-corretora",
}

describe("deal form payload", () => {
  it("sends the active business unit only when creating", () => {
    expect(toCreateDealPayload(input)).toMatchObject({
      value: 100,
      stage: "novo",
      businessUnitId: "unit-corretora",
    })
    expect(toUpdateDealPayload(input)).not.toHaveProperty("businessUnitId")
  })

  it("omits an empty business unit so the API keeps its own default", () => {
    const payload = toCreateDealPayload({ ...input, businessUnitId: "  " })
    expect(payload).not.toHaveProperty("businessUnitId")
    expect(payload.value).toBe(100)
  })
})

import { describe, expect, it } from "vitest"

import type { Customer360Payload } from "../data-access/modules/customer-360/types"

import { summarizeCustomer360Domains } from "./customer-360-domains"

const emptyPayload = {
  customer: { id: "c1", name: "Maria" },
  timeline: [],
  leads: [],
  deals: [],
  policies: [],
  properties: [],
  communications: [],
  followUps: [],
  renewals: [],
  crossSell: [],
  opportunities: [],
  pendencies: [],
} as unknown as Customer360Payload

describe("summarizeCustomer360Domains", () => {
  it("keeps both domains inactive without linked data", () => {
    expect(summarizeCustomer360Domains(emptyPayload)).toEqual([
      {
        id: "INSURANCE",
        label: "Seguros",
        active: false,
        leads: 0,
        opportunities: 0,
        assets: 0,
      },
      {
        id: "REAL_ESTATE",
        label: "Imóveis",
        active: false,
        leads: 0,
        opportunities: 0,
        assets: 0,
      },
    ])
  })

  it("splits leads, opportunities and assets by business unit type", () => {
    const payload = {
      ...emptyPayload,
      customer: {
        ...emptyPayload.customer,
        businessUnits: [
          { id: "ins", name: "Corretora", slug: "c", type: "INSURANCE" },
          { id: "re", name: "Imóveis", slug: "i", type: "REAL_ESTATE" },
        ],
      },
      leads: [
        { businessUnit: { type: "INSURANCE" } },
        { businessUnit: { type: "REAL_ESTATE" } },
        { businessUnit: { type: "REAL_ESTATE" } },
      ],
      opportunities: [{ businessUnit: { type: "INSURANCE" } }],
      policies: [{ id: "p1" }],
      properties: [{ id: "im1" }, { id: "im2" }],
    } as unknown as Customer360Payload

    const [insurance, realEstate] = summarizeCustomer360Domains(payload)
    expect(insurance).toMatchObject({
      active: true,
      leads: 1,
      opportunities: 1,
      assets: 1,
    })
    expect(realEstate).toMatchObject({
      active: true,
      leads: 2,
      opportunities: 0,
      assets: 2,
    })
  })
})

import { describe, expect, it } from "vitest"

import {
  computeLeadCaptureMetrics,
  formatLeadConversionRate,
} from "./lead-capture-metrics"

describe("computeLeadCaptureMetrics", () => {
  it("splits totals and derives conversion plus open pipeline", () => {
    expect(
      computeLeadCaptureMetrics({
        total: 10,
        insurance: 7,
        realEstate: 3,
        customersInsurance: 4,
        customersRealEstate: 2,
        counts: { new: 4, contacted: 2, qualified: 1, converted: 2 },
        insuranceCounts: { new: 3, contacted: 1, qualified: 1, converted: 2 },
        realEstateCounts: { new: 1, contacted: 1, qualified: 0, converted: 0 },
      }),
    ).toEqual({
      total: 10,
      insurance: 7,
      realEstate: 3,
      converted: 2,
      pipeline: 7,
      pipelineInsurance: 5,
      pipelineRealEstate: 2,
      customersInsurance: 4,
      customersRealEstate: 2,
      conversionRate: 20,
      noContact: 4,
      followUps: 0,
    })
  })

  it("returns null conversion when there are no leads", () => {
    expect(
      computeLeadCaptureMetrics({
        total: 0,
        insurance: 0,
        realEstate: 0,
      }),
    ).toMatchObject({
      conversionRate: null,
      pipeline: 0,
      pipelineInsurance: 0,
      customersInsurance: 0,
    })
    expect(formatLeadConversionRate(null)).toBe("—")
    expect(formatLeadConversionRate(20)).toBe("20%")
  })
})

import { describe, expect, it } from "vitest"

import { getDealCardSignals } from "./deal-card-signals"
import type { CrmDeal } from "@/lib/data-access/modules/crm"

function mockDeal(
  overrides: Partial<CrmDeal> = {},
): CrmDeal {
  return {
    id: "d1",
    tenantId: "t1",
    title: "Negócio teste",
    company: "Acme",
    value: 10000,
    stage: "novo",
    status: "open",
    pipelineOrder: 0,
    contact: "João",
    owner: "Maria",
    ownerInitials: "MA",
    priority: "media",
    product: "Auto",
    lastActivity: "2d",
    tags: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("getDealCardSignals", () => {
  it("marca prioridade alta e interação stale", () => {
    const signals = getDealCardSignals(
      mockDeal({
        priority: "alta",
        commercialContext: {
          questionnaire: { status: "pending", submissionId: null, updatedAt: null },
          phone: null,
          lastContactAt: null,
          lastInteractionAt: "2026-01-01T00:00:00Z",
          responsible: null,
        },
      }),
    )

    expect(signals.signals).toContain("priority-high")
    expect(signals.signals).toContain("stale-interaction")
    expect(signals.isStale).toBe(true)
  })

  it("usa accent de estágio quando prioridade não é alta", () => {
    const signals = getDealCardSignals(mockDeal({ priority: "baixa", stage: "proposta" }))
    expect(signals.accentVar).toContain("proposta")
  })
})

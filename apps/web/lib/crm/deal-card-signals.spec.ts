import { describe, expect, it } from "vitest"

import { dealCardFacts, getDealCardSignals } from "./deal-card-signals"
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

  it("mostra cliente, ramo, responsável e atraso só quando existem", () => {
    const facts = dealCardFacts(
      mockDeal({
        company: "Acme",
        assignedTo: "Maria",
        businessUnit: {
          id: "bu",
          name: "Corretora",
          slug: "corretora",
          type: "INSURANCE",
        },
        sla: {
          status: "overdue",
          dueAt: "2026-04-02T12:00:00.000Z",
          elapsedHours: 48,
          alertTarget: "OWNER",
          color: null,
          stageLabel: null,
        },
      }),
    )
    expect(facts.client).toBe("Acme")
    expect(facts.branch).toBe("Seguro")
    expect(facts.owner).toBe("Maria")
    expect(facts.next?.overdue).toBe(true)
    expect(facts.next?.label).toContain("Atrasada")
  })

  it("omite ramo, responsável e próxima ação quando o negócio não tem esses dados", () => {
    const facts = dealCardFacts(
      mockDeal({
        company: "",
        contact: "",
        owner: "Sem responsável",
        assignedTo: null,
        businessUnit: null,
        sla: null,
      }),
    )
    expect(facts.client).toBeNull()
    expect(facts.branch).toBeNull()
    expect(facts.owner).toBeNull()
    expect(facts.next).toBeNull()
  })

  it("usa accent de estágio quando prioridade não é alta", () => {
    const signals = getDealCardSignals(mockDeal({ priority: "baixa", stage: "proposta" }))
    expect(signals.accentVar).toContain("proposta")
  })
})

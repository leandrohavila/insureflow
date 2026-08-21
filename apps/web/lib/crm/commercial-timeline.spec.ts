import { describe, expect, it } from "vitest"

import { activityEventLabel } from "./activity-event-kinds"
import { buildCommercialTimeline, dedupeAndSortActivities } from "./commercial-timeline"

describe("activityEventLabel", () => {
  it("rotula eventos comerciais conhecidos", () => {
    expect(activityEventLabel("lead_converted")).toBe("Lead convertido")
    expect(activityEventLabel("questionnaire_submitted")).toBe(
      "Questionário enviado",
    )
    expect(activityEventLabel("quote_updated")).toBe("Cotação atualizada")
    expect(activityEventLabel("quote_compared")).toBe("Comparativo de cotações")
    expect(activityEventLabel("proposal_viewed")).toBe("Proposta visualizada")
    expect(activityEventLabel("proposal_pdf_generated")).toBe(
      "PDF da proposta gerado",
    )
    expect(activityEventLabel("proposal_expired")).toBe("Proposta expirada")
    expect(activityEventLabel("communication_sent")).toBe("Comunicação enviada")
    expect(activityEventLabel("communication_delivered")).toBe(
      "Comunicação entregue",
    )
    expect(activityEventLabel("communication_read")).toBe("Comunicação lida")
    expect(activityEventLabel("communication_replied")).toBe(
      "Resposta recebida",
    )
  })

  it("formata kinds desconhecidos", () => {
    expect(activityEventLabel("custom_event")).toBe("custom event")
  })
})

describe("buildCommercialTimeline", () => {
  it("deduplica e ordena atividades", () => {
    const sorted = dedupeAndSortActivities([
      {
        id: "a1",
        tenantId: "t1",
        type: "call",
        status: "completed",
        subject: "Ligação",
        description: null,
        outcome: null,
        occurredAt: "2026-01-01T10:00:00.000Z",
        nextFollowUpAt: null,
        leadId: "l1",
        dealId: null,
        customerId: null,
        performedById: "u1",
        performedBy: { id: "u1", name: "User", initials: "U" },
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "a1",
        tenantId: "t1",
        type: "note",
        status: "completed",
        subject: "Convertido",
        description: null,
        outcome: null,
        occurredAt: "2026-01-02T10:00:00.000Z",
        nextFollowUpAt: null,
        leadId: "l1",
        dealId: "d1",
        customerId: null,
        operationalEventKind: "lead_converted",
        performedById: "u1",
        performedBy: { id: "u1", name: "User", initials: "U" },
        createdAt: "2026-01-02T10:00:00.000Z",
        updatedAt: "2026-01-02T10:00:00.000Z",
      },
    ])

    expect(sorted).toHaveLength(1)
    expect(sorted[0]?.subject).toBe("Convertido")
  })

  it("monta CommercialTimelineItem com label de sistema", () => {
    const items = buildCommercialTimeline([
      {
        id: "a1",
        tenantId: "t1",
        type: "note",
        status: "completed",
        subject: "Convertido",
        description: null,
        outcome: null,
        occurredAt: "2026-01-02T10:00:00.000Z",
        nextFollowUpAt: null,
        leadId: "l1",
        dealId: "d1",
        customerId: null,
        operationalEventKind: "lead_converted",
        performedById: "u1",
        performedBy: { id: "u1", name: "User", initials: "U" },
        createdAt: "2026-01-02T10:00:00.000Z",
        updatedAt: "2026-01-02T10:00:00.000Z",
      },
    ])

    expect(items[0]?.isSystemEvent).toBe(true)
    expect(items[0]?.label).toBe("Lead convertido")
  })
})

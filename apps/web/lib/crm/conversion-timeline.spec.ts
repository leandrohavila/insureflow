import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { Activity } from "../data-access/modules/activities/types.ts"
import { foldLeadConversionTimeline } from "./conversion-timeline.ts"

function activity(
  partial: Pick<Activity, "id" | "operationalEventKind" | "subject" | "dealId"> &
    Partial<Activity>,
): Activity {
  return {
    tenantId: "t1",
    type: "note",
    status: "completed",
    description: null,
    outcome: null,
    occurredAt: "2026-09-23T12:00:00.000Z",
    nextFollowUpAt: null,
    leadId: "lead-1",
    customerId: null,
    performedById: "user-1",
    performedBy: { id: "user-1", name: "Ana", initials: "AN" },
    ...partial,
  }
}

describe("timeline de conversão", () => {
  it("mostra lead convertido, negócio criado e estágio inicial em sequência", () => {
    const items = foldLeadConversionTimeline([
      activity({
        id: "a-created",
        operationalEventKind: "deal_created",
        subject: "Negócio criado — Frota Acme",
        dealId: "deal-1",
      }),
      activity({
        id: "a-converted",
        operationalEventKind: "lead_converted",
        subject: "Lead convertido — Maria",
        description: "Negócio criado: Frota Acme",
        dealId: "deal-1",
      }),
    ])

    assert.equal(items.length, 1)
    assert.equal(items[0]?.kind, "conversion")
    if (items[0]?.kind !== "conversion") return
    assert.deepEqual(items[0].steps, [
      "Lead convertido",
      "Negócio criado — Frota Acme",
      "Estágio inicial: Novo Lead",
    ])
  })

  it("preserva eventos que não formam o par da conversão", () => {
    const note = activity({
      id: "note-1",
      operationalEventKind: null,
      subject: "Ligação",
      dealId: null,
      type: "call",
    })
    const items = foldLeadConversionTimeline([note])
    assert.equal(items.length, 1)
    assert.equal(items[0]?.kind, "activity")
  })
})

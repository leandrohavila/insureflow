import { describe, expect, it } from "vitest"

import {
  deriveLeadPriority,
  leadHasNoContact,
} from "./lead-operational-signals"
import type { Lead } from "../data-access/modules/leads"

function lead(partial: Partial<Lead>): Lead {
  return {
    id: "1",
    tenantId: "t",
    name: "Teste",
    status: "new",
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    initials: "TE",
    ...partial,
  }
}

describe("lead operational signals", () => {
  it("marca novo sem interação como sem contato e prioridade alta", () => {
    const row = lead({ status: "new" })
    expect(leadHasNoContact(row)).toBe(true)
    expect(deriveLeadPriority(row)).toBe("high")
  })

  it("não marca como sem contato depois da primeira interação", () => {
    const row = lead({
      status: "new",
      lastInteractionAt: "2026-09-01T15:00:00.000Z",
    })
    expect(leadHasNoContact(row)).toBe(false)
  })

  it("usa média para contatado e baixa para demais status", () => {
    expect(deriveLeadPriority(lead({ status: "contacted" }))).toBe("medium")
    expect(deriveLeadPriority(lead({ status: "qualified" }))).toBe("low")
  })
})

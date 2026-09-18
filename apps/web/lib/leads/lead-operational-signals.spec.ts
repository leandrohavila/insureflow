import { describe, expect, it } from "vitest"

import {
  deriveLeadOperationalBadges,
  deriveLeadPriority,
  leadHadContactToday,
  leadHasNoContact,
  leadIsOverdue,
  leadRenewalSoon,
  leadTelHref,
  leadWhatsAppHref,
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
    expect(deriveLeadOperationalBadges(row)).toContain("no_contact")
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

  it("detecta contato hoje, atraso e renovação próxima", () => {
    const now = new Date("2026-09-15T15:00:00.000-03:00")
    expect(
      leadHadContactToday(
        lead({ lastContactAt: "2026-09-15T10:00:00.000-03:00" }),
        now,
      ),
    ).toBe(true)
    expect(
      leadIsOverdue(
        lead({
          status: "contacted",
          lastContactAt: "2026-09-01T10:00:00.000Z",
        }),
        now,
      ),
    ).toBe(true)
    expect(
      leadRenewalSoon(
        lead({ policyExpiresAt: "2026-10-20T00:00:00.000Z" }),
        now,
      ),
    ).toBe(true)
    expect(
      deriveLeadOperationalBadges(
        lead({
          status: "contacted",
          lastContactAt: "2026-09-15T10:00:00.000-03:00",
          policyExpiresAt: "2026-10-01T00:00:00.000Z",
        }),
        now,
      ),
    ).toEqual(["contact_today", "renewal_soon"])
  })

  it("monta hrefs de ligação e WhatsApp", () => {
    expect(leadTelHref("(34) 99192-4025")).toBe("tel:+5534991924025")
    expect(leadWhatsAppHref("34991924025")).toBe("https://wa.me/5534991924025")
    expect(leadTelHref(null)).toBeNull()
  })
})

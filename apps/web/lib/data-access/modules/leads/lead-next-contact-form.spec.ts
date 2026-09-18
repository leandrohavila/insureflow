import { describe, expect, it } from "vitest"

import {
  combineDateAndTime,
  leadFormToAgendaFields,
  NEXT_CONTACT_PRESET_CUSTOM,
  shiftDateInput,
  suggestRenewalReminderFields,
} from "./lead-next-contact-form"

describe("lead next contact form", () => {
  it("combina data personalizada e hora em ISO", () => {
    const iso = combineDateAndTime("2027-03-15", "14:30")
    expect(iso).toBeTruthy()
    expect(new Date(iso as string).getFullYear()).toBe(2027)
    expect(new Date(iso as string).getMonth()).toBe(2)
  })

  it("gera atividade futura a partir da data personalizada", () => {
    const payload = leadFormToAgendaFields({
      followUpDays: NEXT_CONTACT_PRESET_CUSTOM,
      nextContactDate: "2027-03-15",
      nextContactTime: "10:00",
      nextContactType: "call",
      nextContactNotes: "Conquistar apólice",
      policyExpiresAt: "",
      renewalReminderD60Date: "",
      renewalReminderD60Time: "09:00",
      renewalReminderD30Date: "",
      renewalReminderD30Time: "09:00",
      renewalReminderD15Date: "",
      renewalReminderD15Time: "09:00",
    })
    expect(payload.followUpDays).toBeUndefined()
    expect(payload.nextContactType).toBe("call")
    expect(payload.nextContactAt).toBeTruthy()
  })

  it("sugere D-60/D-30/D-15 editáveis a partir do vencimento", () => {
    const suggested = suggestRenewalReminderFields("2027-04-15")
    expect(suggested.renewalReminderD60Date).toBe(shiftDateInput("2027-04-15", -60))
    expect(suggested.renewalReminderD30Date).toBe(shiftDateInput("2027-04-15", -30))
    expect(suggested.renewalReminderD15Date).toBe(shiftDateInput("2027-04-15", -15))
    expect(suggested.renewalReminderD60Time).toBe("09:00")
  })

  it("envia lembretes de renovação junto com o vencimento", () => {
    const payload = leadFormToAgendaFields({
      followUpDays: "",
      nextContactDate: "",
      nextContactTime: "09:00",
      nextContactType: "whatsapp",
      nextContactNotes: "",
      policyExpiresAt: "2027-04-15",
      renewalReminderD60Date: "2027-02-14",
      renewalReminderD60Time: "09:00",
      renewalReminderD30Date: "2027-03-16",
      renewalReminderD30Time: "09:00",
      renewalReminderD15Date: "2027-03-31",
      renewalReminderD15Time: "09:00",
    })
    expect(payload.renewalReminderD60).toBeTruthy()
    expect(payload.renewalReminderD30).toBeTruthy()
    expect(payload.renewalReminderD15).toBeTruthy()
  })
})

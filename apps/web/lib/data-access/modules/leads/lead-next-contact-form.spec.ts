import { describe, expect, it } from "vitest"

import {
  combineDateAndTime,
  leadFormToAgendaFields,
  NEXT_CONTACT_PRESET_CUSTOM,
  shiftDateInput,
  suggestRenewalReminderFields,
  applyPolicyExpiryChange,
  applyExplicitRenewalRecalculation,
  describeRenewalRecalculation,
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
    expect(shiftDateInput("2027-03-01", -15)).toBe("2027-02-14")
    expect(shiftDateInput("2027-01-10", -60)).toBe("2026-11-11")
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

  it("mantém data manual ao mudar o vencimento e recalcula só a sugestão", () => {
    const current = {
      policyExpiresAt: "2027-04-15",
      ...suggestRenewalReminderFields("2027-04-15"),
      renewalReminderD60Date: "2027-02-01",
      renewalReminderD60Time: "11:30",
    }
    const next = applyPolicyExpiryChange(current, "2027-05-15")
    expect(next.renewalReminderD60Date).toBe("2027-02-01")
    expect(next.renewalReminderD60Time).toBe("11:30")
    expect(next.renewalReminderD30Date).toBe(
      shiftDateInput("2027-05-15", -30),
    )
    expect(next.policyExpiresAt).toBe("2027-05-15")
  })

  it("envia null para remover um lembrete e o vencimento", () => {
    const payload = leadFormToAgendaFields({
      followUpDays: "",
      nextContactDate: "",
      nextContactTime: "09:00",
      nextContactType: "whatsapp",
      nextContactNotes: "",
      policyExpiresAt: "",
      renewalReminderD60Date: "2027-02-14",
      renewalReminderD60Time: "09:00",
      renewalReminderD30Date: "",
      renewalReminderD30Time: "09:00",
      renewalReminderD15Date: "",
      renewalReminderD15Time: "09:00",
    })
    expect(payload.policyExpiresAt).toBeNull()
    expect(payload.renewalReminderD60).toBeNull()
    expect(payload.nextContactAt).toBeNull()
  })

  it("não reativa D-60 desativado ao salvar outros campos ou mudar o vencimento", () => {
    const disabled = {
      followUpDays: "",
      nextContactDate: "2027-03-20",
      nextContactTime: "09:00",
      nextContactType: "call",
      nextContactNotes: "Outro campo",
      policyExpiresAt: "2027-04-15",
      renewalReminderD60Date: "",
      renewalReminderD60Time: "09:00",
      renewalReminderD60Mode: "disabled" as const,
      renewalReminderD30Date: "2027-03-16",
      renewalReminderD30Time: "09:00",
      renewalReminderD30Mode: "suggested" as const,
      renewalReminderD15Date: "2027-03-31",
      renewalReminderD15Time: "09:00",
      renewalReminderD15Mode: "suggested" as const,
    }
    const payload = leadFormToAgendaFields(disabled)
    expect(payload.renewalReminderD60).toBeNull()
    expect(payload.nextContactNotes).toBe("Outro campo")

    const shifted = applyPolicyExpiryChange(disabled, "2027-05-15")
    expect(shifted.renewalReminderD60Mode).toBe("disabled")
    expect(shifted.renewalReminderD60Date).toBe("")
    expect(shifted.renewalReminderD30Date).toBe(shiftDateInput("2027-05-15", -30))
  })

  it("preserva data manual e só recalcula depois da confirmação", () => {
    const current = {
      policyExpiresAt: "2027-04-15",
      ...suggestRenewalReminderFields("2027-04-15"),
      renewalReminderD60Date: "2027-02-01",
      renewalReminderD60Time: "11:30",
      renewalReminderD60Mode: "manual" as const,
      renewalReminderD30Mode: "suggested" as const,
      renewalReminderD15Mode: "suggested" as const,
    }
    const shifted = applyPolicyExpiryChange(current, "2027-06-15")
    expect(shifted.renewalReminderD60Date).toBe("2027-02-01")
    expect(shifted.renewalReminderD60Mode).toBe("manual")
    const preview = describeRenewalRecalculation(shifted)
    expect(preview[0]).toContain("D-60")
    expect(preview[0]).toContain("substituído")
    const recalculated = applyExplicitRenewalRecalculation(shifted)
    expect(recalculated.renewalReminderD60Mode).toBe("suggested")
    expect(recalculated.renewalReminderD60Date).toBe(
      shiftDateInput("2027-06-15", -60),
    )
  })

  it("omite lembrete concluído e envia null para o desativado", () => {
    const payload = leadFormToAgendaFields({
      followUpDays: "",
      nextContactDate: "",
      nextContactTime: "09:00",
      nextContactType: "whatsapp",
      nextContactNotes: "",
      policyExpiresAt: "2027-04-15",
      renewalReminderD60Date: "",
      renewalReminderD60Time: "09:00",
      renewalReminderD60Mode: "completed",
      renewalReminderD30Date: "",
      renewalReminderD30Time: "09:00",
      renewalReminderD30Mode: "disabled",
      renewalReminderD15Date: "2027-03-31",
      renewalReminderD15Time: "09:00",
      renewalReminderD15Mode: "suggested",
    })
    expect(payload.renewalReminderD60).toBeUndefined()
    expect(payload.renewalReminderD30).toBeNull()
    expect(payload.renewalReminderD15).toBeTruthy()
  })
})

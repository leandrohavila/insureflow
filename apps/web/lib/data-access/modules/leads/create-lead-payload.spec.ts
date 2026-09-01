import { describe, expect, it } from "vitest"

import { buildCreateLeadPayload } from "./create-lead-payload"

describe("buildCreateLeadPayload", () => {
  it("matches LeadDialog create shape without status", () => {
    expect(
      buildCreateLeadPayload({
        name: "Marina Costa",
        email: "marina@email.com",
        phone: "(11) 99999-9999",
        company: "Transportes Sul",
        source: "whatsapp",
        notes: "Interessada em auto",
        assignedTo: "Ana Costa",
      }),
    ).toEqual({
      name: "Marina Costa",
      email: "marina@email.com",
      phone: "(11) 99999-9999",
      company: "Transportes Sul",
      source: "whatsapp",
      notes: "Interessada em auto",
      assignedTo: "Ana Costa",
    })
  })

  it("omits empty optional fields", () => {
    expect(
      buildCreateLeadPayload({
        name: "Lead Teste",
        email: "",
        phone: "  ",
        assignedTo: "",
      }),
    ).toEqual({ name: "Lead Teste" })
  })

  it("includes document when provided", () => {
    expect(
      buildCreateLeadPayload({
        name: "Lead Teste",
        documentType: "cpf",
        document: "52998224725",
      }),
    ).toEqual({
      name: "Lead Teste",
      documentType: "cpf",
      document: "52998224725",
    })
  })

  it("includes follow-up scheduling when provided", () => {
    expect(
      buildCreateLeadPayload({
        name: "Lead Teste",
        followUpDays: 3,
        followUpType: "WHATSAPP",
      }),
    ).toEqual({
      name: "Lead Teste",
      followUpDays: 3,
      followUpType: "WHATSAPP",
    })
  })

  it("includes renewal opportunity fields when provided", () => {
    expect(
      buildCreateLeadPayload({
        name: "Lead Renovação",
        opportunityType: "renewal",
        currentInsurer: "Porto Seguro",
        currentPolicyNumber: "AP-123",
        policyExpiresAt: "2026-12-31",
      }),
    ).toEqual({
      name: "Lead Renovação",
      opportunityType: "renewal",
      currentInsurer: "Porto Seguro",
      currentPolicyNumber: "AP-123",
      policyExpiresAt: "2026-12-31",
    })
  })

  it("includes custom next contact datetime", () => {
    expect(
      buildCreateLeadPayload({
        name: "Bruna Lopes Coelho",
        nextContactAt: "2027-03-15T13:00:00.000Z",
        nextContactType: "whatsapp",
        nextContactNotes: "Conquistar apólice",
        renewalReminderD60: "2027-02-14T12:00:00.000Z",
      }),
    ).toEqual({
      name: "Bruna Lopes Coelho",
      nextContactAt: "2027-03-15T13:00:00.000Z",
      nextContactType: "whatsapp",
      nextContactNotes: "Conquistar apólice",
      renewalReminderD60: "2027-02-14T12:00:00.000Z",
    })
  })
})

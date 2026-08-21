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
})

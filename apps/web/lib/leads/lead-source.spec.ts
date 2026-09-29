import { describe, expect, it } from "vitest"

import { formatLeadSource, isManualLeadSource } from "./lead-source"

describe("formatLeadSource", () => {
  it.each([
    [null, "Cadastro Manual"],
    [undefined, "Cadastro Manual"],
    ["", "Cadastro Manual"],
    ["   ", "Cadastro Manual"],
    ["crm_manual", "Cadastro Manual"],
    ["public_portal", "Portal Imobiliário"],
    ["public_portal_home", "Portal Imobiliário"],
    ["whatsapp", "WhatsApp"],
    ["WhatsApp", "WhatsApp"],
    ["indicacao", "Indicação"],
    ["importacao", "Importação"],
    [" Instagram ", "Instagram"],
  ])("%p -> %p", (input, expected) => {
    expect(formatLeadSource(input)).toBe(expected)
  })
})

describe("isManualLeadSource", () => {
  it("identifica origem manual e vazia", () => {
    expect(isManualLeadSource(null)).toBe(true)
    expect(isManualLeadSource("crm_manual")).toBe(true)
    expect(isManualLeadSource("whatsapp")).toBe(false)
  })
})

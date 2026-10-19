import { describe, expect, it } from "vitest"

import { prefillLeadAnswers } from "./lead-answer-prefill"

const lead = {
  name: "Marina Costa",
  email: "marina@example.com",
  phone: "11988887777",
  company: "Acme",
  document: "52998224725",
  documentType: "cpf",
}

describe("prefillLeadAnswers", () => {
  it("preenche campos vazios compatíveis e não inventa nascimento ou veículo", () => {
    const answers = prefillLeadAnswers(
      [
        { key: "full_name" },
        { key: "cpf" },
        { key: "email" },
        { key: "phone" },
        { key: "company_name" },
        { key: "birth_date" },
        { key: "plate" },
      ],
      {},
      lead,
    )
    expect(answers).toEqual({
      full_name: "Marina Costa",
      cpf: "52998224725",
      email: "marina@example.com",
      phone: "11988887777",
      company_name: "Acme",
    })
  })

  it("preserva respostas já preenchidas e o rascunho", () => {
    const answers = prefillLeadAnswers(
      [{ key: "full_name" }, { key: "email" }, { key: "phone" }],
      { full_name: "Nome editado", email: "" },
      lead,
    )
    expect(answers.full_name).toBe("Nome editado")
    expect(answers.email).toBe("marina@example.com")
    expect(answers.phone).toBe("11988887777")
  })

  it('não copia CPF para um lead de CNPJ', () => {
    const answers = prefillLeadAnswers(
      [{ key: "cpf" }, { key: "cnpj" }],
      {},
      { ...lead, documentType: "cnpj", document: "12345678000199" },
    )
    expect(answers.cpf).toBeUndefined()
    expect(answers.cnpj).toBe("12345678000199")
  })

  it("não preenche CPF e CNPJ juntos quando o tipo é desconhecido", () => {
    const cpf = prefillLeadAnswers(
      [{ key: "cpf" }, { key: "cnpj" }],
      {},
      { document: "529.982.247-25" },
    )
    expect(cpf.cpf).toBe("529.982.247-25")
    expect(cpf.cnpj).toBeUndefined()

    const unknown = prefillLeadAnswers(
      [{ key: "cpf" }, { key: "cnpj" }],
      {},
      { document: "1234" },
    )
    expect(unknown.cpf).toBeUndefined()
    expect(unknown.cnpj).toBeUndefined()
  })

  it("mantém vazio o campo que o rascunho já gravou", () => {
    const answers = prefillLeadAnswers(
      [{ key: "email" }, { key: "phone" }],
      { email: "", phone: "" },
      lead,
      new Set(["email"]),
    )
    expect(answers.email).toBe("")
    expect(answers.phone).toBe("11988887777")
  })
})

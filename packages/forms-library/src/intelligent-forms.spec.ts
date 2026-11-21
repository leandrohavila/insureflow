import { RuleEngine, ValidationEngine, createServerValidationContext, fieldsToDescriptors } from "@repo/forms-engine"

import {
  getIntelligentForm,
  intelligentFormFingerprint,
  listIntelligentForms,
} from "./intelligent-forms"

const rules = new RuleEngine()
const validation = new ValidationEngine()

function descriptors(branch: "auto" | "residencial" | "empresarial") {
  const form = getIntelligentForm(branch)
  return fieldsToDescriptors(
    form.fields.map((field) => ({
      ...field,
      settings: { section: field.sectionKey },
    })),
  )
}

function visibility(
  branch: "auto" | "residencial" | "empresarial",
  answers: Record<string, unknown>,
) {
  const form = getIntelligentForm(branch)
  return rules.evaluateSubmission({
    template: {
      name: form.name,
      settings: { engineVersion: 2, rules: form.rules },
      fields: descriptors(branch),
    },
    answers,
  })
}

function finalize(
  branch: "auto" | "residencial" | "empresarial",
  answers: Record<string, unknown>,
) {
  const form = getIntelligentForm(branch)
  const fields = descriptors(branch)
  const state = visibility(branch, answers)
  return validation.validateSubmission(
    fields,
    answers,
    createServerValidationContext(answers, {
      mode: "finalize",
      profile: "v2",
      enforceRequired: true,
      visibleFieldKeys: state.visibleFieldKeys,
      requiredFieldKeys: state.requiredFieldKeys,
      optionalFieldKeys: state.optionalFieldKeys,
    }),
  )
}

describe("formulários inteligentes", () => {
  it("publica três questionários em seis seções, com minoria de campos essenciais", () => {
    const forms = listIntelligentForms()
    expect(forms.map((form) => form.branch)).toEqual([
      "auto",
      "residencial",
      "empresarial",
    ])
    for (const form of forms) {
      expect(form.sections).toHaveLength(6)
      const keys = form.fields.map((field) => field.key)
      expect(new Set(keys).size).toBe(keys.length)
      const required = form.fields.filter((field) => field.required)
      expect(required.length).toBeGreaterThan(0)
      expect(required.length).toBeLessThan(form.fields.length / 2)
    }
    expect(getIntelligentForm("auto").sections.map((section) => section.title)).toEqual([
      "Dados do veículo",
      "Condutor",
      "Utilização",
      "Garagem e pernoite",
      "Histórico",
      "Coberturas",
    ])
    expect(getIntelligentForm("residencial").sections.map((section) => section.title)).toEqual([
      "Dados do imóvel",
      "Endereço do risco",
      "Valores",
      "Proteção",
      "Histórico",
      "Coberturas",
    ])
    expect(getIntelligentForm("empresarial").sections.map((section) => section.title)).toEqual([
      "Empresa",
      "Estabelecimento",
      "Operação",
      "Bens e valores",
      "Proteção e histórico",
      "Coberturas",
    ])
  })

  it("oculta placa, chassi, seguradora e aplicativos até a resposta correspondente", () => {
    const hidden = visibility("auto", {})
    expect(hidden.visibleFieldKeys.has("plate")).toBe(false)
    expect(hidden.visibleFieldKeys.has("chassis")).toBe(false)
    expect(hidden.visibleFieldKeys.has("current_insurer")).toBe(false)
    expect(hidden.visibleFieldKeys.has("ride_apps")).toBe(false)
    expect(hidden.visibleFieldKeys.has("brand")).toBe(true)

    const used = visibility("auto", { vehicle_condition: "used", needs_chassis: "yes" })
    expect(used.visibleFieldKeys.has("plate")).toBe(true)
    expect(used.requiredFieldKeys.has("plate")).toBe(true)
    expect(used.requiredFieldKeys.has("chassis")).toBe(true)

    const commercial = visibility("auto", {
      use_purpose: "commercial",
      has_insurance: "yes",
    })
    expect(commercial.visibleFieldKeys.has("ride_apps")).toBe(true)
    expect(commercial.visibleFieldKeys.has("garage_work")).toBe(true)
    expect(commercial.requiredFieldKeys.has("current_insurer")).toBe(true)
  })

  it("pede a placa só no usado e aceita rascunho sem os essenciais", () => {
    const missingPlate = finalize("auto", {
      brand: "Fiat",
      model: "Uno",
      manufacture_year: 2020,
      model_year: 2020,
      vehicle_condition: "used",
      driver_name: "Ana",
      driver_cpf: "529.982.247-25",
      driver_birth_date: "1990-01-01",
      driver_relationship: "self",
      use_purpose: "particular",
      garage_home: "yes",
      parking_place: "home",
      has_insurance: "no",
      renewal_type: "new",
      coverage_desired: "comprehensive",
    })
    expect(missingPlate.valid).toBe(false)
    expect(missingPlate.errors.some((error) => error.fieldKey === "plate")).toBe(true)

    const zeroKm = finalize("auto", {
      brand: "Fiat",
      model: "Uno",
      manufacture_year: 2026,
      model_year: 2026,
      vehicle_condition: "new",
      driver_name: "Ana",
      driver_cpf: "529.982.247-25",
      driver_birth_date: "1990-01-01",
      driver_relationship: "self",
      use_purpose: "particular",
      garage_home: "yes",
      parking_place: "home",
      has_insurance: "no",
      renewal_type: "new",
      coverage_desired: "comprehensive",
    })
    expect(zeroKm.errors.some((error) => error.fieldKey === "plate")).toBe(false)
    expect(zeroKm.valid).toBe(true)
  })

  it("condiciona bens, estoque e seguradora nos outros ramos", () => {
    const home = visibility("residencial", {})
    expect(home.visibleFieldKeys.has("special_assets_description")).toBe(false)
    expect(home.visibleFieldKeys.has("current_insurer")).toBe(false)
    const homeOpen = visibility("residencial", {
      special_assets: "yes",
      has_insurance: "yes",
    })
    expect(homeOpen.visibleFieldKeys.has("special_assets_description")).toBe(true)
    expect(homeOpen.requiredFieldKeys.has("current_insurer")).toBe(true)

    const business = visibility("empresarial", {})
    expect(business.visibleFieldKeys.has("stock_description")).toBe(false)
    expect(business.visibleFieldKeys.has("value_stock")).toBe(false)
    const withStock = visibility("empresarial", { has_stock: "yes", has_insurance: "yes" })
    expect(withStock.visibleFieldKeys.has("value_stock")).toBe(true)
    expect(withStock.requiredFieldKeys.has("current_insurer")).toBe(true)
  })

  it("mantém a impressão digital estável", () => {
    const form = getIntelligentForm("empresarial")
    expect(intelligentFormFingerprint(form)).toBe(intelligentFormFingerprint(form))
    expect(form.fields.some((field) => field.key === "cnpj" && field.required)).toBe(true)
  })
})

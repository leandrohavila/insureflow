import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"

import { IntelligentFormStep } from "@/components/questionnaires/intelligent-form-step"
import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import { getIntelligentForm } from "@repo/forms-library"

import {
  adjacentStep,
  buildIntelligentSteps,
  errorsForFields,
  retainAnswer,
  stepProgress,
  visibleIntelligentFields,
} from "./intelligent-form-flow"

function asFields(
  branch: "auto" | "residencial" | "empresarial",
): QuestionnaireField[] {
  const form = getIntelligentForm(branch)
  return form.fields.map((field) => ({
    id: field.key,
    tenantId: "tenant-1",
    templateId: "tpl-1",
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    order: field.order,
    options: field.options ?? null,
    validation: field.validation ?? null,
    settings: {
      section: field.sectionKey,
      sectionTitle: field.sectionTitle,
      ...(field.mask ? { mask: field.mask } : {}),
    },
  }))
}

const autoTemplate = {
  name: "Questionário Automóvel",
  settings: {
    engineVersion: 2,
    rules: getIntelligentForm("auto").rules,
  },
}

describe("fluxo do formulário inteligente", () => {
  it("divide o automóvel em etapas e conserva a resposta ao voltar", () => {
    const steps = buildIntelligentSteps(asFields("auto"))
    expect(steps.map((step) => step.title)).toEqual([
      "Dados do veículo",
      "Condutor",
      "Utilização",
      "Garagem e pernoite",
      "Histórico",
      "Coberturas",
    ])
    expect(buildIntelligentSteps(asFields("residencial"))).toHaveLength(6)
    expect(buildIntelligentSteps(asFields("empresarial"))).toHaveLength(6)

    const started = retainAnswer({}, "brand", "Fiat")
    const next = retainAnswer(started, "model", "Uno")
    expect(adjacentStep(2, steps.length, "back")).toBe(1)
    expect(adjacentStep(0, steps.length, "back")).toBe(0)
    expect(adjacentStep(5, steps.length, "next")).toBe(5)
    expect(next).toEqual({ brand: "Fiat", model: "Uno" })
    expect(stepProgress(0, 6).label).toBe("Etapa 1 de 6")
  })

  it("omite a placa até o veículo usado e limita o erro à etapa", () => {
    const fields = asFields("auto")
    const hidden = visibleIntelligentFields(autoTemplate, fields, {})
    expect(hidden.fields.some((field) => field.key === "plate")).toBe(false)
    const used = visibleIntelligentFields(autoTemplate, fields, {
      vehicle_condition: "used",
    })
    expect(used.fields.some((field) => field.key === "plate")).toBe(true)
    expect(used.requiredKeys.has("plate")).toBe(true)

    const steps = buildIntelligentSteps(fields)
    const vehicle = steps[0]
    if (!vehicle) throw new Error("etapa ausente")
    const visible = visibleIntelligentFields(autoTemplate, vehicle.fields, {})
    const errors = errorsForFields(
      { brand: "Informe a marca", driver_name: "Informe o condutor" },
      visible.fields,
    )
    expect(errors).toEqual({ brand: "Informe a marca" })

    const html = renderToStaticMarkup(
      createElement(IntelligentFormStep, {
        title: "Questionário Automóvel",
        progressLabel: "Etapa 1 de 6",
        percent: 17,
        sectionTitle: vehicle.title,
        fields: visible.fields.filter((field) => field.key === "brand"),
        answers: {},
        errors,
        requiredKeys: new Set(["brand"]),
        isFirst: true,
        isLast: false,
        isBusy: false,
        onAnswer: () => undefined,
        onBack: () => undefined,
        onNext: () => undefined,
        onSaveDraft: () => undefined,
        onComplete: () => undefined,
      }),
    )
    expect(html).toContain("Dados do veículo")
    expect(html).toContain("Marca")
    expect(html).toContain("Informe a marca")
    expect(html).toContain("Etapa 1 de 6")
    expect(html).not.toContain("Placa")
    expect(html).toContain("Salvar rascunho")
    expect(html).toContain("Avançar")
  })
})

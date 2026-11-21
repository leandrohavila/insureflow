import { describe, expect, it } from "vitest"

import {
  questionnaireBranchLabel,
  questionnaireCanContinue,
  questionnaireFillOriginLabel,
} from "./lead-questionnaire-summary"

describe("lead questionnaire summary", () => {
  it("nomeia os três ramos iniciais e ignora produto fora do recorte", () => {
    expect(questionnaireBranchLabel("auto")).toBe("Automóvel")
    expect(questionnaireBranchLabel("residencial")).toBe("Residencial")
    expect(questionnaireBranchLabel("empresarial")).toBe("Empresarial")
    expect(questionnaireBranchLabel("vida")).toBeNull()
  })

  it("distingue preenchimento do corretor e do cliente", () => {
    expect(questionnaireFillOriginLabel("INTERNAL")).toBe("Corretor")
    expect(questionnaireFillOriginLabel("EXTERNAL")).toBe("Cliente")
  })

  it("só continua rascunho ou preenchimento em andamento", () => {
    expect(questionnaireCanContinue("draft")).toBe(true)
    expect(questionnaireCanContinue("in_progress")).toBe(true)
    expect(questionnaireCanContinue("completed")).toBe(false)
    expect(questionnaireCanContinue("pending_client")).toBe(false)
  })
})

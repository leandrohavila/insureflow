/**
 * Homologação — clareza Lead × Negócio × Pipeline.
 *
 * Rode:
 *   node --test --experimental-strip-types apps/web/lib/leads/lead-pipeline-clarity.validation.spec.ts apps/web/lib/crm/conversion-timeline.spec.ts
 *
 * Cenário A: lead sem negócio → "Não convertido" e CTA de conversão.
 * Cenário B: lead com negócio → "Negócio criado" e estágio.
 * Cenário C: zero negócios e leads vivos → empty state com "Ir para Leads".
 * Cenário D: negócio convertido entra na coluna "Novo Lead".
 */
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { stageLabelMap } from "../data-access/modules/crm/constants.ts"
import {
  LEAD_OPPORTUNITY_PIPELINE_HINT,
  leadPipelinePresentation,
  pipelineEmptyGuidance,
  unconvertedLeadCount,
} from "./lead-pipeline-clarity.ts"

describe("homologação — pipeline comercial", () => {
  it("cenário A: lead criado e não convertido", () => {
    const view = leadPipelinePresentation({
      dealId: null,
      status: "new",
    })
    assert.equal(view.statusLabel, "Não convertido")
    assert.equal(view.converted, false)
    assert.equal(view.stageLabel, null)
    assert.equal(view.showConvert, true)
    assert.equal(view.showOpenDeal, false)
  })

  it("cenário B: lead convertido mostra negócio e estágio", () => {
    const stage = stageLabelMap.cotacao
    const view = leadPipelinePresentation(
      { dealId: "deal-1", status: "converted" },
      stage,
    )
    assert.equal(view.statusLabel, "Negócio criado")
    assert.equal(view.stageLabel, "Cotação")
    assert.equal(view.showConvert, false)
    assert.equal(view.showOpenDeal, true)
  })

  it("cenário C: pipeline vazio com leads vivos orienta a conversão", () => {
    const count = unconvertedLeadCount({
      new: 2,
      contacted: 0,
      qualified: 0,
      converted: 0,
    })
    const guidance = pipelineEmptyGuidance({
      dealCount: 0,
      unconvertedLeadCount: count,
    })
    assert.ok(guidance)
    assert.equal(guidance.title, "Você possui 2 leads ainda não convertidos.")
    assert.equal(
      guidance.body,
      "Converta um lead para criar seu primeiro negócio.",
    )
    assert.equal(guidance.actionLabel, "Ir para Leads")
    assert.equal(guidance.href, "/leads")
  })

  it("não mostra empty state quando já existe negócio", () => {
    assert.equal(
      pipelineEmptyGuidance({ dealCount: 1, unconvertedLeadCount: 2 }),
      null,
    )
  })

  it("cenário D: conversão padrão entra na coluna Novo Lead", () => {
    assert.equal(stageLabelMap.novo, "Novo Lead")
    const view = leadPipelinePresentation(
      { dealId: "deal-2", status: "converted" },
      stageLabelMap.novo,
    )
    assert.equal(view.stageLabel, "Novo Lead")
  })

  it("explica tipo de oportunidade sem confundir com o estágio do negócio", () => {
    assert.match(LEAD_OPPORTUNITY_PIPELINE_HINT, /classifica o lead/)
    assert.match(LEAD_OPPORTUNITY_PIPELINE_HINT, /converter o lead em negócio/)
  })
})

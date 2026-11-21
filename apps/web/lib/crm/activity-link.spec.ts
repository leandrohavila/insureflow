import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  activityRelationFromLink,
  initialActivityLink,
} from "./activity-link.ts"

describe("vínculo da atividade", () => {
  it("não envia id sem seleção", () => {
    assert.deepEqual(activityRelationFromLink(null), {})
  })

  it("preenche somente o id do tipo escolhido", () => {
    assert.deepEqual(
      activityRelationFromLink({
        kind: "customer",
        id: "cus_1",
        title: "Ana",
      }),
      { customerId: "cus_1" },
    )
    assert.deepEqual(
      activityRelationFromLink({
        kind: "policy",
        id: "pol_1",
        title: "123",
      }),
      { policyId: "pol_1" },
    )
  })

  it("prioriza negócio quando a atividade já tem mais de um vínculo", () => {
    assert.equal(
      initialActivityLink({ leadId: "lead_1", dealId: "deal_1" })?.kind,
      "deal",
    )
  })

  it("respeita a preferência do contexto quando os dois vínculos existem", () => {
    assert.equal(
      initialActivityLink({
        leadId: "lead_1",
        dealId: "deal_1",
        preference: "lead",
        title: "Homolog",
      })?.kind,
      "lead",
    )
    assert.equal(
      initialActivityLink({
        leadId: "lead_1",
        dealId: "deal_1",
        preference: "lead",
        title: "Homolog",
      })?.title,
      "Homolog",
    )
  })
})

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildCampaignUpdatePayload,
  canEditReactivationCampaign,
  COMMERCIAL_AUTO_REFRESH_MS,
  REACTIVATION_CAMPAIGNS_PATH,
  REACTIVATION_CAMPAIGNS_PT_ALIAS,
  reactivationCampaignPath,
  resolveReactivationCampaignAlias,
} from "./reactivation-campaigns.ts"

describe("edição de campanha", () => {
  it("permite editar somente DRAFT", () => {
    assert.equal(canEditReactivationCampaign("DRAFT"), true)
    assert.equal(canEditReactivationCampaign("IN_PROGRESS"), false)
    assert.equal(canEditReactivationCampaign("FINISHED"), false)
  })

  it("monta payload do PATCH com trim", () => {
    assert.deepEqual(
      buildCampaignUpdatePayload({
        name: "  Reativação Q3  ",
        description: "  Leads sem retorno  ",
        ownerUserId: "  user-9  ",
      }),
      {
        name: "Reativação Q3",
        description: "Leads sem retorno",
        ownerUserId: "user-9",
      },
    )
  })
})

describe("auto refresh", () => {
  it("usa o intervalo de 30s da Agenda Comercial", () => {
    assert.equal(COMMERCIAL_AUTO_REFRESH_MS, 30_000)
  })
})

describe("alias PT-BR", () => {
  it("redireciona a lista sem duplicar página", () => {
    assert.equal(
      resolveReactivationCampaignAlias(REACTIVATION_CAMPAIGNS_PT_ALIAS),
      REACTIVATION_CAMPAIGNS_PATH,
    )
    assert.equal(
      resolveReactivationCampaignAlias("/crm/campanhas-reativacao/"),
      "/crm/campaigns/reactivation",
    )
  })

  it("redireciona deep link para o detalhe canônico", () => {
    assert.equal(
      resolveReactivationCampaignAlias("/crm/campanhas-reativacao/camp-1"),
      reactivationCampaignPath("camp-1"),
    )
    assert.equal(
      resolveReactivationCampaignAlias("/crm/campaigns/reactivation"),
      null,
    )
  })
})

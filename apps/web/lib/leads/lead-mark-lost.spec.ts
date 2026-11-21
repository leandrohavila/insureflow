/**
 * CRM-01 — marcar lead como perdido no fluxo padrão.
 *
 *   node --test --experimental-strip-types apps/web/lib/leads/lead-mark-lost.spec.ts
 */
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildMarkLeadLostInput,
  canMarkLeadAsLost,
  resolveActiveLossReason,
} from "./lead-mark-lost.ts"

const activeReason = {
  id: "reason-1",
  isActive: true,
  name: "Sem orçamento",
  reactivationEnabled: true,
  reactivationDays: 30,
}

const inactiveReason = {
  id: "reason-off",
  isActive: false,
  name: "Motivo antigo",
  reactivationEnabled: false,
  reactivationDays: 0,
}

describe("canMarkLeadAsLost", () => {
  it("permite lead ainda no funil", () => {
    assert.equal(canMarkLeadAsLost({ status: "new", dealId: null }), true)
    assert.equal(canMarkLeadAsLost({ status: "qualified" }), true)
  })

  it("não oferece a ação para lead perdido, convertido ou com negócio", () => {
    assert.equal(canMarkLeadAsLost({ status: "lost", dealId: null }), false)
    assert.equal(
      canMarkLeadAsLost({ status: "converted", dealId: null }),
      false,
    )
    assert.equal(
      canMarkLeadAsLost({ status: "qualified", dealId: "deal-1" }),
      false,
    )
    assert.equal(canMarkLeadAsLost(null), false)
  })
})

describe("buildMarkLeadLostInput", () => {
  it("confirma somente com motivo informado", () => {
    assert.deepEqual(buildMarkLeadLostInput(" reason-1 "), {
      status: "lost",
      lossReasonId: "reason-1",
    })
  })

  it("não confirma sem motivo", () => {
    assert.equal(buildMarkLeadLostInput(""), null)
    assert.equal(buildMarkLeadLostInput("   "), null)
  })

  it("envia apenas status e motivo", () => {
    const input = buildMarkLeadLostInput("reason-1")
    assert.deepEqual(Object.keys(input ?? {}).sort(), [
      "lossReasonId",
      "status",
    ])
  })
})

describe("resolveActiveLossReason", () => {
  it("aceita motivo ativo e recusa inativo ou desconhecido", () => {
    const reasons = [activeReason, inactiveReason]
    assert.equal(resolveActiveLossReason(reasons, "reason-1")?.id, "reason-1")
    assert.equal(resolveActiveLossReason(reasons, "reason-off"), null)
    assert.equal(resolveActiveLossReason(reasons, "missing"), null)
    assert.equal(resolveActiveLossReason(reasons, ""), null)
  })
})

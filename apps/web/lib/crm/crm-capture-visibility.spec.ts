import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  hasAnyCrmCaptureAction,
  resolveCrmCaptureVisibility,
} from "./crm-capture-visibility.ts"

describe("resolveCrmCaptureVisibility", () => {
  it("shows all three CTAs when both manage permissions are present", () => {
    assert.deepEqual(
      resolveCrmCaptureVisibility({
        canManageLeads: true,
        canManageCrm: true,
      }),
      {
        showLeadInsurance: true,
        showLeadRealEstate: true,
        showDeal: true,
      },
    )
  })

  it("does not hide lead CTAs when crm:manage is absent", () => {
    const visibility = resolveCrmCaptureVisibility({
      canManageLeads: true,
      canManageCrm: false,
    })
    assert.equal(visibility.showLeadInsurance, true)
    assert.equal(visibility.showLeadRealEstate, true)
    assert.equal(visibility.showDeal, false)
    assert.equal(hasAnyCrmCaptureAction(visibility), true)
  })

  it("does not hide + Novo Negócio when leads:manage is absent", () => {
    const visibility = resolveCrmCaptureVisibility({
      canManageLeads: false,
      canManageCrm: true,
    })
    assert.equal(visibility.showLeadInsurance, false)
    assert.equal(visibility.showLeadRealEstate, false)
    assert.equal(visibility.showDeal, true)
    assert.equal(hasAnyCrmCaptureAction(visibility), true)
  })

  it("hides the group only when both manage permissions are absent", () => {
    const visibility = resolveCrmCaptureVisibility({
      canManageLeads: false,
      canManageCrm: false,
    })
    assert.equal(hasAnyCrmCaptureAction(visibility), false)
  })
})

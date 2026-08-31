import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  CRM_CAPTURE_ACTION_ORDER,
  CRM_CREATE_DEAL_HREF,
  CRM_CREATE_LEAD_INSURANCE_HREF,
  CRM_CREATE_LEAD_REAL_ESTATE_HREF,
  hrefForLeadCreateIntent,
} from "./crm-create-navigation.ts"

describe("crm capture navigation", () => {
  it("keeps Dashboard / Leads / Pipeline destinations aligned", () => {
    assert.deepEqual(CRM_CAPTURE_ACTION_ORDER, [
      "lead-insurance",
      "lead-real-estate",
      "deal",
    ])
    assert.equal(CRM_CREATE_LEAD_INSURANCE_HREF, "/leads?create=insurance")
    assert.equal(CRM_CREATE_LEAD_REAL_ESTATE_HREF, "/leads?create=real-estate")
    assert.equal(CRM_CREATE_DEAL_HREF, "/crm/negocios?create=deal")
  })

  it("maps lead intent to the same deep links used by the header CTAs", () => {
    assert.equal(
      hrefForLeadCreateIntent("insurance"),
      CRM_CREATE_LEAD_INSURANCE_HREF,
    )
    assert.equal(
      hrefForLeadCreateIntent("real-estate"),
      CRM_CREATE_LEAD_REAL_ESTATE_HREF,
    )
  })
})

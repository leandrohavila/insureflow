import { describe, expect, it, vi } from "vitest"

import { resetLeadSaveMutations } from "./lead-dialog-mutations"

describe("resetLeadSaveMutations", () => {
  it("resets create and update mutations", () => {
    const createLead = { reset: vi.fn() }
    const updateLead = { reset: vi.fn() }

    resetLeadSaveMutations(createLead, updateLead)

    expect(createLead.reset).toHaveBeenCalledTimes(1)
    expect(updateLead.reset).toHaveBeenCalledTimes(1)
  })
})

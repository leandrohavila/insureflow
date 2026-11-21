import { describe, expect, it } from "vitest"

import {
  crmBadgeClass,
  crmFilterCardClass,
  crmFilterChipClass,
  crmStatCardClass,
} from "./crm-controls"

describe("crm cards and badges", () => {
  it("keeps the filter card at 12px padding with the Ávila border", () => {
    expect(crmFilterCardClass).toContain("p-3!")
    expect(crmFilterCardClass).toContain("border-[#D6CFC4]")
    expect(crmFilterCardClass).toContain("bg-white")
  })

  it("reinforces stat card padding against the global reset", () => {
    expect(crmStatCardClass).toContain("px-4!")
    expect(crmStatCardClass).toContain("py-3!")
  })

  it("keeps badge padding important and maps tones", () => {
    expect(crmBadgeClass("danger")).toContain("px-2.5!")
    expect(crmBadgeClass("danger")).toContain("text-[#9F2D2D]")
    expect(crmBadgeClass("success")).toContain("text-[#1F6B3A]")
  })
})

describe("crm filter chip", () => {
  it("uses the agenda height and the navy selected state", () => {
    expect(crmFilterChipClass(true)).toContain("h-9")
    expect(crmFilterChipClass(true)).toContain("gap-2")
    expect(crmFilterChipClass(true)).toContain("px-3.5!")
    expect(crmFilterChipClass(true)).toContain("shrink-0")
    expect(crmFilterChipClass(true)).toContain("bg-[#10294B]")
    expect(crmFilterChipClass(false)).toContain("bg-white")
    expect(crmFilterChipClass(false)).toContain("border-[#D6CFC4]")
  })
})

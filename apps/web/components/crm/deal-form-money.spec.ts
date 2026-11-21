import { describe, expect, it } from "vitest"

import {
  formatDealValueFromNumber,
  maskDealValue,
  parseDealValue,
} from "./deal-form-money"

const brl = (amount: string) => `R$ ${amount}`

describe("deal form money mask", () => {
  it("formats an existing deal value with cents", () => {
    expect(formatDealValueFromNumber(100)).toBe(brl("100,00"))
    expect(formatDealValueFromNumber(1250.5)).toBe(brl("1.250,50"))
    expect(formatDealValueFromNumber(67000)).toBe(brl("67.000,00"))
    expect(formatDealValueFromNumber(2500.5)).toBe(brl("2.500,50"))
  })

  it("formats thousands while typing and keeps a trailing comma", () => {
    expect(maskDealValue("67000")).toBe(brl("67.000"))
    expect(maskDealValue("67000,")).toBe(brl("67.000,"))
    expect(maskDealValue("67000,5")).toBe(brl("67.000,5"))
    expect(maskDealValue("R$ 67.000,50")).toBe(brl("67.000,50"))
  })

  it("accepts a pasted decimal point as cents and thousand dots as grouping", () => {
    expect(maskDealValue("67000.5")).toBe(brl("67.000,5"))
    expect(maskDealValue("67.000")).toBe(brl("67.000"))
    expect(maskDealValue("1.234.567,89")).toBe(brl("1.234.567,89"))
  })

  it("parses the display back to the number sent to the API", () => {
    expect(parseDealValue(brl("67.000,00"))).toBe(67000)
    expect(parseDealValue(brl("67.000,50"))).toBe(67000.5)
    expect(parseDealValue("67.000")).toBe(67000)
    expect(parseDealValue("")).toBeNull()
  })

  it("drops extra decimals and lets backspace clear the field", () => {
    expect(maskDealValue("10,999")).toBe(brl("10,99"))
    expect(maskDealValue("R$")).toBe("")
    expect(maskDealValue("0")).toBe(brl("0"))
  })
})

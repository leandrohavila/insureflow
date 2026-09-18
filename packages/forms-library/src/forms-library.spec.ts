import {
  getBlockDefinition,
  instantiateBlock,
  mergeTemplateRules,
  searchBlocks,
  searchFields,
} from "./index"

describe("forms-library catalog", () => {
  it("indexes all field and block definitions", () => {
    expect(searchFields().length).toBeGreaterThan(20)
    expect(searchBlocks().length).toBeGreaterThan(15)
  })

  it("filters fields by product and category", () => {
    const autoVehicleFields = searchFields({
      product: "auto",
      category: "veiculos",
    })
    expect(autoVehicleFields.some((field) => field.id === "auto.plate")).toBe(true)
  })

  it("filters blocks by product", () => {
    const autoBlocks = searchBlocks({ product: "auto" })
    expect(autoBlocks.some((block) => block.id === "auto.block.vehicle")).toBe(true)
  })
})

describe("instantiateBlock", () => {
  it("materializes block fields with unique keys", () => {
    const block = getBlockDefinition("auto.block.vehicle")
    expect(block).toBeDefined()

    const result = instantiateBlock({
      block: block!,
      existingKeys: ["vehicle_plate"],
      orderStart: 100,
    })

    expect(result.fields.length).toBe(6)
    expect(result.fields[0]?.order).toBe(100)
    expect(result.fields.some((field) => field.key === "vehicle_plate_2")).toBe(true)
    expect(result.fields.every((field) => field.settings.section === "Veículo")).toBe(
      true,
    )
  })

  it("includes default rules for second driver block", () => {
    const block = getBlockDefinition("auto.block.second_driver")
    const result = instantiateBlock({ block: block! })

    expect(result.rules.length).toBe(1)
    expect(result.rules[0]?.conditions[0]).toMatchObject({
      fieldKey: "has_second_driver",
      operator: "equals",
      value: true,
    })
  })

  it("merges template rules without duplicates", () => {
    const existing = [{ id: "rule_a", name: "A", enabled: true, conditions: [], actions: [] }]
    const incoming = [
      { id: "rule_a", name: "Dup", enabled: true, conditions: [], actions: [] },
      { id: "rule_b", name: "B", enabled: true, conditions: [], actions: [] },
    ]
    const merged = mergeTemplateRules(existing, incoming)
    expect(merged).toHaveLength(2)
    expect(merged.some((rule) => rule.id === "rule_b")).toBe(true)
  })
})

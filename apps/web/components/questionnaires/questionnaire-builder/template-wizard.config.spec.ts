import { describe, expect, it } from "vitest"

import {
  computeWizardBlueprintStats,
  defaultSelectedModuleIds,
  resolveWizardBlocks,
} from "./template-wizard.config"

describe("template-wizard.config", () => {
  it("selects default auto modules", () => {
    const ids = defaultSelectedModuleIds("auto")
    expect(ids).toContain("personal")
    expect(ids).toContain("vehicle")
    expect(ids).toContain("main_driver")
    expect(ids).not.toContain("second_driver")
  })

  it("resolves blocks for selected auto modules", () => {
    const blocks = resolveWizardBlocks("auto", ["personal", "vehicle"])
    expect(blocks.length).toBe(2)
    expect(blocks.map((block) => block.label)).toEqual(
      expect.arrayContaining(["Dados Pessoais", "Veículo"]),
    )
  })

  it("computes blueprint stats for smart auto template", () => {
    const stats = computeWizardBlueprintStats("auto", defaultSelectedModuleIds("auto"))
    expect(stats.questionCount).toBeGreaterThan(0)
    expect(stats.sectionCount).toBeGreaterThan(0)
    expect(stats.blockLabels.length).toBeGreaterThan(0)
  })

  it("returns empty blueprint for personalizado branch", () => {
    const stats = computeWizardBlueprintStats("personalizado", [])
    expect(stats.questionCount).toBe(0)
    expect(stats.blockLabels).toEqual([])
  })
})

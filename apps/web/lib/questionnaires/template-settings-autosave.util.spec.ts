import { describe, expect, it } from "vitest"

import {
  hashSettings,
  settingsPayloadsEqual,
  stableStringify,
} from "./template-settings-autosave.util"

describe("template-settings-autosave.util", () => {
  it("stableStringify ignora ordem de chaves", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }))
  })

  it("settingsPayloadsEqual compara conteúdo profundo", () => {
    const left = { rules: [{ id: "r1" }], engineVersion: 2 }
    const right = { engineVersion: 2, rules: [{ id: "r1" }] }
    expect(settingsPayloadsEqual(left, right)).toBe(true)
  })

  it("hashSettings muda quando o conteúdo muda", () => {
    const baseline = hashSettings({ questionnaireSections: ["A"] })
    const next = hashSettings({ questionnaireSections: ["A", "B"] })
    expect(baseline).not.toBe(next)
  })
})

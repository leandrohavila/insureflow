import { describe, expect, it } from "vitest"

import {
  readStoredPreviewMode,
  resolvePreviewSectionIndex,
} from "./preview-layout"

const sections = ["Dados pessoais", "Veículo", "Coberturas"]

describe("resolvePreviewSectionIndex", () => {
  it("keeps the current section when it still exists", () => {
    expect(resolvePreviewSectionIndex(sections, "Veículo", "Dados pessoais")).toBe(
      1,
    )
  })

  it("falls back to the stored section after the current one is removed", () => {
    expect(resolvePreviewSectionIndex(sections, "Removida", "Coberturas")).toBe(2)
  })

  it("returns the first page when nothing matches", () => {
    expect(resolvePreviewSectionIndex(sections, null, "Inexistente")).toBe(0)
    expect(resolvePreviewSectionIndex([], "Veículo", "Veículo")).toBe(0)
  })
})

describe("readStoredPreviewMode", () => {
  it("restores a saved layout and ignores fullscreen", () => {
    expect(readStoredPreviewMode("expanded", false)).toBe("expanded")
    expect(readStoredPreviewMode("collapsed", true)).toBe("collapsed")
    expect(readStoredPreviewMode("fullscreen", true)).toBe("docked")
  })

  it("docks the preview on wide screens when there is no preference", () => {
    expect(readStoredPreviewMode(null, true)).toBe("docked")
    expect(readStoredPreviewMode(null, false)).toBe("collapsed")
  })
})

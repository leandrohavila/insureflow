export type BuilderPreviewMode = "docked" | "expanded" | "collapsed" | "fullscreen"

export const BUILDER_PREVIEW_MODE_KEY =
  "insureflow:questionnaire-builder:preview-mode"

export function previewSectionStorageKey(templateId: string) {
  return `insureflow:questionnaire-builder:preview-section:${templateId}`
}

/**
 * Keeps the preview on the section the user was validating.
 * Current selection wins while it still exists; otherwise the stored section; otherwise the first page.
 */
export function resolvePreviewSectionIndex(
  sections: readonly string[],
  currentSection: string | null | undefined,
  storedSection: string | null | undefined,
): number {
  if (sections.length === 0) return 0

  if (currentSection) {
    const currentIndex = sections.indexOf(currentSection)
    if (currentIndex >= 0) return currentIndex
  }

  if (storedSection) {
    const storedIndex = sections.indexOf(storedSection)
    if (storedIndex >= 0) return storedIndex
  }

  return 0
}

/** Fullscreen is session-only so a reload returns to a docked or expanded layout. */
export function readStoredPreviewMode(
  raw: string | null,
  viewportWide: boolean,
): Exclude<BuilderPreviewMode, "fullscreen"> {
  if (raw === "docked" || raw === "expanded" || raw === "collapsed") {
    return raw
  }
  return viewportWide ? "docked" : "collapsed"
}

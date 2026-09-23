"use client"

import { memo, useCallback, useRef } from "react"

import type {
  CreateQuestionnaireFieldInput,
  QuestionnaireField,
} from "@/lib/data-access/modules/questionnaires"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import { QuestionnaireBuilderCanvas } from "./builder-canvas"
import { builderSurfaces } from "./builder-surfaces"
import { CanvasStructureMinimap } from "./canvas-structure-minimap"
import { FieldLibraryDrawer } from "./field-library-drawer"
import { FieldPropertiesPanel } from "./field-properties-panel"
import type { FieldLibraryItem } from "./field-library"
import type { FieldDefinition } from "@repo/forms-library"
import type { SectionGroup } from "./types"

type QuestionnaireBuilderWorkspaceProps = {
  sectionGroups: SectionGroup[]
  allSections: string[]
  fields: QuestionnaireField[]
  loading: boolean
  error: unknown
  canManage: boolean
  reorderPending: boolean
  selectedFieldId: string | null
  libraryOpen: boolean
  libraryTargetSection?: string
  savePending: boolean
  saveError: unknown
  onSelectField: (field: QuestionnaireField | null) => void
  onLibraryOpenChange: (open: boolean) => void
  onLibraryTargetSection: (section?: string) => void
  onDirtyChange: (dirty: boolean) => void
  onAddSection: (name: string) => void
  onRenameSection: (section: string, nextName: string) => void
  onDuplicateSection: (section: string) => void
  onDeleteSection: (section: string) => void
  onReorderSections: (groups: SectionGroup[]) => void
  onReorderFields: (groups: SectionGroup[]) => void
  onInsertLibraryField: (item: FieldDefinition, section?: string) => void
  onQuickInsertField: (item: FieldLibraryItem, section?: string) => void
  onDuplicateField: (field: QuestionnaireField) => void
  onDeleteField: (field: QuestionnaireField) => void
  onSaveField: (input: CreateQuestionnaireFieldInput) => void
  onCreateSection: (name: string) => string | null
  onFocusCanvas?: () => void
  onOpenWizard?: () => void
  onInsertBlock?: () => void
  onBlankTemplate?: () => void
  templateName?: string
  templateStatusLabel?: string
}

export const QuestionnaireBuilderWorkspace = memo(
  function QuestionnaireBuilderWorkspace({
    sectionGroups,
    allSections,
    fields,
    loading,
    error,
    canManage,
    reorderPending,
    selectedFieldId,
    libraryOpen,
    libraryTargetSection,
    savePending,
    saveError,
    onSelectField,
    onLibraryOpenChange,
    onLibraryTargetSection,
    onDirtyChange,
    onAddSection,
    onRenameSection,
    onDuplicateSection,
    onDeleteSection,
    onReorderSections,
    onReorderFields,
    onInsertLibraryField,
    onQuickInsertField,
    onDuplicateField,
    onDeleteField,
    onSaveField,
    onCreateSection,
    onFocusCanvas,
    onOpenWizard,
    onInsertBlock,
    onBlankTemplate,
    templateName,
    templateStatusLabel,
  }: QuestionnaireBuilderWorkspaceProps) {
    const canvasRef = useRef<HTMLDivElement>(null)

    const selectedField =
      fields.find((field) => field.id === selectedFieldId) ?? null

    const focusCanvas = useCallback(() => {
      canvasRef.current?.focus({ preventScroll: true })
      onFocusCanvas?.()
    }, [onFocusCanvas])

    const openLibrary = useCallback(
      (section?: string) => {
        onLibraryTargetSection(section ?? allSections[0])
        onLibraryOpenChange(true)
      },
      [allSections, onLibraryOpenChange, onLibraryTargetSection],
    )

    const handleQuickInsert = useCallback(
      (item: FieldLibraryItem) => {
        onQuickInsertField(item, libraryTargetSection ?? allSections[0])
        focusCanvas()
      },
      [allSections, focusCanvas, libraryTargetSection, onQuickInsertField],
    )

    const handleInsertFromLibrary = useCallback(
      (item: FieldDefinition) => {
        onInsertLibraryField(item, libraryTargetSection ?? allSections[0])
        onLibraryOpenChange(false)
        focusCanvas()
      },
      [
        allSections,
        focusCanvas,
        libraryTargetSection,
        onInsertLibraryField,
        onLibraryOpenChange,
      ],
    )

    const handleCanvasBackgroundClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
          onSelectField(null)
        }
      },
      [onSelectField],
    )

    return (
      <>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[var(--if-space-4)] overflow-hidden">
          {templateName ? (
            <div
              data-builder-level="template"
              className="shrink-0 rounded-2xl border border-primary/35 border-l-[3px] border-l-primary bg-primary/[0.08] px-[var(--if-space-5)] py-[var(--if-space-4)]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Template
              </p>
              <div className="mt-1 flex min-w-0 items-center gap-[var(--if-space-3)]">
                <h2 className="truncate text-lg font-semibold tracking-[-0.03em] md:text-xl">
                  {templateName}
                </h2>
                {templateStatusLabel ? (
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {templateStatusLabel}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          <CanvasStructureMinimap sections={allSections} className="shrink-0" />
          <div
            ref={canvasRef}
            tabIndex={-1}
            onClick={handleCanvasBackgroundClick}
            className={cn(
              "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain outline-none",
              builderSurfaces.canvas,
            )}
            aria-label="Canvas do formulário"
          >
            <QuestionnaireBuilderCanvas
              sectionGroups={sectionGroups}
              allSections={allSections}
              loading={loading}
              error={error}
              canManage={canManage}
              reorderPending={reorderPending}
              selectedFieldId={selectedFieldId}
              onSelectField={onSelectField}
              onAddSection={(name) => {
                onAddSection(name)
                focusCanvas()
              }}
              onRenameSection={onRenameSection}
              onDuplicateSection={onDuplicateSection}
              onDeleteSection={onDeleteSection}
              onReorderSections={onReorderSections}
              onReorderFields={onReorderFields}
              onOpenLibrary={openLibrary}
              onQuickInsert={handleQuickInsert}
              onDuplicateField={(field) => {
                onDuplicateField(field)
                focusCanvas()
              }}
              onDeleteField={onDeleteField}
              onFocusCanvas={focusCanvas}
              onOpenWizard={onOpenWizard}
              onInsertBlock={onInsertBlock}
              onBlankTemplate={onBlankTemplate}
            />
          </div>
        </div>

        {canManage ? (
          <>
            <FieldLibraryDrawer
              open={libraryOpen}
              onOpenChange={onLibraryOpenChange}
              onInsert={handleInsertFromLibrary}
              disabled={reorderPending}
            />

            <Sheet
              open={Boolean(selectedField)}
              onOpenChange={(open) => {
                if (!open) onSelectField(null)
              }}
            >
              <SheetContent
                side="right"
                className="flex w-full flex-col border-white/[0.08] bg-background/98 p-0 sm:max-w-md"
              >
                {selectedField ? (
                  <FieldPropertiesPanel
                    field={selectedField}
                    fields={fields}
                    sections={allSections}
                    pending={savePending}
                    error={saveError}
                    onClose={() => onSelectField(null)}
                    onSave={onSaveField}
                    onCreateSection={onCreateSection}
                    onDirtyChange={onDirtyChange}
                  />
                ) : null}
              </SheetContent>
            </Sheet>
          </>
        ) : null}
      </>
    )
  },
)

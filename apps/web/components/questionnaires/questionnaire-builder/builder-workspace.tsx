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
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--if-space-3)]">
          <CanvasStructureMinimap sections={allSections} />
          <div
            ref={canvasRef}
            tabIndex={-1}
            onClick={handleCanvasBackgroundClick}
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none",
              builderSurfaces.level1,
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

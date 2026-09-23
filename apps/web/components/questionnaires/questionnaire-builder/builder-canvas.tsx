"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, Copy, Edit3, GripVertical, Plus, Trash2 } from "lucide-react"
import { useReducedMotion } from "framer-motion"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import { cn } from "@/lib/utils"

import { BuilderIconAction } from "./builder-icon-action"
import { BuilderCanvasSkeleton } from "./builder-skeleton"
import { builderSurfaces } from "./builder-surfaces"
import { CanvasEmptyState, canvasSectionDomId } from "./canvas-empty-state"
import type { FieldLibraryItem } from "./field-library"
import { QuickAddMenu } from "./quick-add-menu"
import type { SectionGroup } from "./types"
import { useLatestCallback } from "./use-latest-callback"
import { getQuestionKindLabel } from "./utils"

type QuestionnaireBuilderCanvasProps = {
  sectionGroups: SectionGroup[]
  allSections: string[]
  loading: boolean
  error: unknown
  canManage: boolean
  reorderPending: boolean
  selectedFieldId: string | null
  onSelectField: (field: QuestionnaireField | null) => void
  onAddSection: (name: string) => void
  onRenameSection: (section: string, nextName: string) => void
  onDuplicateSection: (section: string) => void
  onDeleteSection: (section: string) => void
  onReorderSections: (groups: SectionGroup[]) => void
  onReorderFields: (groups: SectionGroup[]) => void
  onOpenLibrary: (section?: string) => void
  onQuickInsert: (item: FieldLibraryItem) => void
  onDuplicateField: (field: QuestionnaireField) => void
  onDeleteField: (field: QuestionnaireField) => void
  onFocusCanvas?: () => void
  onOpenWizard?: () => void
  onInsertBlock?: () => void
  onBlankTemplate?: () => void
  virtualize?: boolean
}

function sectionId(section: string) {
  return `section:${section}`
}

function fieldId(field: QuestionnaireField) {
  return `field:${field.id}`
}

function parseSectionId(id: string) {
  return id.replace(/^section:/, "")
}

function parseFieldId(id: string) {
  return id.replace(/^field:/, "")
}

function sortableStyle(
  transform: ReturnType<typeof useSortable>["transform"],
  transition: string | undefined,
  isDragging: boolean,
  reduceMotion: boolean,
) {
  return {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : reduceMotion
        ? "none"
        : (transition ?? "transform 200ms cubic-bezier(0.2, 0, 0, 1)"),
  }
}

const SortableFieldCard = memo(function SortableFieldCard({
  field,
  index,
  disabled,
  selected,
  reduceMotion,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  field: QuestionnaireField
  index: number
  disabled: boolean
  selected: boolean
  reduceMotion: boolean
  onSelect: (field: QuestionnaireField) => void
  onDuplicate: (field: QuestionnaireField) => void
  onDelete: (field: QuestionnaireField) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: fieldId(field),
    data: { type: "field", section: field.settings?.section, field },
    disabled,
  })

  const select = useCallback(() => onSelect(field), [field, onSelect])
  const duplicate = useCallback(() => onDuplicate(field), [field, onDuplicate])
  const remove = useCallback(() => onDelete(field), [field, onDelete])

  return (
    <article
      ref={setNodeRef}
      style={sortableStyle(transform, transition, isDragging, reduceMotion)}
      data-builder-level="field"
      className={cn(
        "group",
        builderSurfaces.field,
        selected && builderSurfaces.fieldSelected,
        isDragging && "z-10 cursor-grabbing opacity-40",
        isOver && !isDragging && builderSurfaces.dropTarget,
      )}
    >
      {isOver && !isDragging ? (
        <span className={builderSurfaces.dropLine} aria-hidden />
      ) : null}
      <div className="flex items-center gap-[var(--if-space-3)]">
        <button
          type="button"
          className={builderSurfaces.dragHandle}
          aria-label={`Reordenar pergunta ${field.label}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={select}
          className="flex min-w-0 flex-1 items-center gap-[var(--if-space-3)] rounded-lg py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-pressed={selected}
        >
          <span className="w-6 shrink-0 text-center text-xs font-medium tabular-nums text-muted-foreground">
            {index + 1}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-[var(--if-space-2)]">
              <span className="truncate text-sm font-medium tracking-[-0.01em]">
                {field.label}
              </span>
              {field.required ? (
                <Badge className="rounded-full bg-primary/15 text-[10px] text-primary">
                  Obrigatória
                </Badge>
              ) : null}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {getQuestionKindLabel(field)}
            </span>
          </span>
        </button>

        {!disabled ? (
          <div className="flex shrink-0 items-center gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
            <BuilderIconAction label={`Editar ${field.label}`} onClick={select}>
              <Edit3 className="size-4" />
            </BuilderIconAction>
            <BuilderIconAction
              label={`Duplicar ${field.label}`}
              onClick={duplicate}
            >
              <Copy className="size-4" />
            </BuilderIconAction>
            <BuilderIconAction
              label={`Excluir ${field.label}`}
              onClick={remove}
              destructive
            >
              <Trash2 className="size-4" />
            </BuilderIconAction>
          </div>
        ) : null}
      </div>
    </article>
  )
})

const SortableSection = memo(function SortableSection({
  group,
  disabled,
  reorderPending,
  reduceMotion,
  selectedFieldId,
  onSelectField,
  onRenameSection,
  onDuplicateSection,
  onDeleteSection,
  onOpenLibrary,
  onDuplicateField,
  onDeleteField,
  virtualize,
}: {
  group: SectionGroup
  disabled: boolean
  reorderPending: boolean
  reduceMotion: boolean
  selectedFieldId: string | null
  onSelectField: (field: QuestionnaireField) => void
  onRenameSection: (section: string, nextName: string) => void
  onDuplicateSection: (section: string) => void
  onDeleteSection: (section: string) => void
  onOpenLibrary: (section?: string) => void
  onDuplicateField: (field: QuestionnaireField) => void
  onDeleteField: (field: QuestionnaireField) => void
  virtualize?: boolean
}) {
  const [open, setOpen] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState(group.section)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: sectionId(group.section),
    data: { type: "section", section: group.section },
    disabled,
  })

  const fieldIds = useMemo(
    () => group.fields.map((field) => fieldId(field)),
    [group.fields],
  )

  const commitRename = useCallback(() => {
    onRenameSection(group.section, renameDraft)
    setRenaming(false)
  }, [group.section, onRenameSection, renameDraft])

  const openLibrary = useCallback(() => {
    onOpenLibrary(group.section)
  }, [group.section, onOpenLibrary])

  return (
    <section
      ref={setNodeRef}
      style={{
        ...sortableStyle(transform, transition, isDragging, reduceMotion),
        ...(virtualize
          ? { contentVisibility: "auto", containIntrinsicSize: "0 280px" }
          : undefined),
      }}
      id={canvasSectionDomId(group.section)}
      data-builder-level="section"
      className={cn(
        builderSurfaces.section,
        "scroll-mt-6",
        isDragging && "z-10 cursor-grabbing opacity-45 shadow-if-lg",
        isOver && !isDragging && builderSurfaces.dropTarget,
      )}
    >
      {isOver && !isDragging ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
          <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide text-primary-foreground shadow-sm">
            Soltar aqui
          </span>
        </div>
      ) : null}

      <header className={cn(builderSurfaces.sectionHeader, "flex items-start gap-[var(--if-space-3)]")}>
        <button
          type="button"
          className={cn(builderSurfaces.dragHandle, "mt-0.5")}
          aria-label={`Reordenar seção ${group.section}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          {renaming ? (
            <Input
              autoFocus
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  commitRename()
                }
                if (event.key === "Escape") {
                  setRenaming(false)
                  setRenameDraft(group.section)
                }
              }}
              className="h-10"
              aria-label="Novo nome da seção"
            />
          ) : (
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-lg py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Seção
                </span>
                <span className="mt-1 block truncate text-base font-semibold tracking-[-0.02em]">
                  {group.section}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {group.fields.length}{" "}
                  {group.fields.length === 1 ? "pergunta" : "perguntas"}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </button>
          )}
        </div>

        {!disabled ? (
          <div className="flex shrink-0 items-center gap-0.5">
            {renaming ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={reorderPending || !renameDraft.trim()}
                  onClick={commitRename}
                >
                  Salvar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRenaming(false)
                    setRenameDraft(group.section)
                  }}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <BuilderIconAction
                  label={`Duplicar seção ${group.section}`}
                  disabled={reorderPending}
                  onClick={() => onDuplicateSection(group.section)}
                >
                  <Copy className="size-4" />
                </BuilderIconAction>
                <BuilderIconAction
                  label={`Renomear seção ${group.section}`}
                  onClick={() => {
                    setRenaming(true)
                    setRenameDraft(group.section)
                  }}
                >
                  <Edit3 className="size-4" />
                </BuilderIconAction>
                <BuilderIconAction
                  label={`Excluir seção ${group.section}`}
                  disabled={reorderPending}
                  destructive
                  onClick={() => onDeleteSection(group.section)}
                >
                  <Trash2 className="size-4" />
                </BuilderIconAction>
              </>
            )}
          </div>
        ) : null}
      </header>

      {open ? (
        <div className={cn(builderSurfaces.sectionBody, builderSurfaces.fieldGap)}>
          <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
            {group.fields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.12] px-[var(--if-space-5)] py-[var(--if-space-8)] text-center text-sm text-muted-foreground">
                Nenhuma pergunta nesta seção. Use Campo Personalizado ou Inserir
                Bloco.
              </div>
            ) : (
              group.fields.map((field, index) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  index={index}
                  disabled={disabled || reorderPending}
                  selected={selectedFieldId === field.id}
                  reduceMotion={reduceMotion}
                  onSelect={onSelectField}
                  onDuplicate={onDuplicateField}
                  onDelete={onDeleteField}
                />
              ))
            )}
          </SortableContext>

          {!disabled ? (
            <div className="mt-[var(--if-space-3)] rounded-2xl border border-primary/35 bg-primary/[0.08] p-[var(--if-space-3)]">
              <Button
                type="button"
                className="h-11 w-full gap-2 text-sm font-semibold shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-md"
                onClick={openLibrary}
              >
                <Plus className="size-4" />
                Campo Personalizado
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
})

function DragPreviewCard({
  kicker,
  title,
}: {
  kicker: string
  title: string
}) {
  return (
    <div className="cursor-grabbing rounded-xl border border-primary/45 bg-background px-[var(--if-space-4)] py-[var(--if-space-3)] shadow-if-lg">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
        {kicker}
      </p>
      <p className="mt-1 text-sm font-semibold">{title}</p>
    </div>
  )
}

export const QuestionnaireBuilderCanvas = memo(function QuestionnaireBuilderCanvas({
  sectionGroups,
  allSections,
  loading,
  error,
  canManage,
  reorderPending,
  selectedFieldId,
  onSelectField,
  onAddSection,
  onRenameSection,
  onDuplicateSection,
  onDeleteSection,
  onReorderSections,
  onReorderFields,
  onOpenLibrary,
  onQuickInsert,
  onDuplicateField,
  onDeleteField,
  onFocusCanvas,
  onOpenWizard,
  onInsertBlock,
  onBlankTemplate,
}: QuestionnaireBuilderCanvasProps) {
  const [newSectionName, setNewSectionName] = useState("")
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const reduceMotionPreference = useReducedMotion()
  const reduceMotion = Boolean(reduceMotionPreference)

  const selectField = useLatestCallback(onSelectField)
  const renameSection = useLatestCallback(onRenameSection)
  const duplicateSection = useLatestCallback(onDuplicateSection)
  const deleteSection = useLatestCallback(onDeleteSection)
  const reorderSections = useLatestCallback(onReorderSections)
  const reorderFields = useLatestCallback(onReorderFields)
  const openLibrary = useLatestCallback(onOpenLibrary)
  const quickInsert = useLatestCallback(onQuickInsert)
  const duplicateField = useLatestCallback(onDuplicateField)
  const deleteField = useLatestCallback(onDeleteField)
  const focusCanvas = useLatestCallback(() => {
    onFocusCanvas?.()
  })

  const groups = useMemo(() => {
    const existing = new Map(sectionGroups.map((group) => [group.section, group]))
    return allSections.map(
      (section) =>
        existing.get(section) ?? {
          section,
          fields: [],
        },
    )
  }, [allSections, sectionGroups])

  const sectionIds = useMemo(
    () => groups.map((group) => sectionId(group.section)),
    [groups],
  )

  const totalFieldCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.fields.length, 0),
    [groups],
  )
  const virtualize = totalFieldCount > 36
  const isCanvasEmpty = totalFieldCount === 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const dropAnimation = useMemo<DropAnimation>(
    () => ({
      duration: reduceMotion ? 0 : 220,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      sideEffects: defaultDropAnimationSideEffects({
        styles: { active: { opacity: "0.35" } },
      }),
    }),
    [reduceMotion],
  )

  useEffect(() => {
    if (!activeDragId) return
    const previous = document.body.style.cursor
    document.body.style.cursor = "grabbing"
    return () => {
      document.body.style.cursor = previous
    }
  }, [activeDragId])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }, [])

  const clearDrag = useCallback(() => {
    setActiveDragId(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeId = String(active.id)
      const overId = String(over.id)

      if (activeId.startsWith("section:") && overId.startsWith("section:")) {
        const activeSection = parseSectionId(activeId)
        const overSection = parseSectionId(overId)
        const oldIndex = groups.findIndex((group) => group.section === activeSection)
        const newIndex = groups.findIndex((group) => group.section === overSection)
        if (oldIndex < 0 || newIndex < 0) return

        const next = [...groups]
        const [removed] = next.splice(oldIndex, 1)
        next.splice(newIndex, 0, removed!)
        reorderSections(next)
        return
      }

      if (activeId.startsWith("field:")) {
        const activeFieldId = parseFieldId(activeId)
        let overFieldId = overId.startsWith("field:") ? parseFieldId(overId) : null
        let targetSection = groups.find((group) =>
          group.fields.some((field) => field.id === activeFieldId),
        )?.section

        if (overId.startsWith("section:")) {
          targetSection = parseSectionId(overId)
          overFieldId = null
        } else if (overFieldId) {
          targetSection = groups.find((group) =>
            group.fields.some((field) => field.id === overFieldId),
          )?.section
        }

        if (!targetSection) return

        const next = groups.map((group) => ({
          ...group,
          fields: [...group.fields],
        }))

        let movingField: QuestionnaireField | undefined
        for (const group of next) {
          const index = group.fields.findIndex((field) => field.id === activeFieldId)
          if (index >= 0) {
            movingField = group.fields.splice(index, 1)[0]
            break
          }
        }
        if (!movingField) return

        const targetGroup = next.find((group) => group.section === targetSection)
        if (!targetGroup) return

        if (overFieldId) {
          const insertIndex = targetGroup.fields.findIndex(
            (field) => field.id === overFieldId,
          )
          targetGroup.fields.splice(
            insertIndex >= 0 ? insertIndex : targetGroup.fields.length,
            0,
            movingField,
          )
        } else {
          targetGroup.fields.push(movingField)
        }

        reorderFields(
          next.filter(
            (group) =>
              group.fields.length > 0 || allSections.includes(group.section),
          ),
        )
      }
    },
    [allSections, groups, reorderFields, reorderSections],
  )

  const activeField = activeDragId?.startsWith("field:")
    ? groups
        .flatMap((group) => group.fields)
        .find((field) => fieldId(field) === activeDragId)
    : null
  const activeSection = activeDragId?.startsWith("section:")
    ? parseSectionId(activeDragId)
    : null

  const addSection = useCallback(() => {
    const name = newSectionName.trim()
    if (!name) return
    onAddSection(name)
    setNewSectionName("")
    focusCanvas()
  }, [focusCanvas, newSectionName, onAddSection])

  if (loading) return <BuilderCanvasSkeleton />

  return (
    <div className="flex min-h-0 flex-col gap-[var(--if-space-6)] md:gap-[var(--if-space-8)]">
      {!isCanvasEmpty ? (
        <div className="flex flex-col gap-[var(--if-space-4)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Seções
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Arraste para reorganizar. A seção é o bloco; a pergunta é o item.
            </p>
          </div>

          {canManage ? (
            <div className="flex flex-wrap items-center gap-[var(--if-space-2)]">
              <QuickAddMenu
                disabled={reorderPending}
                onInsert={quickInsert}
                onOpenLibrary={() => openLibrary()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                disabled={reorderPending}
                onClick={() => openLibrary()}
              >
                <Plus className="size-4" />
                Campo Personalizado
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isCanvasEmpty ? (
        <PermissionGate permission="questionnaires:manage">
          <div className="flex gap-[var(--if-space-2)] rounded-xl border border-dashed border-white/[0.14] bg-transparent p-[var(--if-space-2)]">
            <Input
              value={newSectionName}
              onChange={(event) => setNewSectionName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  addSection()
                }
              }}
              placeholder="Ex.: Dados pessoais"
              aria-label="Nome da nova seção"
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-2"
              disabled={!newSectionName.trim() || reorderPending}
              onClick={addSection}
            >
              <Plus className="size-4" />
              Nova seção
            </Button>
          </div>
        </PermissionGate>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar perguntas.
        </div>
      ) : isCanvasEmpty ? (
        <CanvasEmptyState
          canManage={canManage}
          onOpenWizard={() => onOpenWizard?.()}
          onInsertBlock={() => onInsertBlock?.() ?? openLibrary()}
          onBlankTemplate={() => onBlankTemplate?.()}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={clearDrag}
          onDragEnd={handleDragEnd}
        >
          <p className="sr-only" aria-live="polite">
            {activeDragId
              ? "Movendo. Solte sobre a área destacada para reposicionar."
              : ""}
          </p>
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <div className={builderSurfaces.sectionGap}>
              {groups.map((group) => (
                <SortableSection
                  key={group.section}
                  group={group}
                  disabled={!canManage}
                  reorderPending={reorderPending}
                  reduceMotion={reduceMotion}
                  selectedFieldId={selectedFieldId}
                  onSelectField={selectField}
                  onRenameSection={renameSection}
                  onDuplicateSection={duplicateSection}
                  onDeleteSection={deleteSection}
                  onOpenLibrary={openLibrary}
                  onDuplicateField={duplicateField}
                  onDeleteField={deleteField}
                  virtualize={virtualize}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeField ? (
              <DragPreviewCard kicker="Movendo pergunta" title={activeField.label} />
            ) : activeSection ? (
              <DragPreviewCard kicker="Movendo seção" title={activeSection} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
})

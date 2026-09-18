"use client"

import { memo, useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDown,
  Copy,
  Edit3,
  GripVertical,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import { cn } from "@/lib/utils"

import { BuilderCanvasSkeleton } from "./builder-skeleton"
import { builderSurfaces } from "./builder-surfaces"
import { CanvasEmptyState, canvasSectionDomId } from "./canvas-empty-state"
import type { FieldLibraryItem } from "./field-library"
import { QuickAddMenu } from "./quick-add-menu"
import type { SectionGroup } from "./types"
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

const SortableFieldCard = memo(function SortableFieldCard({
  field,
  index,
  disabled,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  field: QuestionnaireField
  index: number
  disabled: boolean
  selected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: fieldId(field),
    data: { type: "field", section: field.settings?.section, field },
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        builderSurfaces.card,
        "group p-[var(--if-space-4)]",
        selected && builderSurfaces.cardSelected,
        isDragging && "z-10 opacity-60 shadow-if-lg",
      )}
    >
      <div className="flex items-center gap-[var(--if-space-3)]">
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-md p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            disabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-grab touch-none active:cursor-grabbing",
          )}
          aria-label={`Reordenar pergunta ${field.label}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-[var(--if-space-3)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-pressed={selected}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.06] text-xs font-semibold tabular-nums text-muted-foreground">
            {index + 1}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-[var(--if-space-2)]">
              <p className="truncate font-medium tracking-[-0.01em]">
                {field.label}
              </p>
              {field.required ? (
                <Badge className="rounded-full bg-primary/15 text-[10px] text-primary">
                  Obrigatória
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {getQuestionKindLabel(field)}
            </p>
          </div>
        </button>

        {!disabled ? (
          <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 has-data-[state=open]:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-white/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`Ações da pergunta ${field.label}`}
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="gap-2" onClick={onSelect}>
                  <Edit3 className="size-3.5" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={onDuplicate}>
                  <Copy className="size-3.5" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={onSelect}>
                  <GripVertical className="size-3.5" />
                  Mover
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2"
                  onClick={onDelete}
                >
                  <Trash2 className="size-3.5" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
  selectedFieldId,
  onSelectField,
  onRename,
  onDuplicate,
  onDelete,
  onOpenLibrary,
  onDuplicateField,
  onDeleteField,
  virtualize,
}: {
  group: SectionGroup
  disabled: boolean
  reorderPending: boolean
  selectedFieldId: string | null
  onSelectField: (field: QuestionnaireField) => void
  onRename: (nextName: string) => void
  onDuplicate: () => void
  onDelete: () => void
  onOpenLibrary: () => void
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
  } = useSortable({
    id: sectionId(group.section),
    data: { type: "section", section: group.section },
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const fieldIds = useMemo(
    () => group.fields.map((field) => fieldId(field)),
    [group.fields],
  )

  return (
    <section
      ref={setNodeRef}
      style={{
        ...style,
        ...(virtualize
          ? { contentVisibility: "auto", containIntrinsicSize: "0 240px" }
          : undefined),
      }}
      id={canvasSectionDomId(group.section)}
      className={cn(
        builderSurfaces.level1,
        "overflow-hidden scroll-mt-4",
        isDragging && "opacity-80 shadow-if-lg",
      )}
    >
      <header className="flex items-start gap-[var(--if-space-2)] border-b border-white/[0.08] bg-white/[0.05] px-[var(--if-space-4)] py-[var(--if-space-3)]">
        <button
          type="button"
          className={cn(
            "mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            disabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-grab touch-none active:cursor-grabbing",
          )}
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
                  onRename(renameDraft)
                  setRenaming(false)
                }
                if (event.key === "Escape") {
                  setRenaming(false)
                  setRenameDraft(group.section)
                }
              }}
              className="h-8"
              aria-label="Novo nome da seção"
            />
          ) : (
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em]">
                  {group.section}
                </p>
                <p className="text-xs text-muted-foreground">
                  {group.fields.length}{" "}
                  {group.fields.length === 1 ? "pergunta" : "perguntas"}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
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
                  onClick={() => {
                    onRename(renameDraft)
                    setRenaming(false)
                  }}
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
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label={`Duplicar seção ${group.section}`}
                  disabled={reorderPending}
                  onClick={onDuplicate}
                >
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label={`Renomear seção ${group.section}`}
                  onClick={() => {
                    setRenaming(true)
                    setRenameDraft(group.section)
                  }}
                >
                  <Edit3 className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:text-destructive"
                  aria-label={`Excluir seção ${group.section}`}
                  disabled={reorderPending}
                  onClick={onDelete}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        ) : null}
      </header>

      {open ? (
        <div
          className={cn(
            builderSurfaces.level2,
            builderSurfaces.fieldGap,
            "m-[var(--if-space-4)] p-[var(--if-space-4)] md:p-[var(--if-space-5)]",
          )}
        >
          <SortableContext
            items={fieldIds}
            strategy={verticalListSortingStrategy}
          >
            {group.fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/[0.12] px-[var(--if-space-4)] py-[var(--if-space-6)] text-center text-xs text-muted-foreground">
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
                  onSelect={() => onSelectField(field)}
                  onDuplicate={() => onDuplicateField(field)}
                  onDelete={() => onDeleteField(field)}
                />
              ))
            )}
          </SortableContext>

          {!disabled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-[var(--if-space-2)] w-full gap-2 border-dashed bg-transparent"
              onClick={onOpenLibrary}
            >
              <Plus className="size-3.5" />
              Campo Personalizado
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
})

export function QuestionnaireBuilderCanvas({
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

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith("section:") && overId.startsWith("section:")) {
      const activeSection = parseSectionId(activeId)
      const overSection = parseSectionId(overId)
      const oldIndex = groups.findIndex((g) => g.section === activeSection)
      const newIndex = groups.findIndex((g) => g.section === overSection)
      if (oldIndex < 0 || newIndex < 0) return

      const next = [...groups]
      const [removed] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, removed!)
      onReorderSections(next)
      return
    }

    if (activeId.startsWith("field:")) {
      const activeFieldId = parseFieldId(activeId)
      let overFieldId = overId.startsWith("field:")
        ? parseFieldId(overId)
        : null
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

      onReorderFields(
        next.filter(
          (group) =>
            group.fields.length > 0 || allSections.includes(group.section),
        ),
      )
    }
  }

  const activeField = activeDragId?.startsWith("field:")
    ? groups
        .flatMap((group) => group.fields)
        .find((field) => fieldId(field) === activeDragId)
    : null

  if (loading) return <BuilderCanvasSkeleton />

  return (
    <div className="flex min-h-0 flex-col gap-[var(--if-space-5)]">
      {!isCanvasEmpty ? (
        <div className="flex flex-col gap-[var(--if-space-3)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.02em]">Canvas</h2>
            <p className="text-xs text-muted-foreground">
              Módulos independentes — arraste para reorganizar.
            </p>
          </div>

          {canManage ? (
            <div className="flex flex-wrap items-center gap-[var(--if-space-2)]">
              <QuickAddMenu
                disabled={reorderPending}
                onInsert={onQuickInsert}
                onOpenLibrary={() => onOpenLibrary()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={reorderPending}
                onClick={() => onOpenLibrary()}
              >
                <Plus className="size-3.5" />
                Campo Personalizado
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isCanvasEmpty ? (
        <PermissionGate permission="questionnaires:manage">
          <div className={cn(builderSurfaces.level2, "flex gap-[var(--if-space-2)] p-[var(--if-space-2)]")}>
            <Input
              value={newSectionName}
              onChange={(event) => setNewSectionName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  if (newSectionName.trim()) {
                    onAddSection(newSectionName.trim())
                    setNewSectionName("")
                    onFocusCanvas?.()
                  }
                }
              }}
              placeholder="Ex.: Dados pessoais"
              aria-label="Nome da nova seção"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2"
              disabled={!newSectionName.trim() || reorderPending}
              onClick={() => {
                onAddSection(newSectionName.trim())
                setNewSectionName("")
                onFocusCanvas?.()
              }}
            >
              <Plus className="size-3.5" />
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
          onInsertBlock={() => onInsertBlock?.() ?? onOpenLibrary()}
          onBlankTemplate={() => onBlankTemplate?.()}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sectionIds}
            strategy={verticalListSortingStrategy}
          >
            <div className={builderSurfaces.sectionGap}>
              {groups.map((group) => (
                <SortableSection
                  key={group.section}
                  group={group}
                  disabled={!canManage}
                  reorderPending={reorderPending}
                  selectedFieldId={selectedFieldId}
                  onSelectField={onSelectField}
                  onRename={(nextName) =>
                    onRenameSection(group.section, nextName)
                  }
                  onDuplicate={() => onDuplicateSection(group.section)}
                  onDelete={() => onDeleteSection(group.section)}
                  onOpenLibrary={() => onOpenLibrary(group.section)}
                  onDuplicateField={onDuplicateField}
                  onDeleteField={onDeleteField}
                  virtualize={virtualize}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeField ? (
              <div
                className={cn(
                  builderSurfaces.card,
                  "p-3 shadow-if-lg",
                )}
              >
                <p className="text-sm font-medium">{activeField.label}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

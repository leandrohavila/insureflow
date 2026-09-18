"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Eye, Loader2, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/data-access"
import type {
  CreateQuestionnaireFieldInput,
  QuestionnaireField,
} from "@/lib/data-access/modules/questionnaires"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { stableStringify } from "@/lib/questionnaires/template-settings-autosave.util"
import { cn } from "@/lib/utils"

import {
  DEFAULT_SECTION,
  defaultQuestionKind,
  questionKindOptions,
  sectionSuggestions,
} from "./constants"
import {
  buildFieldInputFromForm,
  emptyFieldForm,
  fieldToFormState,
  parseOptionLabels,
  type FieldFormState,
} from "./field-form"
import { getFieldSection, normalizeSectionName, uniqueSectionNames } from "./utils"
import type { InsuranceQuestionKind } from "./types"
import { PreviewControl } from "./preview-control"
import { builderSurfaces } from "./builder-surfaces"

const AUTOSAVE_DEBOUNCE_MS = 600

type FieldPropertiesPanelProps = {
  field: QuestionnaireField | null
  fields: QuestionnaireField[]
  sections: string[]
  pending: boolean
  error: unknown
  onClose: () => void
  onSave: (input: CreateQuestionnaireFieldInput) => void
  onCreateSection: (sectionName: string) => string | null
  onDirtyChange?: (dirty: boolean) => void
}

export const FieldPropertiesPanel = memo(function FieldPropertiesPanel({
  field,
  fields,
  sections,
  pending,
  error,
  onClose,
  onSave,
  onCreateSection,
  onDirtyChange,
}: FieldPropertiesPanelProps) {
  const [form, setForm] = useState<FieldFormState>(() =>
    field ? fieldToFormState(field) : emptyFieldForm(DEFAULT_SECTION, 0),
  )
  const [optionDraft, setOptionDraft] = useState("")
  const [newSectionDraft, setNewSectionDraft] = useState("")
  const initializedRef = useRef<string | null>(null)
  const skipNextSave = useRef(false)
  const isSavingRef = useRef(false)
  const lastSavedHashRef = useRef<string | null>(null)
  const lastSavedUpdatedAtRef = useRef<string | null>(null)
  const pendingChangesRef = useRef<string | null>(null)

  const debouncedForm = useDebouncedValue(form, AUTOSAVE_DEBOUNCE_MS)

  const selectedKind =
    questionKindOptions.find((option) => option.value === form.kind) ??
    defaultQuestionKind
  const usesOptions =
    form.kind === "single_choice" || form.kind === "multi_choice"

  const existingSections = useMemo(
    () =>
      uniqueSectionNames([
        DEFAULT_SECTION,
        ...sections,
        ...fields.map(getFieldSection),
        ...sectionSuggestions,
      ]),
    [fields, sections],
  )

  const sectionSelectValue = existingSections.includes(
    normalizeSectionName(form.section),
  )
    ? normalizeSectionName(form.section)
    : "__new__"

  useEffect(() => {
    if (!field) {
      initializedRef.current = null
      lastSavedHashRef.current = null
      lastSavedUpdatedAtRef.current = null
      pendingChangesRef.current = null
      return
    }
    if (initializedRef.current === field.id) return
    initializedRef.current = field.id
    skipNextSave.current = true
    const nextForm = fieldToFormState(field)
    setForm(nextForm)
    setOptionDraft("")
    setNewSectionDraft("")
    const baselineInput = buildFieldInputFromForm(nextForm, fields, field)
    lastSavedHashRef.current = baselineInput
      ? stableStringify(baselineInput)
      : null
    lastSavedUpdatedAtRef.current = field.updatedAt
    pendingChangesRef.current = null
  }, [field, fields])

  useEffect(() => {
    isSavingRef.current = pending
    if (!field || pending) return

    pendingChangesRef.current = null

    if (lastSavedUpdatedAtRef.current === field.updatedAt) return

    skipNextSave.current = true
    const syncedForm = fieldToFormState(field)
    setForm(syncedForm)
    const baselineInput = buildFieldInputFromForm(syncedForm, fields, field)
    lastSavedHashRef.current = baselineInput
      ? stableStringify(baselineInput)
      : null
    lastSavedUpdatedAtRef.current = field.updatedAt
    pendingChangesRef.current = null
  }, [field, fields, pending])

  const isDirty = useMemo(() => {
    if (!field) return false
    const original = fieldToFormState(field)
    return JSON.stringify(original) !== JSON.stringify(form)
  }, [field, form])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    if (!field || skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    if (isSavingRef.current) return
    if (stableStringify(form) !== stableStringify(debouncedForm)) return

    const input = buildFieldInputFromForm(debouncedForm, fields, field)
    if (!input || !isDirty) return

    const payloadHash = stableStringify(input)
    if (
      payloadHash === lastSavedHashRef.current ||
      payloadHash === pendingChangesRef.current
    ) {
      return
    }

    pendingChangesRef.current = payloadHash
    isSavingRef.current = true
    onSave(input)
  }, [debouncedForm, field, fields, form, isDirty, onSave])

  const updateForm = useCallback(
    (patch: Partial<FieldFormState>) => {
      setForm((current) => ({ ...current, ...patch }))
    },
    [],
  )

  function handleCreateSection() {
    if (!newSectionDraft.trim()) return
    const section = onCreateSection(newSectionDraft)
    if (!section) return
    updateForm({ section })
    setNewSectionDraft("")
  }

  function handleAddOption() {
    const option = optionDraft.trim()
    if (!option) return
    const labels = parseOptionLabels(form.options)
    if (labels.includes(option)) {
      setOptionDraft("")
      return
    }
    updateForm({ options: [...labels, option].join("\n") })
    setOptionDraft("")
  }

  function removeOption(optionToRemove: string) {
    updateForm({
      options: parseOptionLabels(form.options)
        .filter((option) => option !== optionToRemove)
        .join("\n"),
    })
  }

  if (!field) return null

  return (
    <div className="flex h-full min-h-0 flex-col" aria-label="Propriedades da pergunta">
      <header className="flex items-center justify-between border-b border-white/[0.06] px-[var(--if-space-3)] py-[var(--if-space-3)]">
        <div>
          <p className="text-sm font-semibold tracking-[-0.02em]">
            Propriedades
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {field.label}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={onClose}
          aria-label="Fechar painel de propriedades"
        >
          <X className="size-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-[var(--if-space-3)]">
        <div className="space-y-[var(--if-space-4)]">
          <label className="block space-y-[var(--if-space-2)]">
            <span className="text-xs font-medium">Nome da pergunta</span>
            <Input
              value={form.label}
              onChange={(event) => updateForm({ label: event.target.value })}
              placeholder="Ex.: Nome do segurado"
            />
          </label>

          <label className="block space-y-[var(--if-space-2)]">
            <span className="text-xs font-medium">Descrição / ajuda</span>
            <Input
              value={form.helpText}
              onChange={(event) => updateForm({ helpText: event.target.value })}
              placeholder="Texto de orientação ao respondente"
            />
          </label>

          <label className="block space-y-[var(--if-space-2)]">
            <span className="text-xs font-medium">Placeholder</span>
            <Input
              value={form.placeholder}
              onChange={(event) =>
                updateForm({ placeholder: event.target.value })
              }
              placeholder={selectedKind.placeholder ?? "Texto de exemplo"}
            />
          </label>

          <label className="block space-y-[var(--if-space-2)]">
            <span className="text-xs font-medium">Valor padrão</span>
            <Input
              value={form.defaultValue}
              onChange={(event) =>
                updateForm({ defaultValue: event.target.value })
              }
              placeholder="Opcional"
            />
          </label>

          <div className="space-y-[var(--if-space-2)]">
            <span className="text-xs font-medium">Seção</span>
            <select
              value={sectionSelectValue}
              onChange={(event) => {
                const next = event.target.value
                if (next === "__new__") {
                  setNewSectionDraft("")
                  updateForm({ section: "" })
                  return
                }
                updateForm({ section: next })
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {existingSections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
              <option value="__new__">+ Nova seção</option>
            </select>
            {sectionSelectValue === "__new__" ? (
              <div className="flex gap-2">
                <Input
                  value={newSectionDraft}
                  onChange={(event) => setNewSectionDraft(event.target.value)}
                  placeholder="Nome da seção"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleCreateSection()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!newSectionDraft.trim()}
                  onClick={handleCreateSection}
                >
                  OK
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-[var(--if-space-2)]">
            <span className="text-xs font-medium">Tipo</span>
            <select
              value={form.kind}
              onChange={(event) => {
                const kind = event.target.value as InsuranceQuestionKind
                const option = questionKindOptions.find((o) => o.value === kind)
                updateForm({
                  kind,
                  placeholder: form.placeholder || option?.placeholder || "",
                })
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {questionKindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedKind.mask ? (
              <p className="text-[10px] text-muted-foreground">
                Máscara: {selectedKind.mask.toUpperCase()}
              </p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-[var(--if-space-3)] text-sm">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(event) =>
                updateForm({ required: event.target.checked })
              }
            />
            Obrigatório
          </label>

          {usesOptions ? (
            <div className="space-y-[var(--if-space-2)]">
              <span className="text-xs font-medium">Opções</span>
              <div className="flex gap-2">
                <Input
                  value={optionDraft}
                  onChange={(event) => setOptionDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleAddOption()
                    }
                  }}
                  placeholder="Nova opção"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!optionDraft.trim()}
                  onClick={handleAddOption}
                >
                  +
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {parseOptionLabels(form.options).map((option) => (
                  <span
                    key={option}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-background/45 px-2 py-0.5 text-[10px]"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => removeOption(option)}
                      aria-label={`Remover ${option}`}
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className={cn(builderSurfaces.level2, "p-[var(--if-space-3)]")}>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <Eye className="size-3.5 text-primary" />
              Preview
            </div>
            <PreviewControl
              kind={form.kind}
              placeholder={form.placeholder || selectedKind.placeholder}
              options={form.options}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
              {getErrorMessage(error, "Erro ao salvar")}
            </p>
          ) : null}

          {pending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Salvando alterações...
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
})

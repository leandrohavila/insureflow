"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { useCanManage } from "@/components/auth/session-provider"
import { QuestionnaireNavTabs } from "@/components/questionnaires/questionnaire-nav-tabs"
import { QuestionnaireBuilderHeader } from "@/components/questionnaires/questionnaire-builder/builder-header"
import {
  BuilderConfirmDialog,
  type BuilderConfirmState,
} from "@/components/questionnaires/questionnaire-builder/builder-confirm-dialog"
import { QuestionnaireBuilderWorkspace } from "@/components/questionnaires/questionnaire-builder/builder-workspace"
import {
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_SECTION,
} from "@/components/questionnaires/questionnaire-builder/constants"
import type { AutoSaveStatus } from "@/components/questionnaires/questionnaire-builder/autosave-indicator"
import {
  buildFieldInputFromForm,
  emptyFieldForm,
} from "@/components/questionnaires/questionnaire-builder/field-form"
import type { FieldLibraryItem } from "@/components/questionnaires/questionnaire-builder/field-library"
import { BlockLibraryDrawer } from "@/components/questionnaires/questionnaire-builder/block-library-drawer"
import { QuestionnaireFormPreview } from "@/components/questionnaires/questionnaire-builder/form-preview"
import {
  parseRulesFromTemplateSettings,
  RulesEditorPanel,
  serializeRulesToSettings,
} from "@/components/questionnaires/questionnaire-builder/rules-editor-panel"
import { QuestionnaireTemplateDialog } from "@/components/questionnaires/questionnaire-builder/template-dialog"
import {
  TemplateWizardDialog,
  type TemplateWizardResult,
} from "@/components/questionnaires/questionnaire-builder/template-wizard-dialog"
import { TemplateWizardOnboarding } from "@/components/questionnaires/questionnaire-builder/template-wizard-onboarding"
import { resolveWizardBlocks } from "@/components/questionnaires/questionnaire-builder/template-wizard.config"
import { QuestionnaireTemplateList } from "@/components/questionnaires/questionnaire-builder/template-list"
import type { SectionGroup } from "@/components/questionnaires/questionnaire-builder/types"
import {
  buildFlatFieldOrder,
  duplicateSectionName,
  getFieldSection,
  getFieldSettings,
  getQuestionKindFromField,
  getQuestionnaireSections,
  groupFieldsBySection,
  normalizeSectionName,
  uniqueQuestionKey,
  uniqueSectionNames,
} from "@/components/questionnaires/questionnaire-builder/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getErrorMessage } from "@/lib/data-access"
import {
  useCreateQuestionnaireField,
  useCreateQuestionnaireTemplate,
  useDeleteQuestionnaireField,
  useDeleteQuestionnaireTemplate,
  useQuestionnaireFields,
  useQuestionnaireTemplates,
  useUpdateQuestionnaireField,
  useUpdateQuestionnaireTemplate,
  type CreateQuestionnaireFieldInput,
  type QuestionnaireField,
  type QuestionnaireTemplate,
  type QuestionnaireTemplateStatus,
} from "@/lib/data-access/modules/questionnaires"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import type { FormRuleDefinition } from "@repo/forms-engine"
import {
  instantiateBlock,
  mergeTemplateRules,
  type BlockDefinition,
  type FieldDefinition,
} from "@repo/forms-library"
import {
  catalogFieldToCreateInput,
  instantiatedFieldToCreateInput,
} from "@/lib/questionnaires/forms-library-adapter"
import {
  stableStringify,
  TEMPLATE_SETTINGS_AUTOSAVE_DEBOUNCE_MS,
} from "@/lib/questionnaires/template-settings-autosave.util"
import { useTemplateSettingsAutosave } from "@/lib/questionnaires/use-template-settings-autosave"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function QuestionnaireTemplatesPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [status, setStatus] = useState<QuestionnaireTemplateStatus | "all">(
    "all",
  )
  const [page, setPage] = useState(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  )
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [fieldDirty, setFieldDirty] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [confirmState, setConfirmState] = useState<BuilderConfirmState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => undefined,
  })
  const [editingTemplate, setEditingTemplate] =
    useState<QuestionnaireTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryTargetSection, setLibraryTargetSection] = useState<
    string | undefined
  >()
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [blockLibraryOpen, setBlockLibraryOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPending, setWizardPending] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [createdTemplateName, setCreatedTemplateName] = useState<string>()
  const [templateRules, setTemplateRules] = useState<FormRuleDefinition[]>([])
  const [rulesEngineVersion, setRulesEngineVersion] = useState<1 | 2>(1)
  const debouncedTemplateRules = useDebouncedValue(
    templateRules,
    TEMPLATE_SETTINGS_AUTOSAVE_DEBOUNCE_MS,
  )
  const rulesSnapshotHashRef = useRef<string | null>(null)
  const reduce = useReducedMotion()
  const canManage = useCanManage("questionnaires:view")
  const fieldReorderInFlight = useRef(false)
  const wasSavingRef = useRef(false)

  const filters = useMemo(
    () => ({ search, status, page, limit: PAGE_SIZE }),
    [page, search, status],
  )
  const templatesQuery = useQuestionnaireTemplates(filters)
  const createTemplate = useCreateQuestionnaireTemplate()
  const updateTemplate = useUpdateQuestionnaireTemplate()
  const deleteTemplate = useDeleteQuestionnaireTemplate()
  const createField = useCreateQuestionnaireField()
  const updateField = useUpdateQuestionnaireField()
  const deleteField = useDeleteQuestionnaireField()

  const templates = useMemo(
    () => templatesQuery.data?.data ?? [],
    [templatesQuery.data?.data],
  )
  const meta = templatesQuery.data?.meta
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0] ??
    null
  const { scheduleSettingsSave } = useTemplateSettingsAutosave({
    template: selectedTemplate,
    updateTemplate,
  })
  const fieldsQuery = useQuestionnaireFields(selectedTemplate?.id ?? null)
  const fields = useMemo(
    () => fieldsQuery.data ?? selectedTemplate?.fields ?? [],
    [fieldsQuery.data, selectedTemplate?.fields],
  )
  const builderSections = useMemo(
    () =>
      selectedTemplate ? getQuestionnaireSections(selectedTemplate, fields) : [],
    [fields, selectedTemplate],
  )
  const sectionGroups = useMemo(
    () => groupFieldsBySection(fields, builderSections),
    [builderSections, fields],
  )

  useEffect(() => {
    setPage(1)
  }, [search, status])

  useEffect(() => {
    if (!selectedTemplateId && templates[0]) {
      setSelectedTemplateId(templates[0].id)
    }
  }, [selectedTemplateId, templates])

  useEffect(() => {
    setSelectedFieldId(null)
  }, [selectedTemplateId])

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateRules([])
      setRulesEngineVersion(1)
      rulesSnapshotHashRef.current = null
      return
    }

    const settings = (selectedTemplate.settings ?? {}) as Record<string, unknown>
    const parsed = parseRulesFromTemplateSettings(settings)
    const parsedHash = stableStringify(parsed)

    if (rulesSnapshotHashRef.current === parsedHash) {
      return
    }

    rulesSnapshotHashRef.current = parsedHash
    setTemplateRules(parsed)
    setRulesEngineVersion(settings.engineVersion === 2 ? 2 : 1)
  }, [selectedTemplate])

  useEffect(() => {
    if (!selectedTemplate) return
    if (
      stableStringify(debouncedTemplateRules) !== stableStringify(templateRules)
    ) {
      return
    }

    scheduleSettingsSave(
      serializeRulesToSettings(
        selectedTemplate.settings as Record<string, unknown>,
        debouncedTemplateRules,
        rulesEngineVersion,
      ),
    )
  }, [
    debouncedTemplateRules,
    rulesEngineVersion,
    scheduleSettingsSave,
    selectedTemplate,
    templateRules,
  ])

  useEffect(() => {
    const saving =
      updateField.isPending ||
      createField.isPending ||
      updateTemplate.isPending
    if (wasSavingRef.current && !saving && !fieldDirty) {
      setSavedFlash(true)
      const timer = window.setTimeout(() => setSavedFlash(false), 2500)
      wasSavingRef.current = saving
      return () => window.clearTimeout(timer)
    }
    wasSavingRef.current = saving
  }, [
    createField.isPending,
    fieldDirty,
    updateField.isPending,
    updateTemplate.isPending,
  ])

  const autoSaveStatus: AutoSaveStatus = useMemo(() => {
    if (
      updateField.isPending ||
      createField.isPending ||
      updateTemplate.isPending ||
      fieldReorderInFlight.current
    ) {
      return "saving"
    }
    if (fieldDirty) return "pending"
    if (savedFlash) return "saved"
    return "idle"
  }, [
    createField.isPending,
    fieldDirty,
    savedFlash,
    updateField.isPending,
    updateTemplate.isPending,
  ])

  function openConfirm(partial: Omit<BuilderConfirmState, "open">) {
    setConfirmState({ ...partial, open: true })
  }

  function closeConfirm() {
    setConfirmState((current) => ({ ...current, open: false }))
  }

  async function handleSave() {
    await Promise.all([templatesQuery.refetch(), fieldsQuery.refetch()])
  }

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isEditing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)

      if (event.key === "/" && !isEditing && canManage && selectedTemplate) {
        event.preventDefault()
        setLibraryTargetSection(builderSections[0])
        setLibraryOpen(true)
        return
      }

      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key === "s") {
        event.preventDefault()
        void handleSaveRef.current()
      }
      if (event.key === "n" && canManage) {
        event.preventDefault()
        setEditingTemplate(null)
        setWizardOpen(true)
      }
      if (event.key === "p") {
        event.preventDefault()
        setPreviewOpen((open) => !open)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canManage, selectedTemplate, builderSections])

  const saveSectionNames = useCallback(
    (nextSections: string[]) => {
      if (!selectedTemplate) return

      const normalized = uniqueSectionNames(nextSections)
      const currentSettings = (selectedTemplate.settings ?? {}) as Record<
        string,
        unknown
      >
      const nextSettings = {
        ...currentSettings,
        questionnaireSections: normalized,
      }

      if (
        stableStringify(currentSettings.questionnaireSections) ===
        stableStringify(normalized)
      ) {
        return
      }

      scheduleSettingsSave(nextSettings)
    },
    [scheduleSettingsSave, selectedTemplate],
  )

  const applyFieldReorder = useCallback(
    async (nextGroups: SectionGroup[]) => {
      if (!selectedTemplate || fieldReorderInFlight.current) return

      fieldReorderInFlight.current = true
      try {
        const flatIds = buildFlatFieldOrder(nextGroups)
        const orderMap = new Map(
          flatIds.map((id, index) => [id, index * 10]),
        )

        for (const group of nextGroups) {
          for (const field of group.fields) {
            const currentSection = getFieldSection(field)
            const nextOrder = orderMap.get(field.id)
            if (nextOrder === undefined) continue

            const needsSectionUpdate = currentSection !== group.section
            const needsOrderUpdate = field.order !== nextOrder
            if (!needsSectionUpdate && !needsOrderUpdate) continue

            await updateField.mutateAsync({
              templateId: selectedTemplate.id,
              fieldId: field.id,
              input: {
                ...(needsOrderUpdate ? { order: nextOrder } : {}),
                ...(needsSectionUpdate
                  ? {
                      settings: {
                        ...getFieldSettings(field),
                        section: group.section,
                      },
                    }
                  : {}),
              },
            })
          }
        }
      } finally {
        fieldReorderInFlight.current = false
      }
    },
    [selectedTemplate, updateField],
  )

  function toggleTemplate(template: QuestionnaireTemplate) {
    updateTemplate.mutate({
      id: template.id,
      input: { status: template.status === "active" ? "draft" : "active" },
    })
  }

  function addQuestionnaireSection(sectionName: string) {
    if (!sectionName.trim() || !selectedTemplate) return null
    const section = normalizeSectionName(sectionName)
    if (builderSections.includes(section)) return section
    saveSectionNames([...builderSections, section])
    return section
  }

  function renameSection(section: string, renamedSectionName: string) {
    if (!selectedTemplate) return
    const nextSection = normalizeSectionName(renamedSectionName)
    if (nextSection === section) return

    saveSectionNames(
      uniqueSectionNames(
        builderSections.map((item) => (item === section ? nextSection : item)),
      ),
    )
    fields
      .filter((field) => getFieldSection(field) === section)
      .forEach((field) => {
        updateField.mutate({
          templateId: selectedTemplate.id,
          fieldId: field.id,
          input: {
            settings: {
              ...getFieldSettings(field),
              section: nextSection,
            },
          },
        })
      })
  }

  function deleteQuestionnaireField(field: QuestionnaireField) {
    if (!selectedTemplate) return
    const section = getFieldSection(field)
    const willLeaveSectionEmpty =
      fields.filter((item) => getFieldSection(item) === section).length === 1

    deleteField.mutate(
      {
        templateId: selectedTemplate.id,
        fieldId: field.id,
      },
      {
        onSuccess: () => {
          if (willLeaveSectionEmpty) {
            saveSectionNames(builderSections.filter((item) => item !== section))
          }
        },
      },
    )
  }

  function deleteSection(section: string) {
    if (!selectedTemplate) return
    const sectionFields = fields.filter(
      (field) => getFieldSection(field) === section,
    )

    openConfirm({
      title: "Excluir seção",
      description:
        sectionFields.length > 0
          ? `Excluir a seção "${section}" e suas ${sectionFields.length} perguntas? Esta ação não pode ser desfeita.`
          : `Excluir a seção "${section}"?`,
      destructive: true,
      confirmLabel: "Excluir",
      onConfirm: () => {
        sectionFields.forEach((field) => {
          deleteField.mutate({
            templateId: selectedTemplate.id,
            fieldId: field.id,
          })
        })
        saveSectionNames(builderSections.filter((item) => item !== section))
        if (sectionFields.some((field) => field.id === selectedFieldId)) {
          setSelectedFieldId(null)
        }
        closeConfirm()
      },
    })
  }

  async function duplicateSection(section: string) {
    if (!selectedTemplate || !canManage) return
    const sectionFields = fields.filter(
      (field) => getFieldSection(field) === section,
    )
    const nextSection = duplicateSectionName(section, builderSections)
    saveSectionNames([...builderSections, nextSection])

    let order =
      fields.length === 0
        ? 0
        : Math.max(...fields.map((field) => field.order)) + 10

    for (const field of sectionFields) {
      const kind = getQuestionKindFromField(field)
      await createField.mutateAsync({
        templateId: selectedTemplate.id,
        input: {
          key: uniqueQuestionKey(`${field.label} cópia`, fields),
          label: field.label,
          type: field.type,
          required: field.required,
          order: (order += 10),
          placeholder: field.placeholder ?? undefined,
          helpText: field.helpText ?? undefined,
          options: field.options ?? undefined,
          settings: {
            ...getFieldSettings(field),
            section: nextSection,
            inputKind: kind,
          },
        },
      })
    }
  }

  function insertCatalogField(item: FieldDefinition, section?: string) {
    if (!selectedTemplate || !canManage) return

    const targetSection = normalizeSectionName(
      section ?? builderSections[0] ?? DEFAULT_SECTION,
    )
    if (!builderSections.includes(targetSection)) {
      saveSectionNames(uniqueSectionNames([...builderSections, targetSection]))
    }

    const order =
      fields.length === 0
        ? 0
        : Math.max(...fields.map((field) => field.order)) + 10

    const input = catalogFieldToCreateInput(item, {
      key: uniqueQuestionKey(item.label, fields),
      order,
      section: targetSection,
    })

    createField.mutate(
      { templateId: selectedTemplate.id, input },
      { onSuccess: () => setFieldDirty(false) },
    )
  }

  function insertLibraryField(item: FieldLibraryItem, section?: string) {
    if (!selectedTemplate || !canManage) return

    const targetSection = normalizeSectionName(
      section ?? builderSections[0] ?? DEFAULT_SECTION,
    )
    const order =
      fields.length === 0
        ? 0
        : Math.max(...fields.map((field) => field.order)) + 10

    const form = emptyFieldForm(targetSection, order, item.kind)
    form.label = item.defaultLabel
    if (item.placeholder) form.placeholder = item.placeholder

    const input = buildFieldInputFromForm(form, fields)
    if (!input) return

    createField.mutate(
      { templateId: selectedTemplate.id, input },
      {
        onSuccess: () => {
          setFieldDirty(false)
        },
      },
    )
  }

  async function insertBlock(block: BlockDefinition) {
    if (!selectedTemplate || !canManage) return

    const orderStart =
      fields.length === 0 ? 0 : Math.max(...fields.map((field) => field.order)) + 10

    const result = instantiateBlock({
      block,
      existingKeys: fields.map((field) => field.key),
      orderStart,
    })

    if (!builderSections.includes(result.section)) {
      saveSectionNames(uniqueSectionNames([...builderSections, result.section]))
    }

    for (const field of result.fields) {
      await createField.mutateAsync({
        templateId: selectedTemplate.id,
        input: instantiatedFieldToCreateInput(field),
      })
    }

    if (result.rules.length > 0) {
      const currentRules = templateRules as FormRuleDefinition[]
      const merged = mergeTemplateRules(currentRules, result.rules)
      setTemplateRules(merged)
      setRulesEngineVersion(2)
      scheduleSettingsSave(
        serializeRulesToSettings(
          selectedTemplate.settings as Record<string, unknown>,
          merged,
          2,
        ),
      )
    }

    setBlockLibraryOpen(false)
    setFieldDirty(false)
  }

  async function handleWizardComplete(result: TemplateWizardResult) {
    if (!canManage) return

    setWizardPending(true)
    try {
      const template = await createTemplate.mutateAsync(result.input)
      setSelectedTemplateId(template.id)

      if (result.smart) {
        const blocks = resolveWizardBlocks(
          result.branchId,
          result.selectedModuleIds,
        )
        const sections = new Set<string>()
        const existingKeys: string[] = []
        let orderStart = 0
        let mergedRules: FormRuleDefinition[] = []

        for (const block of blocks) {
          const blockResult = instantiateBlock({
            block,
            existingKeys,
            orderStart,
          })

          existingKeys.push(...blockResult.fields.map((field) => field.key))
          orderStart =
            (blockResult.fields.at(-1)?.order ?? orderStart) + 10
          sections.add(blockResult.section)

          for (const field of blockResult.fields) {
            await createField.mutateAsync({
              templateId: template.id,
              input: instantiatedFieldToCreateInput(field),
            })
          }

          if (blockResult.rules.length > 0) {
            mergedRules = mergeTemplateRules(mergedRules, blockResult.rules)
          }
        }

        const baseSettings = {
          ...(template.settings as Record<string, unknown>),
          ...(result.input.settings as Record<string, unknown>),
          questionnaireSections: [...sections],
        }

        await updateTemplate.mutateAsync({
          id: template.id,
          input: {
            settings: serializeRulesToSettings(
              baseSettings,
              mergedRules,
              mergedRules.length > 0 ? 2 : 1,
            ),
          },
        })

        setCreatedTemplateName(template.name)
        setOnboardingOpen(true)
      }

      setWizardOpen(false)
      setFieldDirty(false)
    } finally {
      setWizardPending(false)
    }
  }

  async function duplicateField(field: QuestionnaireField) {
    if (!selectedTemplate || !canManage) return
    const kind = getQuestionKindFromField(field)
    const order = Math.max(...fields.map((item) => item.order)) + 10

    await createField.mutateAsync({
      templateId: selectedTemplate.id,
      input: {
        key: uniqueQuestionKey(`${field.label} (cópia)`, fields),
        label: `${field.label} (cópia)`,
        type: field.type,
        required: field.required,
        order,
        placeholder: field.placeholder ?? undefined,
        helpText: field.helpText ?? undefined,
        options: field.options ?? undefined,
        settings: {
          ...getFieldSettings(field),
          section: getFieldSection(field),
          inputKind: kind,
        },
      },
    })
  }

  function saveFieldProperties(input: CreateQuestionnaireFieldInput) {
    if (!selectedTemplate || !selectedFieldId) return
    updateField.mutate(
      {
        templateId: selectedTemplate.id,
        fieldId: selectedFieldId,
        input,
      },
      {
        onSuccess: () => setFieldDirty(false),
      },
    )
  }

  function requestDeleteField(field: QuestionnaireField) {
    openConfirm({
      title: "Excluir pergunta",
      description: `Excluir "${field.label}"? Esta ação não pode ser desfeita.`,
      destructive: true,
      confirmLabel: "Excluir",
      onConfirm: () => {
        deleteQuestionnaireField(field)
        if (selectedFieldId === field.id) setSelectedFieldId(null)
        closeConfirm()
      },
    })
  }

  function handlePublish() {
    if (!selectedTemplate) return
    updateTemplate.mutate({
      id: selectedTemplate.id,
      input: { status: "active" },
    })
  }

  const reorderPending =
    updateField.isPending || updateTemplate.isPending || fieldReorderInFlight.current

  return (
    <TooltipProvider>
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="flex min-h-0 flex-1 flex-col gap-[var(--if-layout-section-gap)] px-[var(--if-layout-page-x)] py-[var(--if-layout-page-y)]"
      >
        <QuestionnaireNavTabs />

        <QuestionnaireBuilderHeader
          search={searchInput}
          status={status}
          template={selectedTemplate}
          autoSaveStatus={autoSaveStatus}
          onSearchChange={setSearchInput}
          onStatusChange={setStatus}
          onImport={() => setTemplateDialogOpen(true)}
          onNewTemplate={() => {
            setEditingTemplate(null)
            setWizardOpen(true)
          }}
          onTogglePreview={() => {
            if (window.matchMedia("(min-width: 1280px)").matches) return
            if (window.matchMedia("(min-width: 1024px)").matches) {
              setPreviewCollapsed((value) => !value)
              return
            }
            setPreviewOpen(true)
          }}
          onToggleTemplates={() => setTemplatesOpen(true)}
          onToggleRules={() => setRulesOpen(true)}
          onToggleBlocks={() => setBlockLibraryOpen(true)}
          onSave={() => void handleSave()}
          onPublish={handlePublish}
          previewOpen={previewOpen || !previewCollapsed}
          canManage={canManage}
          publishDisabled={
            !selectedTemplate || selectedTemplate.status === "active"
          }
          savePending={templatesQuery.isFetching || fieldsQuery.isFetching}
        />

        <div
          className={cn(
            "grid min-h-0 flex-1 gap-[var(--if-space-4)]",
            "grid-cols-1",
            "xl:grid-cols-[20%_minmax(0,55fr)_25%]",
          )}
        >
          <div className="hidden min-h-0 overflow-hidden xl:block">
            <div className="h-full max-h-full overflow-y-auto overscroll-contain pr-1">
              <QuestionnaireTemplateList
              templates={templates}
              selectedId={selectedTemplate?.id ?? null}
              loading={templatesQuery.isLoading}
              error={templatesQuery.isError ? templatesQuery.error : null}
              onSelect={(template) => setSelectedTemplateId(template.id)}
              onEdit={(template) => {
                setEditingTemplate(template)
                setTemplateDialogOpen(true)
              }}
              onToggle={toggleTemplate}
              onDelete={(template) => {
                openConfirm({
                  title: "Excluir template",
                  description: `Excluir ou arquivar "${template.name}"?`,
                  destructive: true,
                  confirmLabel: "Excluir",
                  onConfirm: () => {
                    deleteTemplate.mutate(template.id)
                    closeConfirm()
                  },
                })
              }}
              onRetry={() => templatesQuery.refetch()}
              canManage={canManage}
              onCreate={() => {
                setEditingTemplate(null)
                setWizardOpen(true)
              }}
            />
            </div>
          </div>

          <section
            className="flex min-h-0 flex-col overflow-hidden"
            aria-label="Área do builder"
          >
            {selectedTemplate ? (
              <div className="flex min-h-0 flex-1 flex-col">
              <QuestionnaireBuilderWorkspace
                sectionGroups={sectionGroups}
                allSections={builderSections}
                fields={fields}
                loading={fieldsQuery.isLoading}
                error={fieldsQuery.isError ? fieldsQuery.error : null}
                canManage={canManage}
                reorderPending={reorderPending}
                selectedFieldId={selectedFieldId}
                libraryOpen={libraryOpen}
                libraryTargetSection={libraryTargetSection}
                savePending={updateField.isPending}
                saveError={updateField.error}
                onSelectField={(field) =>
                  setSelectedFieldId(field?.id ?? null)
                }
                onLibraryOpenChange={setLibraryOpen}
                onLibraryTargetSection={setLibraryTargetSection}
                onDirtyChange={setFieldDirty}
                onAddSection={addQuestionnaireSection}
                onRenameSection={renameSection}
                onDuplicateSection={(section) => void duplicateSection(section)}
                onDeleteSection={deleteSection}
                onReorderSections={(groups) =>
                  saveSectionNames(groups.map((group) => group.section))
                }
                onReorderFields={(groups) => void applyFieldReorder(groups)}
                onInsertLibraryField={insertCatalogField}
                onQuickInsertField={insertLibraryField}
                onDuplicateField={(field) => void duplicateField(field)}
                onDeleteField={requestDeleteField}
                onSaveField={saveFieldProperties}
                onCreateSection={addQuestionnaireSection}
                onOpenWizard={() => setWizardOpen(true)}
                onInsertBlock={() => setBlockLibraryOpen(true)}
                onBlankTemplate={() => {
                  if (builderSections.length === 0) {
                    addQuestionnaireSection(DEFAULT_SECTION)
                  }
                }}
              />
              </div>
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-white/[0.12] p-[var(--if-space-8)] text-center text-sm text-muted-foreground">
                Selecione ou crie um template para editar perguntas.
              </div>
            )}
          </section>

          <div className="hidden min-h-0 overflow-hidden xl:block">
            <QuestionnaireFormPreview
              id="questionnaire-preview-panel"
              template={selectedTemplate}
              fields={fields}
              className="h-full max-h-[calc(100svh-12rem)]"
            />
          </div>
        </div>

        {!previewCollapsed ? (
          <div className="pointer-events-none fixed inset-y-0 right-0 z-40 hidden w-[min(100%,380px)] p-[var(--if-space-4)] lg:block xl:hidden">
            <div className="pointer-events-auto h-full">
              <QuestionnaireFormPreview
                template={selectedTemplate}
                fields={fields}
                className="h-full max-h-full shadow-xl"
              />
            </div>
          </div>
        ) : null}

        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-[var(--if-space-2)] text-xs text-muted-foreground">
            <button
              type="button"
              className="rounded-md px-2 py-1 hover:bg-white/[0.05] disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </button>
            <span>
              Página {meta.page} de {meta.totalPages}
            </span>
            <button
              type="button"
              className="rounded-md px-2 py-1 hover:bg-white/[0.05] disabled:opacity-40"
              disabled={page >= meta.totalPages}
              onClick={() =>
                setPage((current) => Math.min(meta.totalPages, current + 1))
              }
            >
              Próxima
            </button>
          </div>
        ) : null}

        {(createTemplate.error ||
          updateTemplate.error ||
          deleteTemplate.error ||
          createField.error ||
          updateField.error ||
          deleteField.error) && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(
              createTemplate.error ??
                updateTemplate.error ??
                deleteTemplate.error ??
                createField.error ??
                updateField.error ??
                deleteField.error,
              "Erro ao processar questionário",
            )}
          </p>
        )}

        <TemplateWizardDialog
          open={canManage && wizardOpen}
          pending={wizardPending || createTemplate.isPending}
          onOpenChange={setWizardOpen}
          onComplete={(result) => void handleWizardComplete(result)}
        />

        <TemplateWizardOnboarding
          open={onboardingOpen}
          templateName={createdTemplateName}
          onOpenChange={setOnboardingOpen}
          onInsertBlock={() => {
            setOnboardingOpen(false)
            setBlockLibraryOpen(true)
          }}
        />

        <QuestionnaireTemplateDialog
          open={canManage && templateDialogOpen}
          template={editingTemplate}
          pending={createTemplate.isPending || updateTemplate.isPending}
          error={createTemplate.error ?? updateTemplate.error}
          onOpenChange={(open) => {
            setTemplateDialogOpen(open)
            if (!open) setEditingTemplate(null)
          }}
          onSubmit={(input) => {
            if (editingTemplate) {
              updateTemplate.mutate(
                { id: editingTemplate.id, input },
                { onSuccess: () => setTemplateDialogOpen(false) },
              )
              return
            }
            createTemplate.mutate(input, {
              onSuccess: (template) => {
                setSelectedTemplateId(template.id)
                setTemplateDialogOpen(false)
              },
            })
          }}
        />

        <BuilderConfirmDialog
          state={confirmState}
          onOpenChange={(open) => {
            if (!open) closeConfirm()
          }}
        />

        <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <SheetContent
            side="left"
            className="w-full border-white/[0.08] bg-background/98 p-0 sm:max-w-md xl:hidden"
          >
            <SheetHeader className="border-b border-white/[0.06] p-[var(--if-space-4)]">
              <SheetTitle>Templates</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto p-[var(--if-space-4)]">
              <QuestionnaireTemplateList
                templates={templates}
                selectedId={selectedTemplate?.id ?? null}
                loading={templatesQuery.isLoading}
                error={templatesQuery.isError ? templatesQuery.error : null}
                onSelect={(template) => {
                  setSelectedTemplateId(template.id)
                  setTemplatesOpen(false)
                }}
                onEdit={(template) => {
                  setEditingTemplate(template)
                  setTemplateDialogOpen(true)
                }}
                onToggle={toggleTemplate}
                onDelete={(template) => {
                  openConfirm({
                    title: "Excluir template",
                    description: `Excluir ou arquivar "${template.name}"?`,
                    destructive: true,
                    confirmLabel: "Excluir",
                    onConfirm: () => {
                      deleteTemplate.mutate(template.id)
                      closeConfirm()
                    },
                  })
                }}
                onRetry={() => templatesQuery.refetch()}
                canManage={canManage}
                onCreate={() => {
                  setEditingTemplate(null)
                  setWizardOpen(true)
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
          <SheetContent
            side="right"
            className="w-full border-white/[0.08] bg-background/95 p-0 sm:max-w-lg lg:hidden"
          >
            <SheetHeader className="border-b border-white/[0.06] p-[var(--if-space-4)]">
              <SheetTitle>Preview do formulário</SheetTitle>
            </SheetHeader>
            <QuestionnaireFormPreview
              template={selectedTemplate}
              fields={fields}
              className="rounded-none border-0 lg:static lg:max-h-none"
            />
          </SheetContent>
        </Sheet>

        <BlockLibraryDrawer
          open={blockLibraryOpen}
          onOpenChange={setBlockLibraryOpen}
          onInsert={(block) => void insertBlock(block)}
          disabled={!canManage || createField.isPending}
        />

        <Sheet open={rulesOpen} onOpenChange={setRulesOpen}>
          <SheetContent
            side="right"
            className="w-full border-white/[0.08] bg-background/98 p-0 sm:max-w-2xl"
          >
            <SheetHeader className="border-b border-white/[0.06] p-[var(--if-space-4)]">
              <SheetTitle>Editor de regras</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto p-[var(--if-space-4)]">
              <RulesEditorPanel
                rules={templateRules}
                fields={fields}
                sections={builderSections}
                engineVersion={rulesEngineVersion}
                onChange={setTemplateRules}
                onEngineVersionChange={setRulesEngineVersion}
              />
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>
    </TooltipProvider>
  )
}

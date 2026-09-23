"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Maximize2,
  Minimize2,
  Monitor,
  PanelRightClose,
  Smartphone,
  Tablet,
  UnfoldHorizontal,
} from "lucide-react"

import { QuestionnaireAnswerField } from "@/components/questionnaires/questionnaire-answer-field"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  QuestionnaireField,
  QuestionnaireTemplate,
} from "@/lib/data-access/modules/questionnaires"
import { questionnaireCompletionPercent } from "@/lib/questionnaires/questionnaire-form-state"
import {
  isEmptyAnswer,
  validateFilledQuestionnaireAnswers,
} from "@/lib/questionnaires/questionnaire-field-validation"
import {
  applyRulesToAnswers,
  evaluateQuestionnaireRules,
} from "@/lib/questionnaires/questionnaire-rules"
import { cn } from "@/lib/utils"

import { builderSurfaces } from "./builder-surfaces"
import {
  previewSectionStorageKey,
  resolvePreviewSectionIndex,
  type BuilderPreviewMode,
} from "./preview-layout"
import { PreviewSectionNav } from "./preview-section-nav"
import type { PreviewViewport } from "./types"
import { getQuestionnaireSections, groupFieldsBySection } from "./utils"
import { scrollToCanvasSection } from "./canvas-empty-state"

type QuestionnaireFormPreviewProps = {
  template: QuestionnaireTemplate | null
  fields: QuestionnaireField[]
  className?: string
  id?: string
  collapsed?: boolean
  syncCanvasNavigation?: boolean
  presentation?: Exclude<BuilderPreviewMode, "collapsed">
  focusSection?: string | null
  onCollapse?: () => void
  onToggleExpanded?: () => void
  onToggleFullscreen?: () => void
}

const viewportButtons: Array<{
  value: PreviewViewport
  label: string
  icon: typeof Monitor
}> = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
]

const PreviewProgress = memo(function PreviewProgress({
  percent,
  page,
  total,
}: {
  percent: number
  page: number
  total: number
}) {
  return (
    <div className="space-y-[var(--if-space-2)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Progresso</span>
        <span className="text-sm font-semibold tabular-nums text-primary">
          {percent}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/[0.08]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Página {page + 1} de {total}
        </span>
        <span>{percent === 100 ? "Completo" : "Em andamento"}</span>
      </div>
    </div>
  )
})

const PageDots = memo(function PageDots({
  total,
  current,
  onSelect,
}: {
  total: number
  current: number
  onSelect: (index: number) => void
}) {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      role="tablist"
      aria-label="Páginas do formulário"
    >
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-selected={index === current}
          aria-label={`Página ${index + 1}`}
          onClick={() => onSelect(index)}
          className={cn(
            "rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            index === current
              ? "size-2.5 bg-primary"
              : "size-2 bg-white/20 hover:bg-white/35",
          )}
        />
      ))}
    </div>
  )
})

const DeviceFrame = memo(function DeviceFrame({
  viewport,
  children,
}: {
  viewport: PreviewViewport
  children: React.ReactNode
}) {
  if (viewport === "desktop") {
    return (
      <div className="w-full rounded-xl border border-white/[0.10] bg-background shadow-if-sm">
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
          <span className="size-2 rounded-full bg-red-400/80" />
          <span className="size-2 rounded-full bg-amber-400/80" />
          <span className="size-2 rounded-full bg-emerald-400/80" />
          <span className="ml-2 flex-1 truncate text-[10px] text-muted-foreground">
            formulário.insureflow.app
          </span>
        </div>
        <div className="p-[var(--if-space-5)]">{children}</div>
      </div>
    )
  }

  const isMobile = viewport === "mobile"

  return (
    <div
      className={cn(
        "mx-auto rounded-[2rem] border-[6px] border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl",
        isMobile ? "w-[min(100%,390px)]" : "w-[min(100%,768px)]",
      )}
    >
      {isMobile ? (
        <div className="mx-auto mb-1.5 h-1 w-14 rounded-full bg-zinc-700" />
      ) : null}
      <div className="overflow-hidden rounded-[1.25rem] bg-background">
        <div className="p-[var(--if-space-4)] md:p-[var(--if-space-5)]">
          {children}
        </div>
      </div>
    </div>
  )
})

function PreviewChromeButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors",
              "hover:bg-white/[0.12] hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              pressed && "bg-primary/15 text-primary",
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export const QuestionnaireFormPreview = memo(function QuestionnaireFormPreview({
  template,
  fields,
  className,
  id,
  collapsed,
  syncCanvasNavigation = true,
  presentation = "docked",
  focusSection,
  onCollapse,
  onToggleExpanded,
  onToggleFullscreen,
}: QuestionnaireFormPreviewProps) {
  const [viewport, setViewport] = useState<PreviewViewport>("desktop")
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const appliedFocusRef = useRef<string | null>(null)
  const templateId = template?.id ?? null

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields],
  )

  const groups = useMemo(() => {
    if (!template) return []
    return groupFieldsBySection(
      orderedFields,
      getQuestionnaireSections(template, orderedFields),
    ).filter((group) => group.fields.length > 0)
  }, [orderedFields, template])

  const ruleResult = useMemo(() => {
    if (!template) return null
    return evaluateQuestionnaireRules(template, orderedFields, answers)
  }, [answers, orderedFields, template])

  const effectiveAnswers = useMemo(() => {
    if (!ruleResult) return answers
    return applyRulesToAnswers(answers, ruleResult)
  }, [answers, ruleResult])

  const visibleGroups = useMemo(() => {
    if (!ruleResult?.rulesActive) return groups
    return groups
      .filter((group) => ruleResult.sectionStates[group.section]?.visible !== false)
      .map((group) => ({
        ...group,
        fields: group.fields.filter(
          (field) => ruleResult.fieldStates[field.key]?.visible !== false,
        ),
      }))
      .filter((group) => group.fields.length > 0)
  }, [groups, ruleResult])

  const visibleSectionKey = useMemo(
    () => visibleGroups.map((group) => group.section).join("\u0001"),
    [visibleGroups],
  )
  const seenTemplateRef = useRef<string | null>(null)
  const stampedTemplateRef = useRef<string | null>(null)
  const focusSectionRef = useRef(focusSection)
  focusSectionRef.current = focusSection

  useEffect(() => {
    if (stampedTemplateRef.current === null) {
      stampedTemplateRef.current = templateId
      return
    }
    if (stampedTemplateRef.current === templateId) return
    stampedTemplateRef.current = templateId
    appliedFocusRef.current = focusSectionRef.current ?? null
  }, [templateId])

  useEffect(() => {
    const names = visibleSectionKey ? visibleSectionKey.split("\u0001") : []
    const templateChanged = seenTemplateRef.current !== templateId
    seenTemplateRef.current = templateId

    if (templateChanged) {
      setAnswers({})
      setOpenSections({})
    }

    if (!templateId) {
      setActiveSection(null)
      return
    }

    const stored = window.sessionStorage.getItem(previewSectionStorageKey(templateId))
    setActiveSection((current) => {
      const index = resolvePreviewSectionIndex(
        names,
        templateChanged ? null : current,
        stored,
      )
      return names[index] ?? null
    })
  }, [templateId, visibleSectionKey])

  useEffect(() => {
    if (!templateId || !focusSection || focusSection === appliedFocusRef.current) {
      return
    }
    const names = visibleSectionKey ? visibleSectionKey.split("\u0001") : []
    if (!names.includes(focusSection)) return
    appliedFocusRef.current = focusSection
    setActiveSection(focusSection)
    window.sessionStorage.setItem(
      previewSectionStorageKey(templateId),
      focusSection,
    )
  }, [focusSection, templateId, visibleSectionKey])

  const completionPercent = useMemo(
    () =>
      questionnaireCompletionPercent(
        orderedFields.filter(
          (field) =>
            !ruleResult?.rulesActive ||
            ruleResult.fieldStates[field.key]?.visible !== false,
        ),
        effectiveAnswers,
        isEmptyAnswer,
      ),
    [effectiveAnswers, orderedFields, ruleResult],
  )

  const previewFieldErrors = useMemo(
    () =>
      validateFilledQuestionnaireAnswers(
        orderedFields,
        effectiveAnswers,
        template?.settings as Record<string, unknown> | undefined,
        template?.name,
      ),
    [effectiveAnswers, orderedFields, template?.settings, template?.name],
  )

  const visibleSectionNames = useMemo(
    () => (visibleSectionKey ? visibleSectionKey.split("\u0001") : []),
    [visibleSectionKey],
  )
  const currentPage = Math.max(
    0,
    visibleSectionNames.indexOf(activeSection ?? ""),
  )
  const totalPages = Math.max(visibleGroups.length, 1)
  const currentGroup = visibleGroups[currentPage]
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage >= visibleGroups.length - 1

  const selectPage = useCallback(
    (index: number) => {
      const section = visibleSectionNames[index]
      if (!section) return
      setActiveSection(section)
      if (templateId) {
        window.sessionStorage.setItem(previewSectionStorageKey(templateId), section)
      }
    },
    [templateId, visibleSectionNames],
  )

  const completedSections = useMemo(() => {
    const done = new Set<string>()
    for (let index = 0; index < currentPage; index += 1) {
      const section = visibleGroups[index]?.section
      if (section) done.add(section)
    }
    return done
  }, [currentPage, visibleGroups])

  const handleSectionNav = useCallback(
    (section: string, index: number) => {
      selectPage(index)
      if (syncCanvasNavigation) {
        scrollToCanvasSection(section)
      }
    },
    [selectPage, syncCanvasNavigation],
  )

  const updateAnswer = useCallback((key: string, value: unknown) => {
    setAnswers((current) => ({ ...current, [key]: value }))
  }, [])

  const toggleSection = useCallback((section: string) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }, [])

  if (collapsed) return null

  return (
    <aside
      id={id}
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
        builderSurfaces.level1,
        className,
      )}
      aria-label="Preview do formulário"
    >
      <div className="shrink-0 space-y-[var(--if-space-3)] border-b border-white/[0.08] bg-white/[0.04] p-[var(--if-space-4)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--if-space-2)]">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold tracking-[-0.02em]">Preview</p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {onCollapse ? (
              <PreviewChromeButton label="Recolher preview" onClick={onCollapse}>
                <PanelRightClose className="size-4" />
              </PreviewChromeButton>
            ) : null}
            {onToggleExpanded && presentation !== "fullscreen" ? (
              <PreviewChromeButton
                label={
                  presentation === "expanded"
                    ? "Reduzir preview"
                    : "Expandir preview"
                }
                pressed={presentation === "expanded"}
                onClick={onToggleExpanded}
              >
                <UnfoldHorizontal className="size-4" />
              </PreviewChromeButton>
            ) : null}
            {onToggleFullscreen ? (
              <PreviewChromeButton
                label={
                  presentation === "fullscreen"
                    ? "Sair da tela cheia"
                    : "Preview em tela cheia"
                }
                pressed={presentation === "fullscreen"}
                onClick={onToggleFullscreen}
              >
                {presentation === "fullscreen" ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </PreviewChromeButton>
            ) : null}
            <div
            className="flex items-center gap-0.5 rounded-lg border border-white/[0.10] bg-white/[0.05] p-0.5"
            role="radiogroup"
            aria-label="Viewport do preview"
          >
            {viewportButtons.map(({ value, label, icon: Icon }) => (
              <Tooltip key={value}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      role="radio"
                      aria-checked={viewport === value}
                      aria-label={label}
                      onClick={() => setViewport(value)}
                      className={cn(
                        "rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        viewport === value
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    />
                  }
                >
                  <Icon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          </div>
        </div>
        <PreviewProgress
          percent={completionPercent}
          page={currentPage}
          total={totalPages}
        />
        {visibleGroups.length > 1 ? (
          <PageDots
            total={visibleGroups.length}
            current={currentPage}
            onSelect={selectPage}
          />
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {presentation !== "docked" ? (
          <PreviewSectionNav
            sections={visibleGroups.map((group) => group.section)}
            currentSection={currentGroup?.section ?? null}
            completedSections={completedSections}
            onSelect={handleSectionNav}
            className="hidden w-40 shrink-0 border-r border-white/[0.06] md:block"
          />
        ) : null}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-white/[0.02] p-[var(--if-space-4)] md:p-[var(--if-space-5)]">
        <DeviceFrame viewport={viewport}>
          {template ? (
            <>
              <header className="space-y-1 border-b border-white/[0.06] pb-[var(--if-space-4)]">
                <p className="text-lg font-semibold tracking-[-0.03em]">
                  {template.name}
                </p>
                {template.description ? (
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                ) : null}
              </header>

              {visibleGroups.length === 0 ? (
                <div className="mt-[var(--if-space-6)] rounded-xl border border-dashed border-white/[0.14] p-[var(--if-space-8)] text-center text-sm text-muted-foreground">
                  Adicione perguntas para simular o formulário.
                </div>
              ) : (
                <>
                  {currentGroup ? (
                    <section className="mt-[var(--if-space-5)]">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-[var(--if-space-3)] py-[var(--if-space-2)] text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        aria-expanded={
                          openSections[currentGroup.section] ?? true
                        }
                        onClick={() => toggleSection(currentGroup.section)}
                      >
                        <span>{currentGroup.section}</span>
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            openSections[currentGroup.section] && "rotate-180",
                          )}
                        />
                      </button>
                      {openSections[currentGroup.section] !== false ? (
                        <div className="mt-[var(--if-space-4)] space-y-[var(--if-space-4)]">
                          {currentGroup.fields.map((field) => {
                            const fieldState = ruleResult?.fieldStates[field.key]
                            return (
                              <QuestionnaireAnswerField
                                key={field.id}
                                field={field}
                                value={effectiveAnswers[field.key]}
                                required={fieldState?.required ?? field.required}
                                disabled={fieldState?.disabled ?? false}
                                error={previewFieldErrors[field.key]}
                                onChange={(value) =>
                                  updateAnswer(field.key, value)
                                }
                              />
                            )
                          })}
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  <footer className="mt-[var(--if-space-6)] flex items-center justify-between gap-[var(--if-space-2)] border-t border-white/[0.06] pt-[var(--if-space-4)]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={isFirstPage}
                      onClick={() => selectPage(Math.max(0, currentPage - 1))}
                    >
                      <ChevronLeft className="size-3.5" />
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5"
                      disabled={isLastPage}
                      onClick={() =>
                        selectPage(Math.min(visibleGroups.length - 1, currentPage + 1))
                      }
                    >
                      {isLastPage ? "Enviar" : "Próxima"}
                      {!isLastPage ? (
                        <ChevronRight className="size-3.5" />
                      ) : null}
                    </Button>
                  </footer>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecione um template para visualizar o formulário.
            </p>
          )}
        </DeviceFrame>
        </div>
      </div>
    </aside>
  )
})

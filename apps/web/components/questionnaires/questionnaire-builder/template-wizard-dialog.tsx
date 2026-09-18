"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  QUESTIONNAIRE_TEMPLATE_STATUSES,
  type CreateQuestionnaireTemplateInput,
  type QuestionnaireTemplateStatus,
} from "@/lib/data-access/modules/questionnaires"

import { statusLabels } from "./constants"
import {
  WIZARD_BRANCHES,
  WIZARD_MODULES,
  computeWizardBlueprintStats,
  defaultSelectedModuleIds,
  getWizardBranch,
  resolveWizardBlocks,
  type WizardBranchId,
  type WizardStartMode,
} from "./template-wizard.config"
import { optionalFormValue } from "./utils"

const STEPS = [
  "Ramo",
  "Início",
  "Módulos",
  "Informações",
  "Resumo",
] as const

export type TemplateWizardResult = {
  input: CreateQuestionnaireTemplateInput
  branchId: WizardBranchId
  startMode: WizardStartMode
  selectedModuleIds: string[]
  smart: boolean
}

type TemplateWizardDialogProps = {
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (result: TemplateWizardResult) => void
}

export function TemplateWizardDialog({
  open,
  pending,
  onOpenChange,
  onComplete,
}: TemplateWizardDialogProps) {
  const [step, setStep] = useState(0)
  const [branchId, setBranchId] = useState<WizardBranchId>("auto")
  const [startMode, setStartMode] = useState<WizardStartMode>("smart")
  const [selectedModules, setSelectedModules] = useState<string[]>(() =>
    defaultSelectedModuleIds("auto"),
  )
  const [name, setName] = useState("Seguro Auto — Cotação")
  const [description, setDescription] = useState("")
  const [version, setVersion] = useState("1")
  const [status, setStatus] = useState<QuestionnaireTemplateStatus>("draft")
  const [category, setCategory] = useState("Auto")
  const [tagsInput, setTagsInput] = useState("auto, comercial")

  useEffect(() => {
    if (!open) return
    setStep(0)
    setBranchId("auto")
    setStartMode("smart")
    setSelectedModules(defaultSelectedModuleIds("auto"))
    setName("Seguro Auto — Cotação")
    setDescription("")
    setVersion("1")
    setStatus("draft")
    setCategory("Auto")
    setTagsInput("auto, comercial")
  }, [open])

  const branch = getWizardBranch(branchId)
  const modules = WIZARD_MODULES[branchId] ?? []
  const stats = useMemo(
    () =>
      startMode === "smart" && branchId !== "personalizado"
        ? computeWizardBlueprintStats(branchId, selectedModules)
        : {
            questionCount: 0,
            sectionCount: 0,
            ruleCount: 0,
            validationCount: 0,
            blockLabels: [],
          },
    [branchId, selectedModules, startMode],
  )

  function selectBranch(next: WizardBranchId) {
    setBranchId(next)
    const card = getWizardBranch(next)
    if (card) {
      setName(card.defaultName)
      setCategory(card.category)
      setTagsInput(`${next}, comercial`)
    }
    setSelectedModules(defaultSelectedModuleIds(next))
    if (next === "personalizado") {
      setStartMode("blank")
    }
  }

  function toggleModule(id: string) {
    setSelectedModules((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    const blocks =
      startMode === "smart" && branchId !== "personalizado"
        ? resolveWizardBlocks(branchId, selectedModules)
        : []

    const sections = [...new Set(blocks.map((block) => block.section))]

    onComplete({
      branchId,
      startMode,
      selectedModuleIds: selectedModules,
      smart: startMode === "smart" && branchId !== "personalizado",
      input: {
        name: name.trim(),
        description: optionalFormValue(description),
        status,
        version: Number(version) || 1,
        settings: {
          wizardBranch: branchId,
          wizardCategory: category.trim() || branch?.category,
          wizardTags: tags,
          wizardSmart: startMode === "smart" && branchId !== "personalizado",
          questionnaireSections: sections,
        },
      },
    })
  }

  const canNext =
    step === 0
      ? Boolean(branchId)
      : step === 1
        ? true
        : step === 2
          ? startMode === "blank" ||
            branchId === "personalizado" ||
            selectedModules.length > 0
          : step === 3
            ? Boolean(name.trim())
            : true

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92svh,820px)] flex-col border-white/[0.08] bg-background/95 sm:max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-[var(--if-space-4)]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Assistente de Template
            </DialogTitle>
            <DialogDescription>
              Monte questionários comerciais em poucos passos — o canvas continua
              sendo o centro da experiência.
            </DialogDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              {STEPS.map((label, index) => (
                <span
                  key={label}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    index === step
                      ? "bg-primary/15 text-primary"
                      : index < step
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-white/[0.06] text-muted-foreground",
                  )}
                >
                  {index + 1}. {label}
                </span>
              ))}
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {step === 0 ? (
              <div className="grid gap-[var(--if-space-3)] sm:grid-cols-2">
                {WIZARD_BRANCHES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectBranch(item.id)}
                    className={cn(
                      "rounded-xl border p-[var(--if-space-4)] text-left transition-colors",
                      branchId === item.id
                        ? "border-primary/40 bg-primary/[0.08] ring-1 ring-primary/25"
                        : "border-white/[0.10] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.05]",
                    )}
                  >
                    <span className="text-2xl" aria-hidden>
                      {item.emoji}
                    </span>
                    <p className="mt-2 font-semibold tracking-[-0.02em]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-[var(--if-space-3)]">
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-[var(--if-space-4)]",
                    startMode === "smart"
                      ? "border-primary/40 bg-primary/[0.08]"
                      : "border-white/[0.10] bg-white/[0.03]",
                    branchId === "personalizado" && "opacity-50",
                  )}
                >
                  <input
                    type="radio"
                    name="start-mode"
                    checked={startMode === "smart"}
                    disabled={branchId === "personalizado"}
                    onChange={() => setStartMode("smart")}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">Template Inteligente</span>
                    <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                      recomendado
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Usa automaticamente a Block Library para montar seções,
                      perguntas e regras padrão do ramo.
                    </p>
                  </span>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-[var(--if-space-4)]",
                    startMode === "blank"
                      ? "border-primary/40 bg-primary/[0.08]"
                      : "border-white/[0.10] bg-white/[0.03]",
                  )}
                >
                  <input
                    type="radio"
                    name="start-mode"
                    checked={startMode === "blank"}
                    onChange={() => setStartMode("blank")}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">Template em Branco</span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cria apenas metadados. Você monta tudo no canvas.
                    </p>
                  </span>
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              startMode === "blank" || branchId === "personalizado" ? (
                <div className="rounded-xl border border-dashed border-white/[0.14] bg-white/[0.03] p-[var(--if-space-8)] text-center">
                  <p className="text-sm font-medium">Template em branco</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nenhum módulo será inserido automaticamente. Continue para
                    definir nome e descrição.
                  </p>
                </div>
              ) : (
                <div className="space-y-[var(--if-space-4)]">
                  <div className="grid gap-[var(--if-space-2)] sm:grid-cols-2">
                    {modules.map((module) => (
                      <label
                        key={module.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/[0.10] bg-white/[0.03] px-[var(--if-space-3)] py-[var(--if-space-3)]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(module.id)}
                          onChange={() => toggleModule(module.id)}
                        />
                        <span className="text-sm">{module.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="grid gap-[var(--if-space-2)] rounded-xl border border-white/[0.10] bg-white/[0.04] p-[var(--if-space-4)] sm:grid-cols-3">
                    <StatPill label="Perguntas" value={stats.questionCount} />
                    <StatPill label="Seções" value={stats.sectionCount} />
                    <StatPill
                      label="Regras automáticas"
                      value={stats.ruleCount}
                    />
                  </div>
                </div>
              )
            ) : null}

            {step === 3 ? (
              <div className="grid gap-[var(--if-space-4)] sm:grid-cols-2">
                <label className="space-y-[var(--if-space-2)] sm:col-span-2">
                  <span className="text-sm font-medium">Nome</span>
                  <Input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="space-y-[var(--if-space-2)] sm:col-span-2">
                  <span className="text-sm font-medium">Descrição</span>
                  <Input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>
                <label className="space-y-[var(--if-space-2)]">
                  <span className="text-sm font-medium">Versão</span>
                  <Input
                    type="number"
                    min={1}
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                  />
                </label>
                <label className="space-y-[var(--if-space-2)]">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as QuestionnaireTemplateStatus)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background/40 px-3 py-1 text-sm"
                  >
                    {QUESTIONNAIRE_TEMPLATE_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {statusLabels[item]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-[var(--if-space-2)]">
                  <span className="text-sm font-medium">Categoria</span>
                  <Input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
                </label>
                <label className="space-y-[var(--if-space-2)]">
                  <span className="text-sm font-medium">Tags</span>
                  <Input
                    value={tagsInput}
                    onChange={(event) => setTagsInput(event.target.value)}
                    placeholder="auto, frota, comercial"
                  />
                </label>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-[var(--if-space-4)] rounded-xl border border-white/[0.10] bg-white/[0.04] p-[var(--if-space-5)]">
                <SummaryRow label="Produto" value={branch?.title ?? "—"} />
                <SummaryRow
                  label="Modo"
                  value={
                    startMode === "smart" && branchId !== "personalizado"
                      ? "Template Inteligente"
                      : "Template em Branco"
                  }
                />
                <SummaryRow
                  label="Blocos"
                  value={
                    stats.blockLabels.length
                      ? stats.blockLabels.join(", ")
                      : "Nenhum (canvas vazio)"
                  }
                />
                <SummaryRow
                  label="Perguntas"
                  value={String(stats.questionCount)}
                />
                <SummaryRow
                  label="Regras automáticas"
                  value={String(stats.ruleCount)}
                />
                <SummaryRow
                  label="Validações"
                  value={String(stats.validationCount)}
                />
                <SummaryRow label="Nome final" value={name} />
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setStep((current) => current - 1)}
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setStep((current) => current + 1)}
                >
                  Continuar
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={pending || !canNext}>
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Criar Template
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold tabular-nums text-primary">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/[0.06] pb-[var(--if-space-3)] last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium sm:max-w-[65%] sm:text-right">
        {value}
      </span>
    </div>
  )
}

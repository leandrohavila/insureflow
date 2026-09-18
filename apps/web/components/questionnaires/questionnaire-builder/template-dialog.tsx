"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

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
import { getErrorMessage } from "@/lib/data-access"
import {
  QUESTIONNAIRE_TEMPLATE_STATUSES,
  type CreateQuestionnaireTemplateInput,
  type QuestionnaireTemplate,
  type QuestionnaireTemplateStatus,
} from "@/lib/data-access/modules/questionnaires"

import { statusLabels } from "./constants"
import { optionalFormValue } from "./utils"

type TemplateForm = {
  name: string
  description: string
  status: QuestionnaireTemplateStatus
  version: string
}

type QuestionnaireTemplateDialogProps = {
  open: boolean
  template: QuestionnaireTemplate | null
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateQuestionnaireTemplateInput) => void
}

export function QuestionnaireTemplateDialog({
  open,
  template,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: QuestionnaireTemplateDialogProps) {
  const [form, setForm] = useState<TemplateForm>({
    name: "",
    description: "",
    status: "draft",
    version: "1",
  })

  useEffect(() => {
    if (!open) return
    setForm({
      name: template?.name ?? "",
      description: template?.description ?? "",
      status: template?.status ?? "draft",
      version: String(template?.version ?? 1),
    })
  }, [open, template])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      name: form.name.trim(),
      description: optionalFormValue(form.description),
      status: form.status,
      version: Number(form.version) || 1,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-[var(--if-space-5)]">
          <DialogHeader>
            <DialogTitle>
              {template ? "Editar template" : "Novo template"}
            </DialogTitle>
            <DialogDescription>
              Mantenha somente o necessário para o corretor preencher
              internamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-[var(--if-space-4)] sm:grid-cols-2">
            <label className="space-y-[var(--if-space-2)] sm:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex.: Seguro auto individual"
              />
            </label>
            <label className="space-y-[var(--if-space-2)]">
              <span className="text-sm font-medium">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as QuestionnaireTemplateStatus,
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {QUESTIONNAIRE_TEMPLATE_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {statusLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-[var(--if-space-2)]">
              <span className="text-sm font-medium">Versão</span>
              <Input
                type="number"
                min={1}
                value={form.version}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    version: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-[var(--if-space-2)] sm:col-span-2">
              <span className="text-sm font-medium">Descrição</span>
              <Input
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Quando este questionário deve ser usado"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar template")}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar template"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

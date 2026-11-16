"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2, X } from "lucide-react"

import {
  pipelineStages,
  type CreateCrmDealInput,
  type CrmDeal,
  type CrmStageId,
} from "@/lib/data-access/modules/crm"
import { getErrorMessage } from "@/lib/data-access"
import { FormSelect } from "@/components/design-system/forms"
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

type NewDealForm = {
  title: string
  company: string
  value: string
  stage: CrmStageId
  assignedTo: string
}

export function DealFormDialog({
  deal,
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  deal?: CrmDeal | null
  open: boolean
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateCrmDealInput) => void
}) {
  const [form, setForm] = useState<NewDealForm>({
    title: "",
    company: "",
    value: "",
    stage: "novo",
    assignedTo: "",
  })

  useEffect(() => {
    if (!open) return
    setForm({
      title: deal?.title ?? "",
      company: deal?.company ?? "",
      value: deal ? String(deal.value) : "",
      stage: deal?.stage ?? "novo",
      assignedTo: deal?.assignedTo ?? "",
    })
  }, [deal, open])

  function update<K extends keyof NewDealForm>(key: K, value: NewDealForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(form.value)
    if (!form.title.trim() || !form.company.trim() || Number.isNaN(value))
      return

    onSubmit({
      title: form.title.trim(),
      company: form.company.trim(),
      value,
      stage: form.stage,
      status: deal?.status ?? "open",
      assignedTo: form.assignedTo.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="avila-lead-surface gap-0 border-[#d6cfc4] bg-[var(--avila-ivory)] p-0! text-[var(--avila-navy-900)] sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex max-h-[min(90vh,760px)] flex-col">
          <DialogHeader className="border-b border-[#e4ddd2] bg-white px-6! py-4! pr-12!">
            <DialogTitle>{deal ? "Editar negócio" : "Novo negócio"}</DialogTitle>
            <DialogDescription>
              {deal
                ? "Atualize os dados do negócio sem alterar o contrato do backend."
                : "Crie uma oportunidade real no backend e atualize o pipeline automaticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6! py-5! sm:grid-cols-2">
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Título</span>
              <Input
                required
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Ex.: Frota corporativa"
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Empresa</span>
              <Input
                required
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder="Ex.: Transportes Sul"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Valor</span>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.value}
                onChange={(event) => update("value", event.target.value)}
                placeholder="67000"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Estágio</span>
              <FormSelect
                value={form.stage}
                onChange={(event) =>
                  update("stage", event.target.value as CrmStageId)
                }
                options={pipelineStages.map((stage) => ({
                  value: stage.id,
                  label: stage.label,
                }))}
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Responsável</span>
              <Input
                value={form.assignedTo}
                onChange={(event) => update("assignedTo", event.target.value)}
                placeholder="Ex.: Ana Costa"
              />
            </label>
          </div>

          {error ? (
            <p className="mx-6! rounded-lg border border-destructive/30 bg-destructive/10 px-3! py-2! text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar negócio")}
            </p>
          ) : null}

          <DialogFooter className="mx-0! mb-0! border-t border-[#e4ddd2] bg-white px-6! py-4!">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
              Cancelar
            </Button>
            <Button type="submit" variant="save" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                deal ? "Salvar alterações" : "Salvar negócio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

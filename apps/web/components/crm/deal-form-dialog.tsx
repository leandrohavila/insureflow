"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import {
  pipelineStages,
  type CreateCrmDealInput,
  type CrmDeal,
  type CrmStageId,
} from "@/lib/data-access/modules/crm"
import { getErrorMessage } from "@/lib/data-access"
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
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{deal ? "Editar negócio" : "Novo negócio"}</DialogTitle>
            <DialogDescription>
              {deal
                ? "Atualize os dados do negócio sem alterar o contrato do backend."
                : "Crie uma oportunidade real no backend e atualize o pipeline automaticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Título</span>
              <Input
                required
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Ex.: Frota corporativa"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Empresa</span>
              <Input
                required
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder="Ex.: Transportes Sul"
              />
            </label>
            <label className="space-y-2">
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
            <label className="space-y-2">
              <span className="text-sm font-medium">Estágio</span>
              <select
                value={form.stage}
                onChange={(event) =>
                  update("stage", event.target.value as CrmStageId)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {pipelineStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Responsável</span>
              <Input
                value={form.assignedTo}
                onChange={(event) => update("assignedTo", event.target.value)}
                placeholder="Ex.: Ana Costa"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar negócio")}
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

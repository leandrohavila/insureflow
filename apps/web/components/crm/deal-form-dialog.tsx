"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Briefcase } from "lucide-react"

import {
  CrmFormDrawer,
  CrmFormDrawerBody,
  CrmFormDrawerCancel,
  CrmFormDrawerFooter,
  CrmFormDrawerHeader,
  CrmFormDrawerSection,
  CrmFormDrawerSubmit,
  crmDrawerInputClass,
} from "@/components/crm/crm-form-drawer"
import {
  formatDealValueFromNumber,
  maskDealValue,
  parseDealValue,
} from "@/components/crm/deal-form-money"
import {
  pipelineStages,
  type CreateCrmDealInput,
  type CrmDeal,
  type CrmStageId,
} from "@/lib/data-access/modules/crm"
import { getErrorMessage } from "@/lib/data-access"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const stageDotClass: Partial<Record<CrmStageId, string>> = {
  novo: "bg-[#5B8DEF]",
  contato: "bg-[#8B7CC8]",
  cotacao: "bg-[#10294B]",
  proposta: "bg-[#C09048]",
  fechamento: "bg-[#3E8F6E]",
}

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
  businessUnitId,
  onOpenChange,
  onSubmit,
}: {
  deal?: CrmDeal | null
  open: boolean
  pending: boolean
  error: unknown
  businessUnitId?: string | null
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
      value: deal ? formatDealValueFromNumber(deal.value) : "",
      stage: deal?.stage ?? "novo",
      assignedTo: deal?.assignedTo ?? "",
    })
  }, [deal, open])

  function update<K extends keyof NewDealForm>(key: K, value: NewDealForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = parseDealValue(form.value)
    if (!form.title.trim() || !form.company.trim() || value == null) return

    const activeUnit = businessUnitId?.trim()
    onSubmit({
      title: form.title.trim(),
      company: form.company.trim(),
      value,
      stage: form.stage,
      status: deal?.status ?? "open",
      assignedTo: form.assignedTo.trim() || undefined,
      businessUnitId: deal || !activeUnit ? undefined : activeUnit,
    })
  }

  return (
    <CrmFormDrawer open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
        <CrmFormDrawerHeader
          icon={Briefcase}
          title={deal ? "Editar negócio" : "Novo negócio"}
          description={
            deal
              ? "Atualize os dados do negócio sem alterar o contrato do backend."
              : "Crie uma oportunidade real no backend e atualize o pipeline automaticamente."
          }
        />

        <CrmFormDrawerBody className="gap-4 px-5! py-4!">
          <CrmFormDrawerSection title="Identificação" className="gap-4 p-4!">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#10294B]">Título</span>
                <Input
                  required
                  className={crmDrawerInputClass}
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="Ex.: Frota corporativa"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#10294B]">Empresa</span>
                <Input
                  required
                  className={crmDrawerInputClass}
                  value={form.company}
                  onChange={(event) => update("company", event.target.value)}
                  placeholder="Ex.: Transportes Sul"
                />
              </label>
            </div>
          </CrmFormDrawerSection>

          <CrmFormDrawerSection title="Condições comerciais" className="gap-4 p-4!">
            <div className="grid gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#10294B]">Valor</span>
                <Input
                  required
                  className={crmDrawerInputClass}
                  inputMode="decimal"
                  autoComplete="off"
                  value={form.value}
                  onChange={(event) =>
                    update("value", maskDealValue(event.target.value))
                  }
                  onBlur={(event) => {
                    const parsed = parseDealValue(event.currentTarget.value)
                    if (parsed == null) return
                    update("value", formatDealValueFromNumber(parsed))
                  }}
                  placeholder="R$ 67.000,00"
                />
              </label>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium text-[#10294B]">
                  Estágio
                </legend>
                <div className="flex flex-wrap gap-2">
                  {pipelineStages.map((stage) => {
                    const selected = form.stage === stage.id
                    return (
                      <label
                        key={stage.id}
                        className={cn(
                          "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm leading-none font-medium whitespace-nowrap",
                          selected
                            ? "border-[#10294B] bg-[#10294B] text-white"
                            : "border-[#D6CFC4] bg-white text-[#10294B] hover:bg-[#F6F1E8]",
                        )}
                      >
                        <input
                          type="radio"
                          name="deal-stage"
                          value={stage.id}
                          checked={selected}
                          onChange={() => update("stage", stage.id)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            selected
                              ? "bg-[#F6F1E8]"
                              : (stageDotClass[stage.id] ?? "bg-[#10294B]"),
                          )}
                        />
                        {stage.label}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#10294B]">
                  Responsável
                </span>
                <Input
                  className={crmDrawerInputClass}
                  value={form.assignedTo}
                  onChange={(event) => update("assignedTo", event.target.value)}
                  placeholder="Ex.: Ana Costa"
                />
              </label>
            </div>
          </CrmFormDrawerSection>
        </CrmFormDrawerBody>

        {error ? (
          <p
            className="mx-4 mb-3 shrink-0 rounded-lg border border-[#e7c4c4] bg-[#fdf3f2] px-3 py-2 text-sm text-[#9f2d2d]"
            role="alert"
          >
            {getErrorMessage(error, "Erro ao salvar negócio")}
          </p>
        ) : null}

        <CrmFormDrawerFooter>
          <CrmFormDrawerCancel
            disabled={pending}
            onClick={() => onOpenChange(false)}
          />
          <CrmFormDrawerSubmit pending={pending}>
            {deal ? "Salvar alterações" : "Criar negócio"}
          </CrmFormDrawerSubmit>
        </CrmFormDrawerFooter>
      </form>
    </CrmFormDrawer>
  )
}

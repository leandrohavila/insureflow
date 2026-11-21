"use client"

import { useEffect, useState } from "react"
import { FileSpreadsheet } from "lucide-react"

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
import { FormField, FormLayout } from "@/components/design-system"
import { Input } from "@/components/ui/input"
import {
  QUOTE_WORKFLOW_STATUSES,
  useCreateQuoteComparison,
  useUpdateQuoteComparison,
  type QuoteComparison,
  type QuoteWorkflowStatus,
} from "@/lib/data-access/modules/quotes"
import { getErrorMessage } from "@/lib/data-access"

import { quoteWorkflowLabel } from "./quote-status-labels"

const textareaClass =
  "flex min-h-20 w-full resize-y rounded-lg border border-[#D6CFC4] bg-white px-3 py-2 text-sm text-[#10294B] shadow-none outline-none placeholder:text-[#5C6578] focus-visible:border-[#10294B] focus-visible:ring-2 focus-visible:ring-[#10294B]/20 disabled:cursor-not-allowed disabled:opacity-50"

type QuoteComparisonDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  dealId: string
  leadId?: string | null
  comparison?: QuoteComparison | null
  onSuccess?: (comparison: QuoteComparison) => void
}

export function QuoteComparisonDrawer({
  open,
  onOpenChange,
  mode,
  dealId,
  leadId = null,
  comparison = null,
  onSuccess,
}: QuoteComparisonDrawerProps) {
  const createComparison = useCreateQuoteComparison()
  const updateComparison = useUpdateQuoteComparison()

  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [workflowStatus, setWorkflowStatus] =
    useState<QuoteWorkflowStatus>("received")
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    if (mode === "edit" && comparison) {
      setTitle(comparison.title ?? "")
      setNotes(comparison.notes ?? "")
      setWorkflowStatus(comparison.workflowStatus)
      return
    }
    setTitle("")
    setNotes("")
    setWorkflowStatus("received")
  }, [open, mode, comparison])

  const isPending = createComparison.isPending || updateComparison.isPending

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError(null)

    try {
      if (mode === "create") {
        const created = await createComparison.mutateAsync({
          title: title.trim() || undefined,
          notes: notes.trim() || undefined,
          dealId,
          leadId: leadId ?? undefined,
        })
        onSuccess?.(created)
        onOpenChange(false)
        return
      }

      if (!comparison) return

      const updated = await updateComparison.mutateAsync({
        id: comparison.id,
        input: {
          title: title.trim() || undefined,
          notes: notes.trim() || undefined,
          workflowStatus,
        },
      })
      onSuccess?.(updated)
      onOpenChange(false)
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Não foi possível salvar o comparativo."))
    }
  }

  return (
    <CrmFormDrawer open={open} onOpenChange={onOpenChange}>
        <form className="flex h-full min-h-0 flex-col" onSubmit={(e) => void handleSubmit(e)}>
          <CrmFormDrawerHeader
            icon={FileSpreadsheet}
            title={mode === "create" ? "Nova cotação" : "Editar comparativo"}
            description="Central de cotações deste negócio."
          />

          <CrmFormDrawerBody>
            <CrmFormDrawerSection title="Dados do comparativo">
            <FormLayout columns="1">
              <FormField label="Título" htmlFor="comparison-title">
                <Input
                  id="comparison-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Comparativo Auto — Jul/2026"
                />
              </FormField>

              {mode === "edit" ? (
                <FormField label="Status do fluxo" htmlFor="comparison-workflow">
                  <select
                    id="comparison-workflow"
                    value={workflowStatus}
                    onChange={(event) =>
                      setWorkflowStatus(event.target.value as QuoteWorkflowStatus)
                    }
                    className={crmDrawerInputClass}
                  >
                    {QUOTE_WORKFLOW_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {quoteWorkflowLabel(status)}
                      </option>
                    ))}
                  </select>
                </FormField>
              ) : null}

              <FormField label="Observações" htmlFor="comparison-notes" fullWidth>
                <textarea
                  id="comparison-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Notas internas sobre o comparativo…"
                  className={textareaClass}
                />
              </FormField>
            </FormLayout>

            {submitError ? (
              <p className="rounded-lg border border-[#e7c4c4] bg-[#fdf3f2] p-3 text-sm text-[#9f2d2d]" role="alert">
                {submitError}
              </p>
            ) : null}
            </CrmFormDrawerSection>
          </CrmFormDrawerBody>

          <CrmFormDrawerFooter>
            <CrmFormDrawerCancel
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            />
            <CrmFormDrawerSubmit pending={isPending}>
              {mode === "create" ? "Criar comparativo" : "Salvar alterações"}
            </CrmFormDrawerSubmit>
          </CrmFormDrawerFooter>
        </form>
    </CrmFormDrawer>
  )
}

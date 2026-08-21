"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { FormField, FormLayout } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-white/[0.08] bg-background/95 p-0 backdrop-blur-xl sm:max-w-lg"
      >
        <form className="flex h-full flex-col" onSubmit={(e) => void handleSubmit(e)}>
          <SheetHeader className="border-b border-white/[0.06] px-6 py-5 text-left">
            <SheetDescription className="text-xs text-primary">
              Central de cotações
            </SheetDescription>
            <SheetTitle className="text-xl font-semibold tracking-[-0.03em]">
              {mode === "create" ? "Nova cotação" : "Editar comparativo"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
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
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
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
              <p className="mt-3 text-sm text-destructive" role="alert">
                {submitError}
              </p>
            ) : null}
          </div>

          <SheetFooter className="border-t border-white/[0.06] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando…
                </>
              ) : mode === "create" ? (
                "Criar comparativo"
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

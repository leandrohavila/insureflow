"use client"

import { useEffect, useState } from "react"
import { Shield } from "lucide-react"

import {
  CrmFormDrawer,
  CrmFormDrawerBody,
  CrmFormDrawerCancel,
  CrmFormDrawerFooter,
  CrmFormDrawerHeader,
  CrmFormDrawerSection,
  CrmFormDrawerSubmit,
} from "@/components/crm/crm-form-drawer"
import { FormField, FormLayout } from "@/components/design-system"
import { Input } from "@/components/ui/input"
import {
  useAddQuoteLine,
  useUpdateQuoteLine,
  type QuoteLine,
} from "@/lib/data-access/modules/quotes"
import { getErrorMessage } from "@/lib/data-access"
const textareaClass =
  "flex min-h-20 w-full resize-y rounded-lg border border-[#D6CFC4] bg-white px-3 py-2 text-sm text-[#10294B] shadow-none outline-none placeholder:text-[#5C6578] focus-visible:border-[#10294B] focus-visible:ring-2 focus-visible:ring-[#10294B]/20 disabled:cursor-not-allowed disabled:opacity-50"

type QuoteLineDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  comparisonId: string
  line?: QuoteLine | null
  onSuccess?: () => void
}

function parseCoverages(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatCoverages(coverages: string[]) {
  return coverages.join(", ")
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".")
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function QuoteLineDrawer({
  open,
  onOpenChange,
  mode,
  comparisonId,
  line = null,
  onSuccess,
}: QuoteLineDrawerProps) {
  const addLine = useAddQuoteLine()
  const updateLine = useUpdateQuoteLine()

  const [insurer, setInsurer] = useState("")
  const [product, setProduct] = useState("")
  const [plan, setPlan] = useState("")
  const [premiumValue, setPremiumValue] = useState("")
  const [franchiseValue, setFranchiseValue] = useState("")
  const [coverages, setCoverages] = useState("")
  const [assistance, setAssistance] = useState("")
  const [observations, setObservations] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (mode === "edit" && line) {
      setInsurer(line.insurer)
      setProduct(line.product ?? "")
      setPlan(line.plan ?? "")
      setPremiumValue(String(line.premiumValue))
      setFranchiseValue(
        line.franchiseValue != null ? String(line.franchiseValue) : "",
      )
      setCoverages(formatCoverages(line.coverages))
      setAssistance(line.assistance ?? "")
      setObservations(line.observations ?? "")
      setError(null)
      return
    }
    setInsurer("")
    setProduct("")
    setPlan("")
    setPremiumValue("")
    setFranchiseValue("")
    setCoverages("")
    setAssistance("")
    setObservations("")
    setError(null)
  }, [open, mode, line])

  const isPending = addLine.isPending || updateLine.isPending

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const premium = parseCurrencyInput(premiumValue)
    if (!insurer.trim()) {
      setError("Informe a seguradora.")
      return
    }
    if (!Number.isFinite(premium) || premium <= 0) {
      setError("Informe um prêmio válido.")
      return
    }

    const franchiseRaw = franchiseValue.trim()
    const franchise = franchiseRaw
      ? parseCurrencyInput(franchiseRaw)
      : undefined

    if (franchiseRaw && (!Number.isFinite(franchise) || franchise! < 0)) {
      setError("Informe uma franquia válida.")
      return
    }

    const payload = {
      insurer: insurer.trim(),
      product: product.trim() || undefined,
      plan: plan.trim() || undefined,
      premiumValue: premium,
      franchiseValue: franchise,
      coverages: parseCoverages(coverages),
      assistance: assistance.trim() || undefined,
      observations: observations.trim() || undefined,
    }

    try {
      if (mode === "create") {
        await addLine.mutateAsync({ comparisonId, input: payload })
      } else if (line) {
        await updateLine.mutateAsync({
          comparisonId,
          quoteId: line.id,
          input: payload,
        })
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (submitFailure) {
      setError(
        getErrorMessage(submitFailure, "Não foi possível salvar a linha de cotação."),
      )
    }
  }

  return (
    <CrmFormDrawer open={open} onOpenChange={onOpenChange}>
        <form className="flex h-full min-h-0 flex-col" onSubmit={(e) => void handleSubmit(e)}>
          <CrmFormDrawerHeader
            icon={Shield}
            title={mode === "create" ? "Adicionar seguradora" : "Editar linha"}
            description="Linha de cotação deste comparativo."
          />

          <CrmFormDrawerBody>
            <CrmFormDrawerSection title="Seguradora">
            <FormLayout>
              <FormField label="Seguradora" htmlFor="line-insurer" required>
                <Input
                  id="line-insurer"
                  value={insurer}
                  onChange={(event) => setInsurer(event.target.value)}
                  placeholder="Ex.: Porto Seguro"
                />
              </FormField>

              <FormField label="Produto" htmlFor="line-product">
                <Input
                  id="line-product"
                  value={product}
                  onChange={(event) => setProduct(event.target.value)}
                  placeholder="Ex.: Auto"
                />
              </FormField>

              <FormField label="Plano" htmlFor="line-plan">
                <Input
                  id="line-plan"
                  value={plan}
                  onChange={(event) => setPlan(event.target.value)}
                  placeholder="Ex.: Premium"
                />
              </FormField>

              <FormField label="Prêmio (R$)" htmlFor="line-premium" required>
                <Input
                  id="line-premium"
                  inputMode="decimal"
                  value={premiumValue}
                  onChange={(event) => setPremiumValue(event.target.value)}
                  placeholder="Ex.: 2500,00"
                />
              </FormField>

              <FormField label="Franquia (R$)" htmlFor="line-franchise">
                <Input
                  id="line-franchise"
                  inputMode="decimal"
                  value={franchiseValue}
                  onChange={(event) => setFranchiseValue(event.target.value)}
                  placeholder="Ex.: 1500,00"
                />
              </FormField>

              <FormField
                label="Coberturas"
                htmlFor="line-coverages"
                helpText="Separe por vírgula"
                fullWidth
              >
                <Input
                  id="line-coverages"
                  value={coverages}
                  onChange={(event) => setCoverages(event.target.value)}
                  placeholder="Ex.: Colisão, Roubo, Terceiros"
                />
              </FormField>

              <FormField label="Assistência" htmlFor="line-assistance" fullWidth>
                <Input
                  id="line-assistance"
                  value={assistance}
                  onChange={(event) => setAssistance(event.target.value)}
                  placeholder="Ex.: 24h — 500 km"
                />
              </FormField>

              <FormField label="Observações" htmlFor="line-observations" fullWidth>
                <textarea
                  id="line-observations"
                  value={observations}
                  onChange={(event) => setObservations(event.target.value)}
                  rows={3}
                  placeholder="Condições comerciais, restrições…"
                  className={textareaClass}
                />
              </FormField>
            </FormLayout>

            {error ? (
              <p className="rounded-lg border border-[#e7c4c4] bg-[#fdf3f2] p-3 text-sm text-[#9f2d2d]" role="alert">
                {error}
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
              {mode === "create" ? "Adicionar linha" : "Salvar linha"}
            </CrmFormDrawerSubmit>
          </CrmFormDrawerFooter>
        </form>
    </CrmFormDrawer>
  )
}

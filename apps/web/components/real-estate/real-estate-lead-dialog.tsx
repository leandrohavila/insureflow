"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { useSession } from "@/components/auth/session-provider"
import { FormSelect } from "@/components/design-system"
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
import type {
  CreateLeadInput,
  Lead,
  LeadStatus,
} from "@/lib/data-access/modules/leads"
import { LEAD_STATUSES } from "@/lib/data-access/modules/leads"
import { formatPhoneBrMask } from "@/lib/documents/document"
import {
  REAL_ESTATE_LEAD_STATUS_LABELS,
} from "@/lib/real-estate/lead-status"

type RealEstateLeadDialogProps = {
  open: boolean
  lead: Lead | null
  businessUnitId: string
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateLeadInput) => void | Promise<void>
}

export function RealEstateLeadDialog({
  open,
  lead,
  businessUnitId,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: RealEstateLeadDialogProps) {
  const { session } = useSession()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [source, setSource] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<LeadStatus>("new")

  const assignedTo = session?.name?.trim() ?? ""

  useEffect(() => {
    if (!open) return
    setName(lead?.name ?? "")
    setPhone(lead?.phone ?? "")
    setEmail(lead?.email ?? "")
    setSource(lead?.source ?? "")
    setNotes(lead?.notes ?? "")
    setStatus(lead?.status ?? "new")
  }, [lead, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !name.trim()) return

    await onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      source: source.trim() || (lead ? undefined : "manual"),
      notes: notes.trim() || undefined,
      assignedTo: lead?.assignedTo?.trim() || assignedTo || undefined,
      businessUnitId,
      interestCategories: ["PROPERTY_BUY"],
      ...(lead ? { status } : {}),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>
                {lead ? "Editar lead imobiliário" : "Novo lead imobiliário"}
              </DialogTitle>
              <DialogDescription>
                {lead
                  ? "Atualize os dados de contato e o status operacional do lead."
                  : "O lead será cadastrado na Ávila Imóveis com você como responsável."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium">Nome</span>
                <Input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Marina Costa"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Telefone</span>
                <Input
                  value={phone}
                  onChange={(event) =>
                    setPhone(formatPhoneBrMask(event.target.value))
                  }
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">E-mail</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="lead@email.com"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Origem</span>
                <Input
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="portal, whatsapp, indicação…"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Responsável</span>
                <Input
                  value={lead?.assignedTo?.trim() || assignedTo}
                  readOnly
                  className="bg-white/[0.03] text-muted-foreground"
                />
              </label>
              {lead ? (
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium">Status</span>
                  <FormSelect
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as LeadStatus)
                    }
                    options={LEAD_STATUSES.map((item) => ({
                      value: item,
                      label: REAL_ESTATE_LEAD_STATUS_LABELS[item],
                    }))}
                  />
                </label>
              ) : null}
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium">Notas</span>
                <Input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Contexto do interesse imobiliário"
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-[var(--if-radius-lg)] border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {getErrorMessage(error, "Erro ao salvar lead")}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || !name.trim()}>
                {pending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {lead ? "Salvar" : "Cadastrar lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

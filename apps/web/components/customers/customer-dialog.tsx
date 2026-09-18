"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

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
import { getErrorMessage } from "@/lib/data-access"
import type {
  CreateCustomerInput,
  Customer,
  CustomerStatus,
  CustomerType,
} from "@/lib/data-access/modules/customers"
import {
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
} from "@/lib/data-access/modules/customers"
import {
  customerDocumentPlaceholder,
  formatCustomerDocument,
  formatPhone,
  formatStoredCustomerDocument,
  formatStoredCustomerPhone,
  getCustomerDocumentError,
  getCustomerEmailError,
  stripNonDigits,
} from "@/lib/customers/customer-field-masks"
import { cn } from "@/lib/utils"

const statusLabels: Record<CustomerStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
}

type CustomerForm = {
  type: CustomerType
  name: string
  document: string
  email: string
  phone: string
  status: CustomerStatus
}

type ValidatedField = "name" | "document" | "email"

export type CustomerDialogProps = {
  customer: Customer | null
  open: boolean
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateCustomerInput) => void
}

export function CustomerDialog({
  customer,
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: CustomerDialogProps) {
  const [form, setForm] = useState<CustomerForm>({
    type: "PF",
    name: "",
    document: "",
    email: "",
    phone: "",
    status: "active",
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ValidatedField, string>>
  >({})
  const [touched, setTouched] = useState<Partial<Record<ValidatedField, boolean>>>(
    {},
  )

  useEffect(() => {
    if (!open) return
    const type = customer?.type ?? "PF"
    setFieldErrors({})
    setTouched({})
    setForm({
      type,
      name: customer?.name ?? "",
      document: formatStoredCustomerDocument(type, customer?.document),
      email: customer?.email ?? "",
      phone: formatStoredCustomerPhone(customer?.phone),
      status: customer?.status ?? "active",
    })
  }, [customer, open])

  function update<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function markTouched(field: ValidatedField) {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  function validateDocument(masked: string, type: CustomerType) {
    return getCustomerDocumentError(type, masked)
  }

  function validateEmail(value: string) {
    return getCustomerEmailError(value)
  }

  function handleTypeChange(nextType: CustomerType) {
    setForm((current) => {
      const document = formatCustomerDocument(
        nextType,
        stripNonDigits(current.document),
      )
      return { ...current, type: nextType, document }
    })
    setFieldErrors((current) => {
      const next = { ...current }
      delete next.document
      return next
    })
  }

  function handleDocumentChange(raw: string) {
    const masked = formatCustomerDocument(form.type, raw)
    update("document", masked)
    if (touched.document) {
      const message = validateDocument(masked, form.type)
      setFieldErrors((current) => {
        const next = { ...current }
        if (message) next.document = message
        else delete next.document
        return next
      })
    }
  }

  function handleDocumentBlur() {
    markTouched("document")
    const message = validateDocument(form.document, form.type)
    setFieldErrors((current) => {
      const next = { ...current }
      if (message) next.document = message
      else delete next.document
      return next
    })
  }

  function handleEmailBlur() {
    markTouched("email")
    const message = validateEmail(form.email)
    setFieldErrors((current) => {
      const next = { ...current }
      if (message) next.email = message
      else delete next.email
      return next
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ name: true, document: true, email: true })

    const nameError = !form.name.trim() ? "Informe o nome do cliente" : null
    const documentDigits = stripNonDigits(form.document)
    const documentError = !documentDigits
      ? `Informe o ${form.type === "PF" ? "CPF" : "CNPJ"}`
      : validateDocument(form.document, form.type)
    const emailError = validateEmail(form.email)

    setFieldErrors({
      ...(nameError ? { name: nameError } : {}),
      ...(documentError ? { document: documentError } : {}),
      ...(emailError ? { email: emailError } : {}),
    })

    if (nameError || documentError || emailError) return

    onSubmit({
      type: form.type,
      name: form.name.trim(),
      document: documentDigits,
      email: form.email.trim() || undefined,
      phone: stripNonDigits(form.phone) || undefined,
      status: form.status,
    })
  }

  const showNameError = Boolean(touched.name && fieldErrors.name)
  const showDocumentError = Boolean(touched.document && fieldErrors.document)
  const showEmailError = Boolean(touched.email && fieldErrors.email)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>
              {customer ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
            <DialogDescription>
              Mantenha os dados essenciais do cliente em uma base única e
              isolada por tenant.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Tipo</span>
              <FormSelect
                value={form.type}
                onChange={(event) =>
                  handleTypeChange(event.target.value as CustomerType)
                }
                options={CUSTOMER_TYPES.map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <FormSelect
                value={form.status}
                onChange={(event) =>
                  update("status", event.target.value as CustomerStatus)
                }
                options={CUSTOMER_STATUSES.map((item) => ({
                  value: item,
                  label: statusLabels[item],
                }))}
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                onBlur={() => markTouched("name")}
                placeholder="Ex.: Maria Oliveira ou Transportes Sul"
                aria-invalid={showNameError || undefined}
                aria-describedby={showNameError ? "customer-name-error" : undefined}
                className={cn(showNameError && "border-destructive")}
              />
              {showNameError ? (
                <p
                  id="customer-name-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldErrors.name}
                </p>
              ) : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                {form.type === "PF" ? "CPF" : "CNPJ"}
              </span>
              <Input
                required
                value={form.document}
                onChange={(event) => handleDocumentChange(event.target.value)}
                onBlur={handleDocumentBlur}
                placeholder={customerDocumentPlaceholder(form.type)}
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={showDocumentError || undefined}
                aria-describedby={
                  showDocumentError ? "customer-document-error" : undefined
                }
                className={cn(showDocumentError && "border-destructive")}
              />
              {showDocumentError ? (
                <p
                  id="customer-document-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldErrors.document}
                </p>
              ) : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">E-mail</span>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                onBlur={handleEmailBlur}
                placeholder="cliente@empresa.com.br"
                autoComplete="email"
                aria-invalid={showEmailError || undefined}
                aria-describedby={
                  showEmailError ? "customer-email-error" : undefined
                }
                className={cn(showEmailError && "border-destructive")}
              />
              {showEmailError ? (
                <p
                  id="customer-email-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldErrors.email}
                </p>
              ) : null}
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Telefone</span>
              <Input
                value={form.phone}
                onChange={(event) =>
                  update("phone", formatPhone(event.target.value))
                }
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar cliente")}
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
              ) : customer ? (
                "Salvar alterações"
              ) : (
                "Salvar cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

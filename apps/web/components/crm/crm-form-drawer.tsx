"use client"

import type { LucideIcon } from "lucide-react"
import { X } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/**
 * Chrome do drawer de formulário do CRM.
 * Espelha o drawer de atividades (Agenda, Leads e Pipeline) sem duplicar
 * a lógica de cada formulário: cabeçalho e rodapé fixos, rolagem só no miolo,
 * 600px no desktop e largura total no mobile, sempre na paleta clara Ávila.
 */
export const crmFormDrawerContentClass =
  "crm-form-drawer h-dvh max-h-dvh w-full max-w-none gap-0 overflow-hidden border-[#e4ddd2] bg-[#F6F1E8] p-0 text-[#10294B] [color-scheme:light] data-[side=right]:w-full data-[side=right]:sm:w-[600px] data-[side=right]:sm:max-w-[600px]!"

export const crmDrawerInputClass =
  "h-9! w-full min-w-0 rounded-lg border! border-[#D6CFC4]! bg-white! px-3! text-sm! text-[#10294B]! shadow-none! outline-none [color-scheme:light] placeholder:text-[#5C6578]! focus-visible:border-[#10294B]! focus-visible:ring-2! focus-visible:ring-[#10294B]/20!"

const lightTokens = {
  backgroundColor: "#F6F1E8",
  color: "#10294B",
  "--background": "#F6F1E8",
  "--foreground": "#10294B",
  "--card": "#FFFCFA",
  "--card-foreground": "#10294B",
  "--popover": "#FFFCFA",
  "--popover-foreground": "#10294B",
  "--muted-foreground": "#5C6578",
  "--border": "#D6CFC4",
  "--input": "#D6CFC4",
  "--primary": "#10294B",
  "--primary-foreground": "#FFFCFA",
  "--ring": "#10294B",
} as CSSProperties

export function CrmFormDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={crmFormDrawerContentClass}
        style={lightTokens}
      >
        {children}
      </SheetContent>
    </Sheet>
  )
}

export function CrmFormDrawerHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <header className="flex shrink-0 items-center gap-2.5 border-b border-[#e4ddd2] bg-white px-4! py-3!">
      <span
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F6F1E8] text-[#10294B]"
        aria-hidden
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-2">
        <SheetTitle className="text-base! leading-tight font-semibold tracking-[-0.02em] text-[#10294B]!">
          {title}
        </SheetTitle>
        <SheetDescription className="text-xs! leading-snug text-[#5C6578]!">
          {description}
        </SheetDescription>
      </div>
      <SheetClose
        type="button"
        aria-label="Fechar"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#10294B] hover:bg-[#F6F1E8] focus-visible:ring-2 focus-visible:ring-[#10294B]/30 focus-visible:outline-none"
      >
        <X className="size-4" aria-hidden />
      </SheetClose>
    </header>
  )
}

export function CrmFormDrawerBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-4! py-3!",
        "[&_input:not([type=checkbox]):not([type=radio])]:h-9! [&_input:not([type=checkbox]):not([type=radio])]:rounded-lg! [&_input:not([type=checkbox])]:border-[#D6CFC4]! [&_input:not([type=checkbox])]:bg-white! [&_input:not([type=checkbox])]:text-[#10294B]! [&_input:not([type=checkbox])]:shadow-none!",
        "[&_input:not([type=checkbox])]:placeholder:text-[#5C6578]! [&_input:not([type=checkbox])]:focus-visible:border-[#10294B]! [&_input:not([type=checkbox])]:focus-visible:bg-white! [&_input:not([type=checkbox])]:focus-visible:ring-[#10294B]/20!",
        "[&_textarea]:rounded-lg! [&_textarea]:border-[#D6CFC4]! [&_textarea]:bg-white! [&_textarea]:text-[#10294B]! [&_textarea]:shadow-none!",
        "[&_textarea]:placeholder:text-[#5C6578]! [&_textarea]:focus-visible:border-[#10294B]! [&_textarea]:focus-visible:bg-white!",
        "[&_select]:h-9! [&_select]:rounded-lg! [&_select]:border-[#D6CFC4]! [&_select]:bg-white! [&_select]:text-[#10294B]!",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CrmFormDrawerSection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-[#D6CFC4] bg-white p-3!",
        className,
      )}
    >
      <h3 className="text-[0.6875rem] font-semibold tracking-[0.08em] text-[#10294B] uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function CrmFormDrawerFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-end gap-x-[var(--if-layout-cluster-gap)] gap-y-[var(--if-layout-button-gap)] border-t border-[#e4ddd2] bg-white px-4! py-3!">
      {children}
    </footer>
  )
}

export function CrmFormDrawerCancel({
  disabled,
  onClick,
}: {
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className="border-[#D6CFC4]! bg-white! text-[#10294B]! hover:bg-[#F6F1E8]!"
      onClick={onClick}
    >
      Cancelar
    </Button>
  )
}

export function CrmFormDrawerSubmit({
  disabled,
  pending,
  pendingLabel = "Salvando…",
  children,
}: {
  disabled?: boolean
  pending?: boolean
  pendingLabel?: string
  children: ReactNode
}) {
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={disabled || pending}
      className="bg-[#10294B]! text-white! hover:bg-[#0c2448]! hover:text-white!"
    >
      {pending ? pendingLabel : children}
    </Button>
  )
}

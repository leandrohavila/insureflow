"use client"

import Link from "next/link"
import { Bell } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function AppNotifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notificações"
        className={cn(
          "relative inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-transparent text-muted-foreground outline-none",
          "transition-colors duration-150 hover:border-white/[0.14] hover:bg-white/[0.04] hover:text-foreground",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
        )}
      >
        <Bell className="size-4" strokeWidth={1.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-panel w-64 border-white/[0.08] p-1">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Notificações
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-sm"
          render={(props) => <Link href="/crm/agenda?window=overdue" {...props} />}
        >
          Abrir atrasados na Agenda
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-sm"
          render={(props) => <Link href="/crm/follow-ups" {...props} />}
        >
          Ver fila de follow-ups
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

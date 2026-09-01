"use client"

import { Building2, ChevronDown, Plus, Shield } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { LeadCreateIntent } from "@/lib/leads/lead-intent"
import { cn } from "@/lib/utils"

type LeadCreateMenuProps = {
  onCreate: (intent: LeadCreateIntent) => void
  insuranceEnabled?: boolean
  realEstateEnabled?: boolean
  align?: "start" | "end"
}

export function LeadCreateMenu({
  onCreate,
  insuranceEnabled = true,
  realEstateEnabled = true,
  align = "end",
}: LeadCreateMenuProps) {
  const canCreate = insuranceEnabled || realEstateEnabled

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={!canCreate}
        aria-label="Novo lead"
        className={cn(
          buttonVariants({ size: "sm" }),
          "h-8 gap-1.5",
        )}
      >
        <Plus className="size-3.5" strokeWidth={1.5} />
        Novo Lead
        <ChevronDown className="size-3 opacity-70" strokeWidth={1.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuItem
          disabled={!insuranceEnabled}
          className="gap-2"
          onClick={() => onCreate("insurance")}
        >
          <Shield className="size-3.5 text-muted-foreground" />
          Lead Seguro
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!realEstateEnabled}
          className="gap-2"
          onClick={() => onCreate("real-estate")}
        >
          <Building2 className="size-3.5 text-muted-foreground" />
          Lead Imobiliário
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type LeadCreateEmptyActionsProps = LeadCreateMenuProps

/** Empty state: same two destinations, same outline weight — no gold CTA. */
export function LeadCreateEmptyActions({
  onCreate,
  insuranceEnabled = true,
  realEstateEnabled = true,
}: LeadCreateEmptyActionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5"
        disabled={!insuranceEnabled}
        onClick={() => onCreate("insurance")}
      >
        <Shield className="size-3.5" />
        Lead Seguro
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5"
        disabled={!realEstateEnabled}
        onClick={() => onCreate("real-estate")}
      >
        <Building2 className="size-3.5" />
        Lead Imobiliário
      </Button>
    </div>
  )
}

"use client"

import { memo } from "react"
import { Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { quickAddItems, type FieldLibraryItem } from "./field-library"

type QuickAddMenuProps = {
  disabled?: boolean
  onInsert: (item: FieldLibraryItem) => void
  onOpenLibrary: () => void
}

export const QuickAddMenu = memo(function QuickAddMenu({
  disabled,
  onInsert,
  onOpenLibrary,
}: QuickAddMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs outline-none transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled}
        aria-label="Inserir campo personalizado"
      >
        <Plus className="size-3.5" />
        Campo Personalizado
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {quickAddItems.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem
              key={item.id}
              className="gap-2"
              onClick={() => onInsert(item)}
            >
              <Icon className="size-3.5 text-muted-foreground" />
              {item.label}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuItem
          className="gap-2 text-muted-foreground"
          onClick={onOpenLibrary}
        >
          Ver todos os campos…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

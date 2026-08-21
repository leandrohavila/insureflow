"use client"

import { History } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { QuestionnaireTemplate, QuestionnaireTemplateStatus } from "@/lib/data-access/modules/questionnaires"

import { statusLabels } from "./constants"
import { formatDate } from "./utils"

type VersionsMenuProps = {
  template: QuestionnaireTemplate | null
}

/** UI-only — sem backend de versionamento nesta sprint */
export function VersionsMenu({ template }: VersionsMenuProps) {
  const versions = template
    ? [
        {
          version: template.version,
          status: template.status,
          date: template.updatedAt,
          current: true,
        },
        ...(template.version > 1
          ? [
              {
                version: template.version - 1,
                status: "draft" as QuestionnaireTemplateStatus,
                date: template.createdAt,
                current: false,
              },
            ]
          : []),
      ]
    : []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background/40 px-3 text-sm shadow-xs outline-none transition-colors hover:bg-white/[0.05] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label="Histórico de versões"
        disabled={!template}
      >
        <History className="size-3.5" />
        <span className="hidden sm:inline">Versões</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Histórico de versões</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {versions.length === 0 ? (
          <DropdownMenuItem disabled>Nenhuma versão disponível</DropdownMenuItem>
        ) : (
          versions.map((item) => (
            <DropdownMenuItem
              key={item.version}
              disabled={!item.current}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="font-medium">
                v{item.version}
                {item.current ? " · Atual" : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                {statusLabels[item.status]} · {formatDate(item.date)}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          Versionamento completo em breve
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

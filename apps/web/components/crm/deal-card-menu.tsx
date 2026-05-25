"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react"

import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { PermissionGate } from "@/components/auth/permission-gate"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { activityTypeSubjects } from "@/lib/crm/activity-labels"
import {
  useCreateActivity,
  type CreateActivityInput,
} from "@/lib/data-access/modules/activities"
import {
  useDeleteCrmDeal,
  useUpdateCrmDeal,
  type CrmDeal,
  type CrmDealStatus,
} from "@/lib/data-access/modules/crm"
import { cn } from "@/lib/utils"

type ActivityDialogMode = "register" | "reschedule" | null

type DealCardMenuProps = {
  deal: CrmDeal
  onOpen?: () => void
  onEdit?: (deal: CrmDeal) => void
  onDelete?: (deal: CrmDeal) => void
  disabled?: boolean
  className?: string
}

const STATUS_LABELS: Record<CrmDealStatus, string> = {
  open: "Em aberto",
  won: "Ganho",
  lost: "Perdido",
  archived: "Arquivado",
}

export function DealCardMenu({
  deal,
  onOpen,
  onEdit,
  onDelete,
  disabled,
  className,
}: DealCardMenuProps) {
  const router = useRouter()
  const leadId = deal.convertedLead?.id ?? null

  const updateDeal = useUpdateCrmDeal()
  const deleteDeal = useDeleteCrmDeal()
  const createActivity = useCreateActivity({
    leadId,
    dealId: deal.id,
  })

  const [dialogMode, setDialogMode] = useState<ActivityDialogMode>(null)

  function handleStatusChange(status: CrmDealStatus) {
    updateDeal.mutate({ id: deal.id, input: { status } })
  }

  function handleDelete() {
    if (onDelete) {
      onDelete(deal)
      return
    }
    if (!window.confirm(`Excluir negócio ${deal.title}?`)) return
    deleteDeal.mutate(deal.id)
  }

  function handleActivitySubmit(input: CreateActivityInput) {
    const subject =
      input.subject.trim() || activityTypeSubjects[input.type] || "Atividade"

    createActivity.mutate(
      { ...input, subject },
      { onSuccess: () => setDialogMode(null) },
    )
  }

  const isBusy =
    updateDeal.isPending || deleteDeal.isPending || createActivity.isPending

  return (
    <PermissionGate permission="crm:manage">
      <>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={disabled || isBusy}
            className={cn(
              "deal-card-v2__menu-trigger inline-flex size-7 shrink-0 items-center justify-center rounded-md",
              "text-muted-foreground/55 outline-none transition-colors",
              "hover:bg-[var(--crm-surface-raised)] hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-primary/30",
              "opacity-0 group-hover/deal:opacity-100 group-focus-within/deal:opacity-100",
              "data-[state=open]:opacity-100",
              className,
            )}
            aria-label="Ações do negócio"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {isBusy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MoreHorizontal className="size-3.5" strokeWidth={1.5} />
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            {onOpen ? (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen()
                }}
                className="gap-2"
              >
                <ExternalLink className="size-3.5" />
                Abrir negócio
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setDialogMode("register")
              }}
              className="gap-2"
            >
              <Phone className="size-3.5 text-sky-400" />
              Registrar atividade
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setDialogMode("reschedule")
              }}
              className="gap-2"
            >
              <CalendarClock className="size-3.5 text-amber-400" />
              Reagendar follow-up
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push("/crm/agenda")
              }}
              className="gap-2"
            >
              <CalendarClock className="size-3.5 text-muted-foreground" />
              Abrir agenda
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <RotateCcw className="size-3.5" />
                Converter status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  disabled={deal.status === "won"}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange("won")
                  }}
                  className="gap-2"
                >
                  <Trophy className="size-3.5 text-emerald-400" />
                  Marcar como ganho
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deal.status === "lost"}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange("lost")
                  }}
                  className="gap-2"
                >
                  <XCircle className="size-3.5 text-rose-400" />
                  Marcar como perdido
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deal.status === "open"}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange("open")
                  }}
                  className="gap-2"
                >
                  <CheckCircle2 className="size-3.5 text-sky-400" />
                  Reabrir negócio
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deal.status === "archived"}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange("archived")
                  }}
                  className="gap-2"
                >
                  Arquivar
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {onEdit ? (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(deal)
                }}
                className="gap-2"
              >
                <Pencil className="size-3.5" />
                Editar negócio
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ActivityFormDialog
          open={dialogMode === "register"}
          onOpenChange={(open) => {
            if (!open) setDialogMode(null)
          }}
          initialType="call"
          leadId={leadId}
          dealId={deal.id}
          pending={createActivity.isPending}
          error={createActivity.error}
          onSubmit={handleActivitySubmit}
        />

        <ActivityFormDialog
          open={dialogMode === "reschedule"}
          onOpenChange={(open) => {
            if (!open) setDialogMode(null)
          }}
          initialType="follow_up"
          leadId={leadId}
          dealId={deal.id}
          pending={createActivity.isPending}
          error={createActivity.error}
          onSubmit={handleActivitySubmit}
        />
      </>
    </PermissionGate>
  )
}

export { STATUS_LABELS }

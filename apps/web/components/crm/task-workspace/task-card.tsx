"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  CalendarClock,
  Check,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Phone,
  RefreshCw,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import { StatusPill } from "@/components/crm/primitives"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { activityTypeLabels } from "@/lib/crm/activity-labels"
import {
  activityTypeAccentVar,
  activityTypeIcons,
} from "@/lib/crm/activity-type-visual"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

import {
  formatCompletedAt,
  formatTaskSla,
  TASK_STATUS_CONFIG,
  type EnrichedTask,
} from "./task-workspace-utils"
import type { Activity } from "@/lib/data-access/modules/activities"
import {
  buildEntitySheetHref,
  buildReturnToFromCurrentLocation,
  type EntitySheetEntityType,
} from "@/lib/crm/entity-sheet-navigation"

type TaskCardProps = {
  task: EnrichedTask
  index: number
  onComplete: (activity: Activity) => void
  onRegisterContact: (task: EnrichedTask) => void
  onReschedule: (task: EnrichedTask) => void
  isCompleting: boolean
  completed?: boolean
}

const PRIORITY_LABELS = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
} as const

const PRIORITY_TONE = {
  alta: "danger",
  media: "warn",
  baixa: "neutral",
} as const

function navigateToCrmEntitySheet(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  searchParams: Pick<URLSearchParams, "get" | "toString">,
  entityType: EntitySheetEntityType,
  entityId: string,
) {
  const returnTo = buildReturnToFromCurrentLocation(pathname, searchParams)
  router.push(
    buildEntitySheetHref({
      entityType,
      entityId,
      origin: "tasks",
      returnTo,
    }),
  )
}

export function TaskCard({
  task,
  index,
  onComplete,
  onRegisterContact,
  onReschedule,
  isCompleting,
  completed = false,
}: TaskCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reduce = useReducedMotion()

  const { activity, entityTitle, entityCompany, status, priority } = task
  const Icon = activityTypeIcons[activity.type]
  const accentVar = activityTypeAccentVar[activity.type]
  const cfg =
    status === "completed"
      ? { label: "Concluída", tone: "success" as const, row: "task-row--completed" }
      : TASK_STATUS_CONFIG[status]

  const showOpenDeal = Boolean(activity.dealId)
  const showOpenLead = Boolean(activity.leadId)

  const initials = activity.performedBy.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const openDeal = () => {
    if (!activity.dealId) return
    navigateToCrmEntitySheet(router, pathname, searchParams, "deal", activity.dealId)
  }

  const openLead = () => {
    if (!activity.leadId) return
    navigateToCrmEntitySheet(router, pathname, searchParams, "lead", activity.leadId)
  }

  const openLinkedEntity = () => {
    if (activity.dealId) {
      openDeal()
      return
    }
    if (activity.leadId) {
      openLead()
    }
  }

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, duration: 0.28, ease: easeOut }}
      className={cn(
        "task-row crm-interactive-row group/task flex items-start gap-2.5 px-3 py-2.5 md:gap-3 md:px-4 md:py-3",
        cfg.row,
        isCompleting && "task-row--completing",
      )}
    >
      <PermissionGate permission="crm:manage">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={completed || isCompleting}
          onClick={() => onComplete(activity)}
          className={cn(
            "task-row__check mt-0.5 size-7 shrink-0 rounded-md border",
            completed
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              : "border-white/12 bg-white/[0.03] text-muted-foreground/70 hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
          )}
          aria-label={completed ? "Tarefa concluída" : `Concluir: ${activity.subject}`}
        >
          {isCompleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className={cn("size-3.5", completed && "opacity-100")} strokeWidth={2} />
          )}
        </Button>
      </PermissionGate>

      <div
        className="task-type-node mt-0.5 flex size-7 shrink-0 items-center justify-center md:size-8"
        style={{ ["--crm-node-accent" as string]: accentVar }}
        aria-hidden
      >
        <Icon className="size-3.5" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h3
            className={cn(
              "crm-text-title min-w-0 text-[13px] leading-snug md:text-sm",
              completed && "text-foreground/65 line-through decoration-foreground/25",
            )}
          >
            {activity.subject}
          </h3>
          <StatusPill tone="neutral" variant="soft" size="xs">
            {activityTypeLabels[activity.type]}
          </StatusPill>
        </div>

        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {showOpenDeal || showOpenLead ? (
            <button
              type="button"
              onClick={openLinkedEntity}
              className="crm-text-meta max-w-full truncate text-primary/85 transition-colors hover:text-primary"
            >
              {entityTitle}
            </button>
          ) : (
            <span className="crm-text-meta">{entityTitle}</span>
          )}
          {entityCompany ? (
            <span className="crm-text-meta hidden truncate sm:inline">· {entityCompany}</span>
          ) : null}
        </div>

        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
          <StatusPill tone={cfg.tone} variant="soft" size="xs" dot>
            {cfg.label}
          </StatusPill>
          {!completed ? (
            <StatusPill
              tone={PRIORITY_TONE[priority]}
              variant="outline"
              size="xs"
            >
              {PRIORITY_LABELS[priority]}
            </StatusPill>
          ) : null}
          <span className="crm-text-micro flex min-w-0 items-center gap-1 text-foreground/55">
            <CalendarClock className="size-3 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">
              {completed
                ? `Concluída · ${formatCompletedAt(activity.updatedAt)}`
                : formatTaskSla(activity.nextFollowUpAt, status)}
            </span>
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-primary/15 text-[9px] font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        {!completed ? (
          <div className="crm-reveal-hover hidden items-center gap-0.5 md:flex">
            <PermissionGate permission="crm:manage">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7 text-muted-foreground/70 hover:text-foreground"
                aria-label="Registrar contato"
                onClick={() => onRegisterContact(task)}
              >
                <Phone className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7 text-muted-foreground/70 hover:text-foreground"
                aria-label="Reagendar"
                onClick={() => onReschedule(task)}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </PermissionGate>
          </div>
        ) : null}

        <PermissionGate permission="crm:manage">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 outline-none transition-colors hover:bg-[var(--crm-surface-panel-hover)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Ações da tarefa"
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {!completed ? (
                <>
                  <DropdownMenuItem
                    onClick={() => onRegisterContact(task)}
                    className="gap-2"
                  >
                    <Phone className="size-3.5 text-sky-400" />
                    Registrar contato
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onReschedule(task)}
                    className="gap-2"
                  >
                    <RefreshCw className="size-3.5 text-amber-400" />
                    Reagendar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              {showOpenLead ? (
                <DropdownMenuItem onClick={openLead} className="gap-2">
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                  Abrir lead
                </DropdownMenuItem>
              ) : null}
              {showOpenDeal ? (
                <DropdownMenuItem onClick={openDeal} className="gap-2">
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                  Abrir negócio
                </DropdownMenuItem>
              ) : null}
              {!completed ? (
                <>
                  {(showOpenLead || showOpenDeal) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => onComplete(activity)}
                    disabled={isCompleting}
                    className="gap-2 text-emerald-400 focus:text-emerald-300"
                  >
                    {isCompleting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    Marcar concluída
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGate>
      </div>
    </motion.article>
  )
}

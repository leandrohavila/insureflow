"use client"

import { useState } from "react"
import {
  CalendarClock,
  Phone,
  Plus,
  Users,
} from "lucide-react"

import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { PermissionGate } from "@/components/auth/permission-gate"
import { Button } from "@/components/ui/button"
import { activityTypeSubjects } from "@/lib/crm/activity-labels"
import {
  useCreateActivity,
  type ActivityType,
  type CreateActivityInput,
} from "@/lib/data-access/modules/activities"
import { cn } from "@/lib/utils"

import {
  TaskContextPickerDialog,
  type TaskContextSelection,
} from "./task-context-picker-dialog"

type QuickActionKind = "task" | "follow_up" | "contact" | "meeting"

const QUICK_ACTIONS: {
  kind: QuickActionKind
  label: string
  shortLabel: string
  icon: typeof Plus
  type: ActivityType
}[] = [
  {
    kind: "task",
    label: "Nova tarefa",
    shortLabel: "Tarefa",
    icon: Plus,
    type: "note",
  },
  {
    kind: "follow_up",
    label: "Follow-up",
    shortLabel: "Follow-up",
    icon: CalendarClock,
    type: "follow_up",
  },
  {
    kind: "contact",
    label: "Registrar contato",
    shortLabel: "Contato",
    icon: Phone,
    type: "call",
  },
  {
    kind: "meeting",
    label: "Reunião",
    shortLabel: "Reunião",
    icon: Users,
    type: "meeting",
  },
]

const DEFAULT_QUICK_ACTION = QUICK_ACTIONS[0]!

type TaskQuickActionsBarProps = {
  className?: string
}

export function TaskQuickActionsBar({ className }: TaskQuickActionsBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingKind, setPendingKind] = useState<QuickActionKind>("task")
  const [context, setContext] = useState<TaskContextSelection | null>(null)

  const createActivity = useCreateActivity({
    leadId: context?.leadId,
    dealId: context?.dealId,
  })

  const selectedAction =
    QUICK_ACTIONS.find((a) => a.kind === pendingKind) ?? DEFAULT_QUICK_ACTION

  function openFlow(kind: QuickActionKind) {
    setPendingKind(kind)
    setPickerOpen(true)
  }

  function handleContextSelect(next: TaskContextSelection) {
    setContext(next)
    setDialogOpen(true)
  }

  function handleSubmit(input: CreateActivityInput) {
    const subject =
      input.subject.trim() ||
      activityTypeSubjects[selectedAction.type] ||
      "Atividade"

    createActivity.mutate(
      {
        ...input,
        subject,
        leadId: context?.leadId,
        dealId: context?.dealId,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setContext(null)
        },
      },
    )
  }

  return (
    <PermissionGate permission="crm:manage">
      <div
        className={cn(
          "task-quick-actions flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
          className,
        )}
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.kind}
              type="button"
              size="sm"
              variant="outline"
              className="task-quick-actions__btn h-8 shrink-0 gap-1.5 px-3 text-xs sm:text-sm"
              onClick={() => openFlow(action.kind)}
            >
              <Icon className="size-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">{action.shortLabel}</span>
            </Button>
          )
        })}
      </div>

      <TaskContextPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleContextSelect}
        title={
          pendingKind === "meeting"
            ? "Nova reunião — selecionar vínculo"
            : pendingKind === "contact"
              ? "Registrar contato — selecionar vínculo"
              : pendingKind === "follow_up"
                ? "Agendar follow-up — selecionar vínculo"
                : "Nova tarefa — selecionar vínculo"
        }
      />

      {context ? (
        <ActivityFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setContext(null)
          }}
          initialType={selectedAction.type}
          leadId={context.leadId}
          dealId={context.dealId}
          pending={createActivity.isPending}
          error={createActivity.error}
          onSubmit={handleSubmit}
        />
      ) : null}
    </PermissionGate>
  )
}

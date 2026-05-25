"use client"

import { useState } from "react"
import {
  CalendarClock,
  MessageSquare,
  Phone,
  StickyNote,
} from "lucide-react"

import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { PermissionGate } from "@/components/auth/permission-gate"
import { activityTypeSubjects } from "@/lib/crm/activity-labels"
import {
  useCreateActivity,
  type ActivityType,
  type CreateActivityInput,
} from "@/lib/data-access/modules/activities"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActivityQuickActionsProps = {
  leadId?: string | null
  dealId?: string | null
  className?: string
  compact?: boolean
}

type QuickAction = {
  type: ActivityType
  label: string
  icon: typeof Phone
}

const compactQuickLabels: Partial<Record<QuickAction["type"], string>> = {
  call: "Ligação",
  note: "Nota",
  whatsapp: "WhatsApp",
  follow_up: "Follow-up",
}

const quickActions: QuickAction[] = [
  { type: "call", label: "Registrar ligação", icon: Phone },
  { type: "note", label: "Adicionar observação", icon: StickyNote },
  { type: "whatsapp", label: "Registrar WhatsApp", icon: MessageSquare },
  { type: "follow_up", label: "Agendar follow-up", icon: CalendarClock },
]

export function ActivityQuickActions({
  leadId,
  dealId,
  className,
  compact,
}: ActivityQuickActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ActivityType>("call")
  const createActivity = useCreateActivity({ leadId, dealId })

  function openQuickAction(type: ActivityType) {
    setSelectedType(type)
    setDialogOpen(true)
  }

  function handleSubmit(input: CreateActivityInput) {
    const subject =
      input.subject.trim() || activityTypeSubjects[input.type] || "Atividade"

    createActivity.mutate(
      { ...input, subject },
      { onSuccess: () => setDialogOpen(false) },
    )
  }

  return (
    <PermissionGate permission="crm:manage">
      <div className={cn("flex flex-wrap gap-2", className)}>
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.type}
              type="button"
              size={compact ? "sm" : "default"}
              variant="outline"
              className="gap-1.5"
              onClick={() => openQuickAction(action.type)}
            >
              <Icon className="size-3.5" />
              {compact ? compactQuickLabels[action.type] : action.label}
            </Button>
          )
        })}
      </div>

      <ActivityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialType={selectedType}
        leadId={leadId}
        dealId={dealId}
        pending={createActivity.isPending}
        error={createActivity.error}
        onSubmit={handleSubmit}
      />
    </PermissionGate>
  )
}

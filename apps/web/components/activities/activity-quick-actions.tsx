"use client"

import { useState } from "react"
import {
  CalendarClock,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
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
  embedded?: boolean
}

type QuickAction = {
  type: ActivityType
  label: string
  icon: typeof Phone
}

const compactQuickLabels: Partial<Record<QuickAction["type"], string>> = {
  call: "Ligação",
  whatsapp: "WhatsApp",
  follow_up: "Follow-up",
  renewal: "Renovação",
  visit: "Visita",
}

const quickActions: QuickAction[] = [
  { type: "call", label: "+ Nova Ligação", icon: Phone },
  { type: "whatsapp", label: "+ Novo WhatsApp", icon: MessageSquare },
  { type: "follow_up", label: "+ Novo Follow-up", icon: CalendarClock },
  { type: "renewal", label: "+ Nova Renovação", icon: RefreshCw },
  { type: "visit", label: "+ Nova Visita", icon: MapPin },
]

export function ActivityQuickActions({
  leadId,
  dealId,
  className,
  compact,
  embedded = false,
}: ActivityQuickActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [presetType, setPresetType] = useState<ActivityType | null>(null)
  const createActivity = useCreateActivity({ leadId, dealId })

  function openQuickAction(type: ActivityType) {
    setPresetType(type)
    setDialogOpen(true)
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) setPresetType(null)
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
      <div className={cn("space-y-2", className)}>
        <div className="flex flex-wrap gap-2">
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
          embedded={embedded}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          initialType={dialogOpen ? (presetType ?? undefined) : undefined}
          leadId={leadId}
          dealId={dealId}
          pending={createActivity.isPending}
          error={createActivity.error}
          onSubmit={handleSubmit}
        />
      </div>
    </PermissionGate>
  )
}

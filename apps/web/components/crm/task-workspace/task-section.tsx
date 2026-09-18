"use client"

import type { ComponentType } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { TaskCard } from "./task-card"
import type { EnrichedTask } from "./task-workspace-utils"
import type { Activity } from "@/lib/data-access/modules/activities"

type TaskSectionProps = {
  title: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  iconClass?: string
  items: EnrichedTask[]
  emptyLabel: string
  delay: number
  onComplete: (activity: Activity) => void
  onRegisterContact: (task: EnrichedTask) => void
  onReschedule: (task: EnrichedTask) => void
  completingId: string | null
  completed?: boolean
  className?: string
}

export function TaskSection({
  title,
  icon: SectionIcon,
  iconClass,
  items,
  emptyLabel,
  delay,
  onComplete,
  onRegisterContact,
  onReschedule,
  completingId,
  completed = false,
  className,
}: TaskSectionProps) {
  const reduce = useReducedMotion()

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: easeOut }}
      className={cn("flex min-w-0 flex-col gap-0", className)}
    >
      <div className="mb-1.5 flex min-w-0 items-center gap-2 px-0.5">
        <SectionIcon
          className={cn("size-4 shrink-0", iconClass ?? "text-foreground/55")}
          strokeWidth={1.5}
        />
        <h2 className="crm-text-title text-[13px]">{title}</h2>
        <span className="task-section-count">{items.length}</span>
      </div>

      <div className="task-section-panel rounded-lg">
        {items.length === 0 ? (
          <div className="crm-text-meta flex items-center gap-2 px-4 py-3.5 md:px-5">
            {emptyLabel}
          </div>
        ) : (
          <div className="divide-y task-section-divider">
            {items.map((task, i) => (
              <TaskCard
                key={task.activity.id}
                task={task}
                index={i}
                onComplete={onComplete}
                onRegisterContact={onRegisterContact}
                onReschedule={onReschedule}
                isCompleting={completingId === task.activity.id}
                completed={completed}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  )
}

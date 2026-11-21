"use client"

import { useCallback, useRef, type CSSProperties, type KeyboardEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  ClipboardCheck,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  RotateCw,
  Users,
  type LucideIcon,
} from "lucide-react"

import { activityTypeLabels } from "@/lib/crm/activity-labels"
import {
  activityKindColors,
  activityKindFromActivityType,
} from "@/lib/crm/activity-kind-colors"
import {
  activityTypeAccentVar,
  activityTypeIcons,
} from "@/lib/crm/activity-type-visual"
import {
  ACTIVITY_TYPES,
  type ActivityType,
} from "@/lib/data-access/modules/activities"
import { cn } from "@/lib/utils"

const GRID_ICONS: Record<ActivityType, LucideIcon> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: Users,
  visit: MapPin,
  note: FileText,
  follow_up: RotateCw,
  renewal: RefreshCw,
  task: ClipboardCheck,
}

type ActivityTypeSelectorProps = {
  value: ActivityType | null
  onChange: (type: ActivityType) => void
  disabled?: boolean
  className?: string
  types?: readonly ActivityType[]
  /** `grid` is the Agenda drawer. Other callers keep the compact chips. */
  variant?: "chips" | "grid"
}

/**
 * Seletor de tipo de atividade — chips visuais radio.
 *
 * Fase 2.2C: unifica a identidade visual com `TimelineLane` (mesmos ícones,
 * mesmo accent por tipo), substituindo os emojis pelos ícones lucide e
 * o azul fixo do active state pelo tom semântico do tipo escolhido.
 *
 * Sem mudanças em comportamento ou contrato: continua sendo um radiogroup
 * com roving tabindex e setas/Home/End.
 */
export function ActivityTypeSelector({
  value,
  onChange,
  disabled,
  className,
  types = ACTIVITY_TYPES,
  variant = "chips",
}: ActivityTypeSelectorProps) {
  const reduce = useReducedMotion()
  const chipRefs = useRef<Partial<Record<ActivityType, HTMLButtonElement>>>({})
  const options = types

  const focusType = useCallback((type: ActivityType) => {
    chipRefs.current[type]?.focus()
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = options.length - 1
    let nextIndex: number | null = null

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = index === lastIndex ? 0 : index + 1
        break
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = index === 0 ? lastIndex : index - 1
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = lastIndex
        break
      default:
        return
    }

    event.preventDefault()
    const nextType = options[nextIndex]
    if (nextType !== undefined) {
      onChange(nextType)
      focusType(nextType)
    }
  }

  if (variant === "grid") {
    return (
      <div className={cn("min-w-0", className)}>
        <div
          role="radiogroup"
          aria-label="Tipo de atividade"
          className="flex flex-wrap gap-2"
        >
          {options.map((type, index) => {
            const selected = value === type
            const Icon = GRID_ICONS[type]
            const color = activityKindColors[activityKindFromActivityType(type)]
            const label = activityTypeLabels[type]
            return (
              <button
                key={type}
                ref={(node) => {
                  if (node) chipRefs.current[type] = node
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={
                  selected ? 0 : value === null && index === 0 ? 0 : -1
                }
                disabled={disabled}
                title={label}
                onClick={() => onChange(type)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "inline-flex h-9 min-h-9 items-center gap-1.5 rounded-lg border-2 px-2.5! text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10294B]/35",
                  "disabled:pointer-events-none disabled:opacity-50",
                  selected
                    ? "border-[#10294B]"
                    : "border-[#D6CFC4] hover:border-[#C09048]",
                )}
                style={{
                  background: selected
                    ? color.surface
                    : `color-mix(in srgb, ${color.surface} 72%, #ffffff)`,
                  color: "#10294B",
                }}
              >
                <Icon
                  className="size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                  style={{ color: color.icon }}
                />
                <span className="text-xs font-semibold leading-none whitespace-nowrap text-[#10294B]">
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <span
        id="activity-type-label"
        className="crm-text-micro tracking-wide text-foreground/72"
      >
        Tipo
      </span>
      <div
        role="radiogroup"
        aria-labelledby="activity-type-label"
        className="flex min-w-0 flex-wrap gap-1.5"
      >
        {options.map((type, index) => {
          const selected = value === type
          const Icon = activityTypeIcons[type]
          const accent = activityTypeAccentVar[type]
          const label = activityTypeLabels[type]

          const style: CSSProperties = selected
            ? {
                backgroundColor: `color-mix(in oklch, ${accent} 16%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${accent} 38%, transparent)`,
                color: accent,
              }
            : {
                backgroundColor: "var(--crm-surface-panel)",
                boxShadow: "inset 0 0 0 1px var(--crm-stroke-default)",
              }

          return (
            <motion.button
              key={type}
              ref={(node) => {
                if (node) chipRefs.current[type] = node
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={
                selected
                  ? 0
                  : value === null && index === 0
                    ? 0
                    : -1
              }
              disabled={disabled}
              onClick={() => onChange(type)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              style={style}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium",
                "transition-[color,background-color,box-shadow,transform] duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                disabled && "pointer-events-none opacity-50",
                selected ? null : "text-foreground/80 hover:text-foreground",
              )}
              whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.12 }}
            >
              <Icon
                className="size-3.5 shrink-0"
                strokeWidth={1.75}
                style={selected ? { color: accent } : undefined}
              />
              <span className="whitespace-nowrap">{label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

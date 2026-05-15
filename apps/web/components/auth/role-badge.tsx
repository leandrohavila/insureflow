import { Badge } from "@/components/ui/badge"
import type { AppRole } from "@repo/auth"
import { cn } from "@/lib/utils"

const roleStyles: Record<AppRole, string> = {
  super_admin: "border-violet-400/35 bg-violet-500/15 text-violet-200",
  admin: "border-primary/35 bg-primary/15 text-primary",
  broker: "border-sky-400/35 bg-sky-500/10 text-sky-200",
  underwriter: "border-amber-400/35 bg-amber-500/10 text-amber-200",
  viewer: "border-white/20 bg-white/[0.05] text-muted-foreground",
}

type RoleBadgeProps = {
  role: AppRole
  label: string
  className?: string
}

export function RoleBadge({ role, label, className }: RoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full text-[10px] font-semibold", roleStyles[role], className)}
    >
      {label}
    </Badge>
  )
}

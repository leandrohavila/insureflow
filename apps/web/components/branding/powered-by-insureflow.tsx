import { cn } from "@/lib/utils"

type PoweredByInsureFlowProps = {
  className?: string
}

export function PoweredByInsureFlow({ className }: PoweredByInsureFlowProps) {
  return (
    <p
      className={cn(
        "text-[10px] font-normal tracking-[0.04em] text-sidebar-foreground/45",
        className,
      )}
    >
      Powered by InsureFlow
    </p>
  )
}

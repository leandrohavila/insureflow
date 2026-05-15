"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Construction } from "lucide-react"

import { GlassCard } from "@/components/dashboard/glass-card"
import { easeOut } from "@/lib/motion"

type SectionPlaceholderProps = {
  title: string
  description?: string
}

export function SectionPlaceholder({
  title,
  description = "Estamos preparando esta área do InsureFlow. Em breve você poderá gerenciar tudo por aqui.",
}: SectionPlaceholderProps) {
  const reduce = useReducedMotion()

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 md:px-8 md:py-28">
      <GlassCard delay={0.1} className="max-w-md text-center">
        <motion.div
          className="flex flex-col items-center space-y-5 p-8 md:p-10"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <motion.div
            whileHover={reduce ? undefined : { scale: 1.05, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/35 to-primary/5 text-primary shadow-xl shadow-primary/20 ring-1 ring-primary/30"
          >
            <Construction className="size-8" strokeWidth={1.25} aria-hidden />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Use o menu à esquerda para voltar ao dashboard.
          </p>
        </motion.div>
      </GlassCard>
    </div>
  )
}

"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { useLeads } from "@/lib/data-access/modules/leads"
import {
  pipelineEmptyGuidance,
  unconvertedLeadCount,
} from "@/lib/leads/lead-pipeline-clarity"
import { cn } from "@/lib/utils"

type PipelineConversionEmptyProps = {
  dealCount: number
}

/**
 * Quando o Kanban está vazio e ainda há leads vivos, explica que o
 * pipeline mostra negócios — não a caixa de leads.
 */
export function PipelineConversionEmpty({
  dealCount,
}: PipelineConversionEmptyProps) {
  const leadsQuery = useLeads(
    { limit: 1 },
    { enabled: dealCount === 0 },
  )
  const guidance = pipelineEmptyGuidance({
    dealCount,
    unconvertedLeadCount: unconvertedLeadCount(leadsQuery.data?.meta.counts),
  })

  if (!guidance) return null

  return (
    <div className="mb-3 flex shrink-0 flex-col gap-2 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{guidance.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{guidance.body}</p>
      </div>
      <Link
        href={guidance.href}
        className={cn(
          buttonVariants({ size: "sm" }),
          "h-8 shrink-0 gap-1.5",
        )}
      >
        {guidance.actionLabel}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

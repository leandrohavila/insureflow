"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { builderSurfaces } from "./builder-surfaces"

export function BuilderCanvasSkeleton() {
  return (
    <div className={builderSurfaces.canvas}>
      <div className="mb-[var(--if-space-4)] flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className={builderSurfaces.sectionGap}>
        {[0, 1].map((section) => (
          <div key={section} className={builderSurfaces.section}>
            <div className={builderSurfaces.sectionHeader}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
            <div className={cn(builderSurfaces.sectionBody, builderSurfaces.fieldGap)}>
              {[0, 1, 2].map((field) => (
                <div key={field} className={builderSurfaces.field}>
                  <div className="flex gap-[var(--if-space-3)]">
                    <Skeleton className="h-4 w-6 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/5" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

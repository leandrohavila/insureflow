"use client"

import { Skeleton } from "@/components/ui/skeleton"

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
          <div key={section} className={builderSurfaces.level1}>
            <div className="border-b border-white/[0.06] p-[var(--if-space-4)]">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
            <div className="space-y-[var(--if-space-3)] p-[var(--if-space-4)]">
              {[0, 1, 2].map((field) => (
                <div key={field} className={builderSurfaces.level2}>
                  <div className="flex gap-[var(--if-space-3)] p-[var(--if-space-4)]">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
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

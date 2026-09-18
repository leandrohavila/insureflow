"use client"

import { createContext, useContext, type ReactNode } from "react"

import { useRelationshipIndex } from "@/lib/crm/relationship/hooks"
import type { RelationshipIndex } from "@/lib/crm/relationship/types"

type RelationshipIndexContextValue = {
  index: RelationshipIndex
  isLoading: boolean
  isError: boolean
  isIndexError: boolean
  refetch: () => void
}

const RelationshipIndexContext =
  createContext<RelationshipIndexContextValue | null>(null)

export function RelationshipIndexProvider({ children }: { children: ReactNode }) {
  const value = useRelationshipIndex()
  return (
    <RelationshipIndexContext.Provider value={value}>
      {children}
    </RelationshipIndexContext.Provider>
  )
}

export function useRelationshipIndexContext() {
  const ctx = useContext(RelationshipIndexContext)
  if (!ctx) {
    throw new Error(
      "useRelationshipIndexContext deve ser usado dentro de RelationshipIndexProvider.",
    )
  }
  return ctx
}

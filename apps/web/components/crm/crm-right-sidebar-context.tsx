"use client"

import { createContext, useContext } from "react"

import type { ResponsiveSidebarState } from "@/lib/hooks/use-responsive-sidebar"

export const CRMRightSidebarContext =
  createContext<ResponsiveSidebarState | null>(null)

export function useCRMRightSidebar() {
  const context = useContext(CRMRightSidebarContext)
  if (!context) {
    throw new Error("useCRMRightSidebar must be used within CRMRightSidebar")
  }
  return context
}

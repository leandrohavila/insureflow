"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"

export const CRM_RIGHT_SIDEBAR_STORAGE_KEY = "crm:right-sidebar:collapsed"
export const CRM_RIGHT_SIDEBAR_WIDTH_PX = 320

const MEDIA_WIDE = "(min-width: 1600px)"
const MEDIA_NOTEBOOK = "(min-width: 1366px)"

export type ResponsiveSidebarMode = "wide" | "notebook" | "compact"

function readCollapsedFromStorage(): boolean {
  if (typeof window === "undefined") return true
  try {
    const stored = localStorage.getItem(CRM_RIGHT_SIDEBAR_STORAGE_KEY)
    if (stored === null) return true
    return stored === "true"
  } catch {
    return true
  }
}

function writeCollapsedToStorage(collapsed: boolean) {
  try {
    localStorage.setItem(
      CRM_RIGHT_SIDEBAR_STORAGE_KEY,
      collapsed ? "true" : "false",
    )
  } catch {
    /* ignore quota / private mode */
  }
}

function resolveMode(): ResponsiveSidebarMode {
  if (typeof window === "undefined") return "notebook"
  if (window.matchMedia(MEDIA_WIDE).matches) return "wide"
  if (window.matchMedia(MEDIA_NOTEBOOK).matches) return "notebook"
  return "compact"
}

export function useResponsiveSidebar() {
  const [mode, setMode] = useState<ResponsiveSidebarMode>("notebook")
  const [collapsed, setCollapsed] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useLayoutEffect(() => {
    setCollapsed(readCollapsedFromStorage())
    setMode(resolveMode())
    setHydrated(true)
  }, [])

  useEffect(() => {
    const wideMq = window.matchMedia(MEDIA_WIDE)
    const notebookMq = window.matchMedia(MEDIA_NOTEBOOK)

    const onChange = () => {
      const nextMode = resolveMode()
      setMode(nextMode)
      if (nextMode === "compact") {
        setDrawerOpen(false)
      }
    }

    wideMq.addEventListener("change", onChange)
    notebookMq.addEventListener("change", onChange)
    return () => {
      wideMq.removeEventListener("change", onChange)
      notebookMq.removeEventListener("change", onChange)
    }
  }, [])

  const isInlineOpen = mode === "wide" || (mode === "notebook" && !collapsed)

  const isDrawerOpen = mode === "compact" && drawerOpen
  const isOpen = isInlineOpen || isDrawerOpen
  const showToggle = mode !== "wide"

  const setOpen = useCallback(
    (open: boolean) => {
      if (mode === "wide") return
      if (mode === "compact") {
        setDrawerOpen(open)
        return
      }
      const nextCollapsed = !open
      setCollapsed(nextCollapsed)
      writeCollapsedToStorage(nextCollapsed)
    },
    [mode],
  )

  const toggle = useCallback(() => {
    if (mode === "wide") return
    if (mode === "compact") {
      setDrawerOpen((current) => !current)
      return
    }
    setCollapsed((current) => {
      const next = !current
      writeCollapsedToStorage(next)
      return next
    })
  }, [mode])

  return useMemo(
    () => ({
      mode,
      collapsed: mode === "wide" ? false : collapsed,
      hydrated,
      isInlineOpen,
      isDrawerOpen,
      isOpen,
      showToggle,
      drawerOpen,
      setDrawerOpen,
      setOpen,
      toggle,
    }),
    [
      mode,
      collapsed,
      hydrated,
      isInlineOpen,
      isDrawerOpen,
      isOpen,
      showToggle,
      drawerOpen,
      setOpen,
      toggle,
    ],
  )
}

export type ResponsiveSidebarState = ReturnType<typeof useResponsiveSidebar>

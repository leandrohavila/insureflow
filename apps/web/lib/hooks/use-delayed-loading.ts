"use client"

import { useEffect, useState } from "react"

/**
 * Evita flicker de loading em fetches rápidos.
 * Retorna `showLoading` apenas após `delayMs` de loading contínuo.
 */
export function useDelayedLoading(isLoading: boolean, delayMs = 180): boolean {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false)
      return
    }

    const timer = window.setTimeout(() => setShowLoading(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, isLoading])

  return isLoading && showLoading
}

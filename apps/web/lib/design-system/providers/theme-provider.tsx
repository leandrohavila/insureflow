"use client"

import {
  ThemeProvider as BaseThemeProvider,
  useInsureFlowTheme,
  type InsureFlowTheme,
} from "@repo/ui/theme-provider"

type ThemeMode = InsureFlowTheme

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: ThemeMode
  storageKey?: string
}

/**
 * Product-level theme boundary.
 *
 * Today this delegates to `@repo/ui` and keeps the active dark theme.
 * Future tenant branding and accessibility themes should extend this boundary,
 * not bypass it from pages or feature modules.
 */
export function InsureFlowThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "insureflow-theme",
}: ThemeProviderProps) {
  return (
    <BaseThemeProvider defaultTheme={defaultTheme} storageKey={storageKey}>
      {children}
    </BaseThemeProvider>
  )
}

export { useInsureFlowTheme }
export type { ThemeMode }

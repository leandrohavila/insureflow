"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type InsureFlowTheme = "light" | "dark" | "system";

const DEFAULT_STORAGE_KEY = "insureflow-theme";

type ThemeContextValue = {
  theme: InsureFlowTheme;
  /** Effective palette after resolving `system`. */
  resolved: "light" | "dark";
  setTheme: (theme: InsureFlowTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyDomTheme(mode: InsureFlowTheme): "light" | "dark" {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  const resolved =
    mode === "system" ? readSystemPreference() : mode === "dark" ? "dark" : "light";
  root.classList.add(resolved === "dark" ? "dark" : "light");
  return resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  children: ReactNode;
  defaultTheme?: InsureFlowTheme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<InsureFlowTheme>(defaultTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    defaultTheme === "dark"
      ? "dark"
      : defaultTheme === "light"
        ? "light"
        : typeof window !== "undefined"
          ? readSystemPreference()
          : "light",
  );

  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as InsureFlowTheme | null;
      const initial = stored ?? defaultTheme;
      setThemeState(initial);
      setResolved(applyDomTheme(initial));
    } catch {
      setResolved(applyDomTheme(defaultTheme));
    }
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(applyDomTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback(
    (next: InsureFlowTheme) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* ignore quota / private mode */
      }
      setResolved(applyDomTheme(next));
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useInsureFlowTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useInsureFlowTheme must be used within ThemeProvider");
  }
  return ctx;
}

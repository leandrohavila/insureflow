"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "../lib/cn";

export type SearchBarProps = Omit<
  React.ComponentProps<"input">,
  "type" | "onChange"
> & {
  onChange?: (value: string) => void;
  /** Fired after `debounceMs` ms without input (does not fire on mount). */
  onSearch?: (value: string) => void;
  debounceMs?: number;
  containerClassName?: string;
};

export function SearchBar({
  className,
  containerClassName,
  value: valueProp,
  defaultValue = "",
  onChange,
  onSearch,
  debounceMs = 320,
  placeholder = "Buscar…",
  ...props
}: SearchBarProps) {
  const [uncontrolled, setUncontrolled] = useState(String(defaultValue));
  const isControlled = valueProp !== undefined;
  const value = isControlled ? String(valueProp) : uncontrolled;

  const skipSearchEffect = useRef(true);

  const setValue = (next: string) => {
    if (!isControlled) setUncontrolled(next);
    onChange?.(next);
  };

  useEffect(() => {
    if (!onSearch) return;
    if (skipSearchEffect.current) {
      skipSearchEffect.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      onSearch(value);
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [value, debounceMs, onSearch]);

  return (
    <div
      className={cn(
        "relative flex h-9 w-full max-w-md items-center rounded-lg border border-input bg-background shadow-sm ring-1 ring-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/35",
        containerClassName,
      )}
    >
      <Search
        className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        className={cn(
          "h-full w-full bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground",
          className,
        )}
        onChange={(e) => setValue(e.target.value)}
        {...props}
      />
    </div>
  );
}

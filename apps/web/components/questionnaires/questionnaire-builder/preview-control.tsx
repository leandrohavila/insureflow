"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type { InsuranceQuestionKind } from "./types"

export function PreviewControl({
  kind,
  placeholder,
  options,
  className,
}: {
  kind: InsuranceQuestionKind;
  placeholder?: string;
  options?: string;
  className?: string;
}) {
  const parsedOptions = options
    ?.split(/\n|,/)
    .map((option) => option.trim())
    .filter(Boolean);

  if (kind === "long_text") {
    return (
      <textarea
        disabled
        placeholder={placeholder || "Resposta longa"}
        className={cn(
          "min-h-20 w-full resize-none rounded-lg border border-input/70 bg-input/20 px-3 py-2 text-sm",
          className,
        )}
      />
    );
  }

  if (kind === "single_choice" || kind === "multi_choice") {
    const choices = parsedOptions ?? [];
    const inputType = kind === "single_choice" ? "radio" : "checkbox";

    return (
      <div
        className={cn(
          "space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3",
          className,
        )}
      >
        {choices.length > 0 ? (
          choices.slice(0, 4).map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <input type={inputType} disabled />
              {option}
            </label>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-white/[0.12] px-3 py-2 text-xs text-muted-foreground">
            Adicione opções abaixo
          </p>
        )}
      </div>
    );
  }

  if (kind === "yes_no") {
    return (
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        {["Sim", "Não"].map((option) => (
          <button
            key={option}
            type="button"
            disabled
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground"
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  const inputType =
    kind === "email"
      ? "email"
      : kind === "number" || kind === "currency"
        ? "number"
        : kind === "date"
          ? "date"
          : "text";

  return (
    <Input
      disabled
      type={inputType}
      placeholder={placeholder || "Resposta"}
      className={className}
    />
  );
}


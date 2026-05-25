"use client"

import {
  applyInputMask,
  formatDateBrMask,
  getFieldMask,
  isDateField,
} from "@/lib/questionnaires/questionnaire-field-validation"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  getFieldOptions,
  type QuestionnaireAnswerFieldProps,
} from "./questionnaire-answer-field.shared"

export type { QuestionnaireAnswerFieldProps }

export function QuestionnaireAnswerField({
  field,
  value,
  error,
  onChange,
  registerRef,
}: QuestionnaireAnswerFieldProps) {
  const label = (
    <span className="text-sm font-medium">
      {field.label}
      {field.required ? <span className="text-destructive"> *</span> : null}
    </span>
  )
  const invalid = Boolean(error)
  const fieldClass = cn(
    "w-full rounded-lg border bg-input/20 px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-3",
    invalid
      ? "border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/25"
      : "border-input/80 focus-visible:border-primary/40 focus-visible:ring-primary/20",
  )
  const mask = getFieldMask(field)
  const options = getFieldOptions(field)
  const errorMessage = error ? (
    <p className="text-xs text-destructive" role="alert">
      {error}
    </p>
  ) : null

  const wrap = (content: React.ReactNode, className?: string) => (
    <div ref={registerRef} className={className}>
      {content}
    </div>
  )

  if (field.type === "TEXTAREA") {
    return wrap(
      <label className="block space-y-2 sm:col-span-2">
        {label}
        <textarea
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder ?? undefined}
          aria-invalid={invalid}
          className={cn(fieldClass, "min-h-24 resize-y")}
        />
        {errorMessage}
        {field.helpText && !error ? (
          <span className="text-xs text-muted-foreground">{field.helpText}</span>
        ) : null}
      </label>,
      "sm:col-span-2",
    )
  }

  if (field.type === "SELECT") {
    return wrap(
      <fieldset className="space-y-2" aria-invalid={invalid} tabIndex={invalid ? -1 : undefined}>
        {label}
        <SelectOptionsBox invalid={invalid}>
          {options.length > 0 ? (
            options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name={field.id}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                {option.label}
              </label>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhuma opção cadastrada.
            </p>
          )}
        </SelectOptionsBox>
        {errorMessage}
      </fieldset>,
    )
  }

  if (field.type === "MULTI_SELECT") {
    const selected = Array.isArray(value) ? value : []
    return wrap(
      <fieldset className="space-y-2" aria-invalid={invalid} tabIndex={invalid ? -1 : undefined}>
        {label}
        <SelectOptionsBox invalid={invalid}>
          {options.length > 0 ? (
            options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={(event) => {
                    onChange(
                      event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value),
                    )
                  }}
                />
                {option.label}
              </label>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhuma opção cadastrada.
            </p>
          )}
        </SelectOptionsBox>
        {errorMessage}
      </fieldset>,
    )
  }

  if (field.type === "BOOLEAN") {
    return wrap(
      <label className="block space-y-2">
        {label}
        <select
          value={String(Boolean(value))}
          onChange={(event) => onChange(event.target.value === "true")}
          aria-invalid={invalid}
          className={cn(
            "flex h-9 w-full rounded-md border bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:ring-[3px]",
            invalid
              ? "border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/25"
              : "border-input focus-visible:border-ring focus-visible:ring-ring/50",
          )}
        >
          <option value="false">Não</option>
          <option value="true">Sim</option>
        </select>
        {errorMessage}
      </label>,
    )
  }

  const inputType =
    field.type === "EMAIL"
      ? "email"
      : field.type === "PHONE"
        ? "tel"
        : field.type === "NUMBER" || field.type === "CURRENCY"
          ? "number"
          : "text"

  const isDate = isDateField(field)

  return wrap(
    <label className="block space-y-2">
      {label}
      <Input
        type={isDate ? "text" : inputType}
        inputMode={isDate ? "numeric" : undefined}
        maxLength={isDate ? 10 : undefined}
        value={String(value ?? "")}
        onChange={(event) => {
          const next = isDate
            ? formatDateBrMask(event.target.value)
            : applyInputMask(event.target.value, mask)
          onChange(next)
        }}
        placeholder={isDate ? "DD/MM/AAAA" : (field.placeholder ?? undefined)}
        aria-invalid={invalid}
        className={invalid ? "border-destructive/70 focus-visible:ring-destructive/25" : undefined}
      />
      {errorMessage}
      {field.helpText && !error ? (
        <span className="text-xs text-muted-foreground">{field.helpText}</span>
      ) : null}
    </label>,
  )
}

function SelectOptionsBox({
  invalid,
  children,
}: {
  invalid: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border bg-white/[0.03] p-3",
        invalid ? "border-destructive/70" : "border-white/[0.08]",
      )}
    >
      {children}
    </div>
  )
}

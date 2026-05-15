"use client";

import * as React from "react";

import { cn } from "../lib/cn";

export type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "datetime-local";

export type FormFieldOption = { value: string; label: string };

export type FormFieldConfig = {
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  options?: FormFieldOption[];
  disabled?: boolean;
  className?: string;
  required?: boolean;
  rows?: number;
  autoComplete?: string;
};

export type FormBuilderProps = {
  id?: string;
  fields: FormFieldConfig[];
  values: Record<string, string | boolean | number | undefined>;
  onChange: (
    name: string,
    value: string | boolean | number | undefined,
  ) => void;
  idPrefix?: string;
  className?: string;
  /** Renders a grid: 1 col mobile, 2 cols from sm */
  columns?: 1 | 2;
};

const inputClass = cn(
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-colors",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function FormBuilder({
  id,
  fields,
  values,
  onChange,
  idPrefix = "if-form",
  className,
  columns = 2,
}: FormBuilderProps) {
  const grid =
    columns === 2 ? "grid gap-4 sm:grid-cols-2" : "grid gap-4 grid-cols-1";

  return (
    <div id={id} className={cn(grid, className)}>
      {fields.map((field) => {
        const fid = `${idPrefix}-${field.name}`;
        const value = values[field.name];

        const commonLabel = (
          <label
            htmlFor={fid}
            className="text-sm font-medium text-foreground leading-none"
          >
            {field.label}
            {field.required ? (
              <span className="text-destructive" aria-hidden>
                {" "}
                *
              </span>
            ) : null}
          </label>
        );

        if (field.type === "checkbox") {
          const checked = Boolean(value);
          return (
            <div
              key={field.name}
              className={cn(
                "flex flex-col gap-2 sm:col-span-2",
                field.className,
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  id={fid}
                  type="checkbox"
                  checked={checked}
                  disabled={field.disabled}
                  className="mt-1 size-4 rounded border-input accent-primary"
                  onChange={(e) => onChange(field.name, e.target.checked)}
                />
                <div className="grid gap-1">
                  {commonLabel}
                  {field.description ? (
                    <p className="text-sm text-muted-foreground">
                      {field.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <div
              key={field.name}
              className={cn(
                "flex flex-col gap-2 sm:col-span-2",
                field.className,
              )}
            >
              {commonLabel}
              {field.description ? (
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              ) : null}
              <textarea
                id={fid}
                rows={field.rows ?? 4}
                placeholder={field.placeholder}
                disabled={field.disabled}
                required={field.required}
                className={cn(inputClass, "min-h-24 resize-y py-2")}
                value={value === undefined || value === null ? "" : String(value)}
                onChange={(e) => onChange(field.name, e.target.value)}
              />
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.name} className={cn("flex flex-col gap-2", field.className)}>
              {commonLabel}
              {field.description ? (
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              ) : null}
              <select
                id={fid}
                disabled={field.disabled}
                required={field.required}
                className={cn(inputClass, "h-9")}
                value={value === undefined || value === null ? "" : String(value)}
                onChange={(e) => onChange(field.name, e.target.value)}
              >
                <option value="">{field.placeholder ?? "Selecione…"}</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={field.name} className={cn("flex flex-col gap-2", field.className)}>
            {commonLabel}
            {field.description ? (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            ) : null}
            <input
              id={fid}
              type={field.type}
              placeholder={field.placeholder}
              disabled={field.disabled}
              required={field.required}
              autoComplete={field.autoComplete}
              className={inputClass}
              value={
                value === undefined || value === null ? "" : String(value)
              }
              onChange={(e) => {
                if (field.type === "number") {
                  const n = e.target.value;
                  onChange(field.name, n === "" ? undefined : Number(n));
                } else {
                  onChange(field.name, e.target.value);
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

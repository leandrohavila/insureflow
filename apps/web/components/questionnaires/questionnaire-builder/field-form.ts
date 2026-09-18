import type {
  CreateQuestionnaireFieldInput,
  QuestionnaireField,
} from "@/lib/data-access/modules/questionnaires"

import { DEFAULT_SECTION, defaultQuestionKind, questionKindOptions } from "./constants"
import type { FieldSettings, InsuranceQuestionKind } from "./types"
import {
  buildFieldOptions,
  getFieldSettings,
  getQuestionKindFromField,
  optionalFormValue,
  uniqueQuestionKey,
} from "./utils"

export type FieldFormState = {
  label: string
  kind: InsuranceQuestionKind
  required: boolean
  order: number
  section: string
  placeholder: string
  helpText: string
  options: string
  defaultValue: string
}

export function emptyFieldForm(
  section: string,
  order: number,
  kind: InsuranceQuestionKind = "short_text",
): FieldFormState {
  return {
    label: "",
    kind,
    required: false,
    order,
    section: section || DEFAULT_SECTION,
    placeholder: "",
    helpText: "",
    options: "",
    defaultValue: "",
  }
}

export function fieldToFormState(field: QuestionnaireField): FieldFormState {
  const kind = getQuestionKindFromField(field)

  return {
    label: field.label,
    kind,
    required: field.required,
    order: field.order,
    section: (field.settings as FieldSettings)?.section ?? DEFAULT_SECTION,
    placeholder: field.placeholder ?? "",
    helpText: field.helpText ?? "",
    options: field.options?.map((o) => o.label).join("\n") ?? "",
    defaultValue: String((field.settings as FieldSettings)?.defaultValue ?? ""),
  }
}

export function parseOptionLabels(options: string) {
  return options
    .split(/\n|,/)
    .map((option) => option.trim())
    .filter(Boolean)
}

export function buildFieldInputFromForm(
  form: FieldFormState,
  fields: QuestionnaireField[],
  existingField?: QuestionnaireField | null,
): CreateQuestionnaireFieldInput | null {
  if (!form.label.trim()) return null

  const selectedKind =
    questionKindOptions.find((option) => option.value === form.kind) ??
    defaultQuestionKind
  const usesOptions =
    form.kind === "single_choice" || form.kind === "multi_choice"
  const key = existingField?.key ?? uniqueQuestionKey(form.label, fields)
  const options = buildFieldOptions(
    parseOptionLabels(form.options),
    existingField?.options,
  )

  const settings: FieldSettings = {
    ...getFieldSettings(existingField ?? ({ settings: {} } as QuestionnaireField)),
    section: form.section.trim() || DEFAULT_SECTION,
    inputKind: form.kind,
  }

  if (form.defaultValue.trim()) {
    settings.defaultValue = form.defaultValue.trim()
  } else {
    delete settings.defaultValue
  }

  if (selectedKind.mask) {
    settings.mask = selectedKind.mask
  } else {
    delete settings.mask
  }

  return {
    key,
    label: form.label.trim(),
    type: selectedKind.type,
    required: form.required,
    order: form.order,
    placeholder: optionalFormValue(form.placeholder) ?? selectedKind.placeholder,
    helpText: optionalFormValue(form.helpText),
    options: usesOptions ? options : undefined,
    settings,
  }
}

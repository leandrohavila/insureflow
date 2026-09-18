import type {
  FieldDefinition,
  InstantiatedField,
} from "@repo/forms-library"
import type { CreateQuestionnaireFieldInput } from "@/lib/data-access/modules/questionnaires"

export function instantiatedFieldToCreateInput(
  field: InstantiatedField,
): CreateQuestionnaireFieldInput {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    order: field.order,
    placeholder: field.placeholder,
    helpText: field.helpText,
    options: field.options,
    validation: field.validation ?? undefined,
    settings: field.settings,
  }
}

export function catalogFieldToCreateInput(
  field: FieldDefinition,
  options: {
    key: string
    order: number
    section: string
  },
): CreateQuestionnaireFieldInput {
  return instantiatedFieldToCreateInput({
    key: options.key,
    label: field.label,
    type: field.fieldType,
    required: field.required ?? false,
    order: options.order,
    placeholder: field.defaultPlaceholder,
    helpText: field.helpText,
    options: field.options,
    validation: field.validation ?? null,
    settings: {
      section: options.section,
      inputKind: field.inputKind,
      libraryFieldId: field.id,
      librarySource: field.product,
      ...(field.defaultMask ? { mask: field.defaultMask } : {}),
    },
  })
}

export type {
  FieldOption,
  FieldTypeMetadata,
  FieldValidator,
  FormFieldDescriptor,
  GenericRuleKind,
  GenericRuleValidator,
  SemanticFieldKind,
  TemplateDescriptor,
  ValidationContext,
  ValidationError,
  ValidationMode,
  ValidationProfile,
  ValidationResult,
  ValidationRuleV1,
  ValidationSchemaV1,
  ValidationSurface,
  ValidationWarning,
} from "./types/index"

export { SEMANTIC_FIELD_KINDS } from "./types/index"

export {
  ValidationEngine,
  defaultValidationEngine,
} from "./validation-engine"

export {
  ValidationRegistry,
  defaultValidationRegistry,
} from "./validation-registry"

export {
  FIELD_TYPE_METADATA,
  getFieldTypeMetadata,
  listFieldTypeMetadata,
} from "./field-metadata"

export {
  errorsToFieldMap,
  getFieldSection,
  resolveSemanticKind,
  resolveValidationProfile,
  toFormFieldDescriptor,
} from "./utils/field.util"

export {
  isEmptyAnswer,
  normalizeAnswerForSubmit,
} from "./utils/answer.util"

export {
  applyInputMask,
  formatDateBrMask,
  getFieldMask,
  isValidCpf,
  isValidCnpj,
  isValidCep,
  isValidPhone,
  isValidPlate,
  isValidRenavam,
  isValidEmail,
  isValidDateBr,
  onlyDigits,
  parseDateBrToIso,
} from "./utils/masks.util"

export {
  createClientValidationContext,
  createServerValidationContext,
  fieldsToDescriptors,
} from "./utils/context.util"

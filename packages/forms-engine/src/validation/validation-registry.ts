import type {
  FieldTypeMetadata,
  FieldValidator,
  GenericRuleValidator,
  SemanticFieldKind,
} from "./types/index"
import { nativeValidators, genericRuleValidators } from "./validators/index"

export class ValidationRegistry {
  private readonly validatorsByKind = new Map<SemanticFieldKind, FieldValidator[]>()
  private readonly validatorsById = new Map<string, FieldValidator>()
  private readonly genericRulesByType = new Map<
    GenericRuleValidator["ruleType"],
    GenericRuleValidator
  >()
  private readonly metadataByKind = new Map<SemanticFieldKind, FieldTypeMetadata>()

  constructor() {
    for (const validator of nativeValidators) {
      this.registerValidator(validator)
    }
    for (const ruleValidator of genericRuleValidators) {
      this.genericRulesByType.set(ruleValidator.ruleType, ruleValidator)
    }
  }

  registerValidator(validator: FieldValidator): void {
    this.validatorsById.set(validator.id, validator)
    for (const kind of validator.kinds) {
      const existing = this.validatorsByKind.get(kind) ?? []
      existing.push(validator)
      this.validatorsByKind.set(kind, existing)
    }
  }

  registerMetadata(metadata: FieldTypeMetadata): void {
    this.metadataByKind.set(metadata.kind, metadata)
  }

  getValidatorsForKind(kind: SemanticFieldKind): FieldValidator[] {
    return this.validatorsByKind.get(kind) ?? []
  }

  getValidatorById(id: string): FieldValidator | undefined {
    return this.validatorsById.get(id)
  }

  getGenericRuleValidator(
    ruleType: GenericRuleValidator["ruleType"],
  ): GenericRuleValidator | undefined {
    return this.genericRulesByType.get(ruleType)
  }

  getMetadata(kind: SemanticFieldKind): FieldTypeMetadata | undefined {
    return this.metadataByKind.get(kind)
  }

  listMetadata(): FieldTypeMetadata[] {
    return [...this.metadataByKind.values()]
  }

  listValidators(): FieldValidator[] {
    return [...this.validatorsById.values()]
  }
}

export const defaultValidationRegistry = new ValidationRegistry()

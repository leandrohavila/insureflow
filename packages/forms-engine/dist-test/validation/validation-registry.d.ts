import type { FieldTypeMetadata, FieldValidator, GenericRuleValidator, SemanticFieldKind } from "./types/index";
export declare class ValidationRegistry {
    private readonly validatorsByKind;
    private readonly validatorsById;
    private readonly genericRulesByType;
    private readonly metadataByKind;
    constructor();
    registerValidator(validator: FieldValidator): void;
    registerMetadata(metadata: FieldTypeMetadata): void;
    getValidatorsForKind(kind: SemanticFieldKind): FieldValidator[];
    getValidatorById(id: string): FieldValidator | undefined;
    getGenericRuleValidator(ruleType: GenericRuleValidator["ruleType"]): GenericRuleValidator | undefined;
    getMetadata(kind: SemanticFieldKind): FieldTypeMetadata | undefined;
    listMetadata(): FieldTypeMetadata[];
    listValidators(): FieldValidator[];
}
export declare const defaultValidationRegistry: ValidationRegistry;
//# sourceMappingURL=validation-registry.d.ts.map
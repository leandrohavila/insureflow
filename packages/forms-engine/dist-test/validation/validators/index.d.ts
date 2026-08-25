import type { FieldValidator, FormFieldDescriptor, ValidationContext, ValidationError, GenericRuleValidator } from "../types/index";
export declare const nativeValidators: FieldValidator[];
export declare const genericRuleValidators: GenericRuleValidator[];
export declare function applyGenericRules(value: unknown, field: FormFieldDescriptor, context: ValidationContext): ValidationError[];
//# sourceMappingURL=index.d.ts.map
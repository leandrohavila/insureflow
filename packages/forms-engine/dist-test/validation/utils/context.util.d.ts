import type { FormFieldDescriptor, ValidationContext, ValidationMode, ValidationProfile, ValidationSurface } from "../types/index";
export declare function createValidationContext(options: {
    mode: ValidationMode;
    profile: ValidationProfile;
    surface: ValidationSurface;
    answers: Record<string, unknown>;
    enforceRequired?: boolean;
    visibleFieldKeys?: ReadonlySet<string>;
    requiredFieldKeys?: ReadonlySet<string>;
    optionalFieldKeys?: ReadonlySet<string>;
    disabledFieldKeys?: ReadonlySet<string>;
}): ValidationContext;
export declare function createClientValidationContext(answers: Record<string, unknown>, options: {
    mode: ValidationMode;
    profile: ValidationProfile;
    enforceRequired?: boolean;
    visibleFieldKeys?: ReadonlySet<string>;
    requiredFieldKeys?: ReadonlySet<string>;
    optionalFieldKeys?: ReadonlySet<string>;
    disabledFieldKeys?: ReadonlySet<string>;
}): ValidationContext;
export declare function createServerValidationContext(answers: Record<string, unknown>, options: {
    mode: ValidationMode;
    profile: ValidationProfile;
    enforceRequired?: boolean;
    visibleFieldKeys?: ReadonlySet<string>;
    requiredFieldKeys?: ReadonlySet<string>;
    optionalFieldKeys?: ReadonlySet<string>;
    disabledFieldKeys?: ReadonlySet<string>;
}): ValidationContext;
export declare function fieldsToDescriptors(fields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    order: number;
    placeholder?: string | null;
    helpText?: string | null;
    options?: unknown;
    validation?: unknown;
    settings?: unknown;
}>): FormFieldDescriptor[];
//# sourceMappingURL=context.util.d.ts.map
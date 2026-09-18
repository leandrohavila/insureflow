import type { FormFieldDescriptor, SemanticFieldKind } from "../types/index";
type FieldSettings = {
    section?: string;
    inputKind?: string;
    mask?: string;
    defaultValue?: unknown;
};
export declare function getFieldSettings(field: FormFieldDescriptor): FieldSettings;
export declare function resolveSemanticKind(field: FormFieldDescriptor): SemanticFieldKind;
export declare function resolveValidationProfile(settings?: Record<string, unknown> | null): "v1" | "v2";
export declare function getFieldSection(field: FormFieldDescriptor): string;
export declare function isFieldVisible(field: FormFieldDescriptor, context: {
    visibleFieldKeys?: ReadonlySet<string>;
}): boolean;
export declare function isFieldDisabled(field: FormFieldDescriptor, context: {
    disabledFieldKeys?: ReadonlySet<string>;
}): boolean;
export declare function isFieldRequired(field: FormFieldDescriptor, context: {
    requiredFieldKeys?: ReadonlySet<string>;
    optionalFieldKeys?: ReadonlySet<string>;
}): boolean;
export declare function createValidationError(field: FormFieldDescriptor, code: string, message: string, rule?: string): {
    fieldKey: string;
    code: string;
    message: string;
    rule: string | undefined;
};
export declare function errorsToFieldMap(errors: Array<{
    fieldKey: string;
    message: string;
}>): Record<string, string>;
export declare function toFormFieldDescriptor(field: {
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
}): FormFieldDescriptor;
export {};
//# sourceMappingURL=field.util.d.ts.map
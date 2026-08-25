export declare const SEMANTIC_FIELD_KINDS: readonly ["short_text", "long_text", "number", "decimal", "currency", "cpf", "cnpj", "cep", "phone", "email", "url", "date", "time", "datetime", "plate", "renavam", "chassi", "file", "checkbox", "radio", "select", "multiselect"];
export type SemanticFieldKind = (typeof SEMANTIC_FIELD_KINDS)[number];
export type ValidationProfile = "v1" | "v2";
export type ValidationMode = "draft" | "finalize";
export type ValidationSurface = "client" | "server";
export type FieldOption = {
    label: string;
    value: string;
};
/** Descriptor agnóstico de persistência — usado pelo motor em client e server */
export type FormFieldDescriptor = {
    key: string;
    label: string;
    type: string;
    required: boolean;
    order: number;
    placeholder?: string | null;
    helpText?: string | null;
    options?: FieldOption[] | null;
    validation?: ValidationSchemaV1 | null;
    settings?: Record<string, unknown>;
};
export type TemplateDescriptor = {
    name: string;
    settings?: Record<string, unknown>;
    fields: FormFieldDescriptor[];
};
export type ValidationRuleV1 = {
    type: "required";
    when?: "always" | "finalize";
} | {
    type: "minLength";
    value: number;
    message?: string;
} | {
    type: "maxLength";
    value: number;
    message?: string;
} | {
    type: "min";
    value: number;
    message?: string;
} | {
    type: "max";
    value: number;
    message?: string;
} | {
    type: "pattern";
    value: string;
    message?: string;
} | {
    type: "oneOf";
    values: unknown[];
    message?: string;
} | {
    type: "cpf";
    message?: string;
} | {
    type: "cnpj";
    message?: string;
} | {
    type: "cep";
    message?: string;
} | {
    type: "phone";
    message?: string;
} | {
    type: "email";
    message?: string;
} | {
    type: "url";
    message?: string;
} | {
    type: "plate";
    message?: string;
} | {
    type: "renavam";
    message?: string;
} | {
    type: "chassi";
    message?: string;
} | {
    type: "fileRequired";
    message?: string;
} | {
    type: "minItems";
    value: number;
    message?: string;
} | {
    type: "maxItems";
    value: number;
    message?: string;
} | {
    type: "mask";
    value: string;
    message?: string;
};
export type ValidationSchemaV1 = {
    version: 1;
    rules?: ValidationRuleV1[];
};
export type ValidationError = {
    fieldKey: string;
    code: string;
    message: string;
    rule?: string;
};
export type ValidationWarning = {
    fieldKey: string;
    code: string;
    message: string;
};
export type ValidationContext = {
    mode: ValidationMode;
    profile: ValidationProfile;
    surface: ValidationSurface;
    locale?: "pt-BR";
    answers: Record<string, unknown>;
    /** Quando true, exige required mesmo em draft (uso interno) */
    enforceRequired?: boolean;
    /** EPIC 2 — campos visíveis; se omitido, todos visíveis */
    visibleFieldKeys?: ReadonlySet<string>;
    /** EPIC 2 — campos obrigatórios via regras */
    requiredFieldKeys?: ReadonlySet<string>;
    /** EPIC 2 — campos opcionais via regras (sobrescreve required do schema) */
    optionalFieldKeys?: ReadonlySet<string>;
    /** EPIC 2 — campos desabilitados via regras; não validados */
    disabledFieldKeys?: ReadonlySet<string>;
};
export type ValidationResult = {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
};
export type GenericRuleKind = ValidationRuleV1["type"];
export type FieldTypeMetadata = {
    kind: SemanticFieldKind;
    label: string;
    description: string;
    icon: string;
    category: "texto" | "documentos" | "veiculos" | "escolhas" | "arquivos" | "data";
    prismaTypes: string[];
    supportedRules: GenericRuleKind[];
    supportedMasks: string[];
    supportedValidators: string[];
};
export interface FieldValidator {
    readonly id: string;
    readonly kinds: readonly SemanticFieldKind[];
    validate(value: unknown, field: FormFieldDescriptor, context: ValidationContext): ValidationError[];
}
export interface GenericRuleValidator {
    readonly ruleType: ValidationRuleV1["type"];
    validate(value: unknown, field: FormFieldDescriptor, rule: ValidationRuleV1, context: ValidationContext): ValidationError | null;
}
//# sourceMappingURL=index.d.ts.map
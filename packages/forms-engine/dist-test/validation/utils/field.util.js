"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldSettings = getFieldSettings;
exports.resolveSemanticKind = resolveSemanticKind;
exports.resolveValidationProfile = resolveValidationProfile;
exports.getFieldSection = getFieldSection;
exports.isFieldVisible = isFieldVisible;
exports.isFieldDisabled = isFieldDisabled;
exports.isFieldRequired = isFieldRequired;
exports.createValidationError = createValidationError;
exports.errorsToFieldMap = errorsToFieldMap;
exports.toFormFieldDescriptor = toFormFieldDescriptor;
const INPUT_KIND_MAP = {
    short_text: "short_text",
    long_text: "long_text",
    number: "number",
    cpf: "cpf",
    cnpj: "cnpj",
    cep: "cep",
    phone: "phone",
    email: "email",
    date: "date",
    yes_no: "checkbox",
    single_choice: "select",
    multi_choice: "multiselect",
    plate: "plate",
    currency: "currency",
    file: "file",
    url: "url",
    time: "time",
    datetime: "datetime",
    renavam: "renavam",
    chassi: "chassi",
    decimal: "decimal",
    radio: "radio",
};
const MASK_KIND_MAP = {
    cpf: "cpf",
    cnpj: "cnpj",
    cep: "cep",
    phone: "phone",
    plate: "plate",
};
function getFieldSettings(field) {
    return (field.settings ?? {});
}
function resolveSemanticKind(field) {
    const settings = getFieldSettings(field);
    const mask = settings.mask;
    if (mask && MASK_KIND_MAP[mask]) {
        return MASK_KIND_MAP[mask];
    }
    const inputKind = settings.inputKind;
    if (inputKind && INPUT_KIND_MAP[inputKind]) {
        return INPUT_KIND_MAP[inputKind];
    }
    switch (field.type) {
        case "TEXTAREA":
            return "long_text";
        case "NUMBER":
            return "number";
        case "CURRENCY":
            return "currency";
        case "EMAIL":
            return "email";
        case "PHONE":
            return "phone";
        case "DATE":
            return "date";
        case "BOOLEAN":
            return "checkbox";
        case "SELECT":
            return settings.inputKind === "radio" ? "radio" : "select";
        case "MULTI_SELECT":
            return "multiselect";
        case "FILE":
            return "file";
        case "TEXT":
        default:
            return "short_text";
    }
}
function resolveValidationProfile(settings) {
    const engineVersion = settings?.engineVersion;
    return engineVersion === 2 ? "v2" : "v1";
}
function getFieldSection(field) {
    const section = getFieldSettings(field).section;
    return typeof section === "string" && section.trim() ? section.trim() : "Geral";
}
function isFieldVisible(field, context) {
    if (!context.visibleFieldKeys)
        return true;
    return context.visibleFieldKeys.has(field.key);
}
function isFieldDisabled(field, context) {
    if (!context.disabledFieldKeys)
        return false;
    return context.disabledFieldKeys.has(field.key);
}
function isFieldRequired(field, context) {
    if (context.optionalFieldKeys?.has(field.key))
        return false;
    if (context.requiredFieldKeys?.has(field.key))
        return true;
    return field.required;
}
function createValidationError(field, code, message, rule) {
    return {
        fieldKey: field.key,
        code,
        message,
        rule,
    };
}
function errorsToFieldMap(errors) {
    return Object.fromEntries(errors.map((error) => [error.fieldKey, error.message]));
}
function toFormFieldDescriptor(field) {
    return {
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order,
        placeholder: field.placeholder,
        helpText: field.helpText,
        options: normalizeOptionsFromUnknown(field.options),
        validation: parseValidationSchema(field.validation),
        settings: field.settings && typeof field.settings === "object"
            ? field.settings
            : {},
    };
}
function normalizeOptionsFromUnknown(options) {
    if (!Array.isArray(options))
        return null;
    return options.flatMap((item) => {
        if (typeof item === "string") {
            const label = item.trim();
            if (!label)
                return [];
            return [{ label, value: label.toLowerCase().replace(/\s+/g, "_") }];
        }
        if (item && typeof item === "object") {
            const record = item;
            const label = String(record.label ?? "").trim();
            if (!label)
                return [];
            const value = String(record.value ?? label).trim();
            return [{ label, value }];
        }
        return [];
    });
}
function parseValidationSchema(validation) {
    if (!validation || typeof validation !== "object")
        return null;
    const record = validation;
    if (record.version === 1) {
        return validation;
    }
    return null;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultValidationEngine = exports.ValidationEngine = void 0;
const answer_util_1 = require("./utils/answer.util");
const field_util_1 = require("./utils/field.util");
const validation_registry_1 = require("./validation-registry");
const index_1 = require("./validators/index");
class ValidationEngine {
    registry;
    constructor(registry = validation_registry_1.defaultValidationRegistry) {
        this.registry = registry;
    }
    validateField(field, value, context) {
        if (!(0, field_util_1.isFieldVisible)(field, context)) {
            return { valid: true, errors: [], warnings: [] };
        }
        if ((0, field_util_1.isFieldDisabled)(field, context)) {
            return { valid: true, errors: [], warnings: [] };
        }
        const errors = [];
        const empty = (0, answer_util_1.isEmptyAnswer)(field, value);
        const shouldRequire = (0, field_util_1.isFieldRequired)(field, context) &&
            (context.mode === "finalize" || context.enforceRequired === true);
        if (empty) {
            if (shouldRequire) {
                errors.push((0, field_util_1.createValidationError)(field, "required", context.surface === "server"
                    ? `Campo obrigatório sem resposta: ${field.label}`
                    : "Preencha este campo", "required"));
            }
            return { valid: errors.length === 0, errors, warnings: [] };
        }
        if (context.mode === "draft" && !shouldRequire) {
            const kind = (0, field_util_1.resolveSemanticKind)(field);
            const validators = this.registry.getValidatorsForKind(kind);
            for (const validator of validators) {
                errors.push(...validator.validate(value, field, context));
            }
            errors.push(...(0, index_1.applyGenericRules)(value, field, context));
            return { valid: errors.length === 0, errors, warnings: [] };
        }
        const kind = (0, field_util_1.resolveSemanticKind)(field);
        const validators = this.registry.getValidatorsForKind(kind);
        if (validators.length === 0) {
            errors.push((0, field_util_1.createValidationError)(field, "unsupported_kind", `Tipo de campo não suportado: ${kind}`));
        }
        for (const validator of validators) {
            errors.push(...validator.validate(value, field, context));
        }
        errors.push(...(0, index_1.applyGenericRules)(value, field, context));
        return { valid: errors.length === 0, errors, warnings: [] };
    }
    validateSection(fields, answers, section, context) {
        const sectionFields = fields
            .filter((field) => (0, field_util_1.getFieldSection)(field) === section)
            .sort((a, b) => a.order - b.order);
        return this.validateFields(sectionFields, answers, context);
    }
    validateSubmission(fields, answers, context) {
        const sortedFields = [...fields].sort((a, b) => a.order - b.order);
        const fieldResult = this.validateFields(sortedFields, answers, context);
        const fieldsByKey = new Map(sortedFields.map((field) => [field.key, field]));
        const unknownKeys = Object.keys(answers).filter((key) => !fieldsByKey.has(key));
        if (unknownKeys.length > 0 && context.surface === "server") {
            fieldResult.errors.push({
                fieldKey: unknownKeys[0],
                code: "unknown_field",
                message: `Campos inexistentes no template: ${unknownKeys.join(", ")}`,
            });
            fieldResult.valid = false;
        }
        return fieldResult;
    }
    validateTemplate(template) {
        const errors = [];
        const keys = new Set();
        if (!template.name?.trim()) {
            errors.push({
                fieldKey: "__template__",
                code: "template_name_required",
                message: "Nome do template é obrigatório",
            });
        }
        for (const field of template.fields) {
            if (!field.key?.trim()) {
                errors.push({
                    fieldKey: "__template__",
                    code: "field_key_required",
                    message: "Campo sem key",
                });
                continue;
            }
            if (keys.has(field.key)) {
                errors.push({
                    fieldKey: field.key,
                    code: "duplicate_key",
                    message: `Key duplicada: ${field.key}`,
                });
            }
            keys.add(field.key);
            if (!field.label?.trim()) {
                errors.push({
                    fieldKey: field.key,
                    code: "field_label_required",
                    message: "Label é obrigatório",
                });
            }
            const kind = (0, field_util_1.resolveSemanticKind)(field);
            if ((kind === "select" || kind === "multiselect" || kind === "radio") &&
                (!field.options || field.options.length === 0)) {
                errors.push({
                    fieldKey: field.key,
                    code: "options_required",
                    message: "Campos de escolha precisam de opções",
                });
            }
        }
        return { valid: errors.length === 0, errors, warnings: [] };
    }
    buildSubmitAnswers(fields, answers) {
        return Object.fromEntries(fields
            .map((field) => [
            field.key,
            (0, answer_util_1.normalizeAnswerForSubmit)(field, answers[field.key]),
        ])
            .filter(([, value]) => value !== undefined));
    }
    buildDraftAnswers(fields, answers, context) {
        const draftContext = { ...context, mode: "draft" };
        const result = {};
        for (const field of fields) {
            const value = answers[field.key];
            if ((0, answer_util_1.isEmptyAnswer)(field, value))
                continue;
            const fieldResult = this.validateField(field, value, draftContext);
            if (!fieldResult.valid)
                continue;
            const normalized = (0, answer_util_1.normalizeAnswerForSubmit)(field, value);
            if (normalized !== undefined) {
                result[field.key] = normalized;
            }
        }
        return result;
    }
    validateFields(fields, answers, context) {
        const errors = [];
        for (const field of fields) {
            const result = this.validateField(field, answers[field.key], context);
            errors.push(...result.errors);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings: [],
        };
    }
}
exports.ValidationEngine = ValidationEngine;
exports.defaultValidationEngine = new ValidationEngine();

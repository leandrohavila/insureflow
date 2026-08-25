"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genericRuleValidators = exports.nativeValidators = void 0;
exports.applyGenericRules = applyGenericRules;
const field_util_1 = require("../utils/field.util");
const answer_util_1 = require("../utils/answer.util");
const validators_util_1 = require("../utils/validators.util");
function err(field, code, message, rule) {
    return (0, field_util_1.createValidationError)(field, code, message, rule);
}
function ruleMessage(rule, fallback) {
    return "message" in rule && typeof rule.message === "string"
        ? rule.message
        : fallback;
}
function ruleNumberValue(rule) {
    return "value" in rule && typeof rule.value === "number" ? rule.value : null;
}
function rulePatternValue(rule) {
    return "value" in rule && typeof rule.value === "string" ? rule.value : null;
}
function assertString(value, field, message = "Preencha este campo corretamente") {
    if (typeof value !== "string")
        return [err(field, "invalid_type", message)];
    return [];
}
function skipSemanticValidation(context) {
    return context.profile === "v1" && context.surface === "server";
}
function createNativeValidator(id, kinds, validateValue) {
    return { id, kinds, validate: validateValue };
}
exports.nativeValidators = [
    createNativeValidator("native.short_text", ["short_text"], (value, field) => assertString(value, field)),
    createNativeValidator("native.long_text", ["long_text"], (value, field) => assertString(value, field)),
    createNativeValidator("native.cpf", ["cpf"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe um CPF válido");
        if (stringErrors.length > 0)
            return stringErrors;
        if (skipSemanticValidation(context))
            return [];
        return (0, validators_util_1.isValidCpf)(String(value))
            ? []
            : [err(field, "invalid_cpf", "Informe um CPF válido")];
    }),
    createNativeValidator("native.cnpj", ["cnpj"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe um CNPJ válido");
        if (stringErrors.length > 0)
            return stringErrors;
        if (skipSemanticValidation(context))
            return [];
        return (0, validators_util_1.isValidCnpj)(String(value))
            ? []
            : [err(field, "invalid_cnpj", "Informe um CNPJ válido")];
    }),
    createNativeValidator("native.cep", ["cep"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe um CEP válido");
        if (stringErrors.length > 0)
            return stringErrors;
        if (skipSemanticValidation(context))
            return [];
        return (0, validators_util_1.isValidCep)(String(value))
            ? []
            : [err(field, "invalid_cep", "Informe um CEP válido")];
    }),
    createNativeValidator("native.phone", ["phone"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe um telefone válido");
        if (stringErrors.length > 0)
            return stringErrors;
        if (skipSemanticValidation(context))
            return [];
        return (0, validators_util_1.isValidPhone)(String(value))
            ? []
            : [err(field, "invalid_phone", "Informe um telefone válido")];
    }),
    createNativeValidator("native.email", ["email"], (value, field) => {
        const stringErrors = assertString(value, field, "Informe um e-mail válido");
        if (stringErrors.length > 0)
            return stringErrors;
        return (0, validators_util_1.isValidEmail)(String(value))
            ? []
            : [err(field, "invalid_email", "Informe um e-mail válido")];
    }),
    createNativeValidator("native.url", ["url"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe uma URL válida");
        if (stringErrors.length > 0)
            return stringErrors;
        if (skipSemanticValidation(context))
            return [];
        return (0, validators_util_1.isValidUrl)(String(value))
            ? []
            : [err(field, "invalid_url", "Informe uma URL válida")];
    }),
    createNativeValidator("native.date", ["date"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe uma data válida");
        if (stringErrors.length > 0)
            return stringErrors;
        if (context.surface === "client") {
            return (0, validators_util_1.isValidDateBr)(String(value))
                ? []
                : [err(field, "invalid_date", "Informe uma data válida")];
        }
        return (0, validators_util_1.isValidIsoDate)(String(value))
            ? []
            : [err(field, "invalid_date", "Informe uma data válida")];
    }),
    createNativeValidator("native.time", ["time"], (value, field) => {
        const stringErrors = assertString(value, field, "Informe um horário válido");
        if (stringErrors.length > 0)
            return stringErrors;
        return (0, validators_util_1.isValidTime)(String(value))
            ? []
            : [err(field, "invalid_time", "Informe um horário válido")];
    }),
    createNativeValidator("native.datetime", ["datetime"], (value, field) => {
        const stringErrors = assertString(value, field, "Informe data e hora válidas");
        if (stringErrors.length > 0)
            return stringErrors;
        return (0, validators_util_1.isValidDateTime)(String(value))
            ? []
            : [err(field, "invalid_datetime", "Informe data e hora válidas")];
    }),
    createNativeValidator("native.plate", ["plate"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe uma placa válida");
        if (stringErrors.length > 0)
            return stringErrors;
        if (skipSemanticValidation(context))
            return [];
        return (0, validators_util_1.isValidPlate)(String(value))
            ? []
            : [err(field, "invalid_plate", "Informe uma placa válida")];
    }),
    createNativeValidator("native.renavam", ["renavam"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe um RENAVAM válido");
        if (stringErrors.length > 0)
            return stringErrors;
        if (skipSemanticValidation(context))
            return [];
        return (0, validators_util_1.isValidRenavam)(String(value))
            ? []
            : [err(field, "invalid_renavam", "Informe um RENAVAM válido")];
    }),
    createNativeValidator("native.chassi", ["chassi"], (value, field, context) => {
        const stringErrors = assertString(value, field, "Informe um chassi válido");
        if (stringErrors.length > 0)
            return stringErrors;
        if (skipSemanticValidation(context))
            return [];
        return (0, validators_util_1.isValidChassi)(String(value))
            ? []
            : [err(field, "invalid_chassi", "Informe um chassi válido")];
    }),
    createNativeValidator("native.file", ["file"], (value, field) => assertString(value, field, "Informe um arquivo válido")),
    createNativeValidator("native.number", ["number", "decimal"], (value, field) => {
        const parsed = (0, validators_util_1.parseFiniteNumber)(value);
        if (parsed === null) {
            return [err(field, "invalid_number", "Informe um número válido")];
        }
        return [];
    }),
    createNativeValidator("native.currency", ["currency"], (value, field) => {
        if (!(0, validators_util_1.isValidNumber)(value) && (0, validators_util_1.parseFiniteNumber)(value) === null) {
            return [err(field, "invalid_number", "Informe um número válido")];
        }
        return [];
    }),
    createNativeValidator("native.checkbox", ["checkbox"], (value, field) => {
        if (typeof value !== "boolean") {
            return [err(field, "invalid_boolean", "Selecione uma opção")];
        }
        return [];
    }),
    createNativeValidator("native.select", ["select", "radio"], (value, field, context) => {
        if (typeof value !== "string") {
            return [err(field, "invalid_option", "Selecione uma opção válida")];
        }
        const options = (0, validators_util_1.normalizeOptionValues)(field.options);
        if (options.length === 0)
            return [];
        const allowed = new Set(options.map((option) => option.value));
        if (!allowed.has(value)) {
            const message = context.surface === "server"
                ? `${field.label} possui opção inválida`
                : "Selecione uma opção válida";
            return [err(field, "invalid_option", message)];
        }
        return [];
    }),
    createNativeValidator("native.multiselect", ["multiselect"], (value, field, context) => {
        if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
            return [err(field, "invalid_options", "Selecione ao menos uma opção")];
        }
        const options = (0, validators_util_1.normalizeOptionValues)(field.options);
        if (options.length === 0)
            return [];
        const allowed = new Set(options.map((option) => option.value));
        for (const item of value) {
            if (!allowed.has(item)) {
                const message = context.surface === "server"
                    ? `${field.label} possui opção inválida`
                    : "Selecione opções válidas";
                return [err(field, "invalid_option", message)];
            }
        }
        return [];
    }),
];
exports.genericRuleValidators = [
    {
        ruleType: "required",
        validate(value, field, _rule, context) {
            if (!(0, answer_util_1.isEmptyAnswer)(field, value))
                return null;
            if (context.mode === "draft" && !context.enforceRequired)
                return null;
            return err(field, "required", "Preencha este campo", "required");
        },
    },
    {
        ruleType: "minLength",
        validate(value, field, rule) {
            if (typeof value !== "string")
                return null;
            const min = ruleNumberValue(rule);
            if (min === null)
                return null;
            if (value.length < min) {
                return err(field, "min_length", ruleMessage(rule, `Mínimo de ${min} caracteres`), "minLength");
            }
            return null;
        },
    },
    {
        ruleType: "maxLength",
        validate(value, field, rule) {
            if (typeof value !== "string")
                return null;
            const max = ruleNumberValue(rule);
            if (max === null)
                return null;
            if (value.length > max) {
                return err(field, "max_length", ruleMessage(rule, `Máximo de ${max} caracteres`), "maxLength");
            }
            return null;
        },
    },
    {
        ruleType: "min",
        validate(value, field, rule) {
            const parsed = (0, validators_util_1.parseFiniteNumber)(value);
            const min = ruleNumberValue(rule);
            if (parsed === null || min === null)
                return null;
            if (parsed < min) {
                return err(field, "min_value", ruleMessage(rule, `Valor mínimo: ${min}`), "min");
            }
            return null;
        },
    },
    {
        ruleType: "max",
        validate(value, field, rule) {
            const parsed = (0, validators_util_1.parseFiniteNumber)(value);
            const max = ruleNumberValue(rule);
            if (parsed === null || max === null)
                return null;
            if (parsed > max) {
                return err(field, "max_value", ruleMessage(rule, `Valor máximo: ${max}`), "max");
            }
            return null;
        },
    },
    {
        ruleType: "pattern",
        validate(value, field, rule) {
            if (typeof value !== "string")
                return null;
            const pattern = rulePatternValue(rule);
            if (!pattern)
                return null;
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                return err(field, "pattern", ruleMessage(rule, "Formato inválido"), "pattern");
            }
            return null;
        },
    },
    {
        ruleType: "oneOf",
        validate(value, field, rule) {
            if (!("values" in rule))
                return null;
            if (!rule.values.includes(value)) {
                return err(field, "one_of", ruleMessage(rule, "Valor não permitido"), "oneOf");
            }
            return null;
        },
    },
    {
        ruleType: "cpf",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidCpf)(value))
                return null;
            return err(field, "invalid_cpf", ruleMessage(rule, "Informe um CPF válido"), "cpf");
        },
    },
    {
        ruleType: "cnpj",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidCnpj)(value))
                return null;
            return err(field, "invalid_cnpj", ruleMessage(rule, "Informe um CNPJ válido"), "cnpj");
        },
    },
    {
        ruleType: "cep",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidCep)(value))
                return null;
            return err(field, "invalid_cep", ruleMessage(rule, "Informe um CEP válido"), "cep");
        },
    },
    {
        ruleType: "phone",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidPhone)(value))
                return null;
            return err(field, "invalid_phone", ruleMessage(rule, "Informe um telefone válido"), "phone");
        },
    },
    {
        ruleType: "email",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidEmail)(value))
                return null;
            return err(field, "invalid_email", ruleMessage(rule, "Informe um e-mail válido"), "email");
        },
    },
    {
        ruleType: "url",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidUrl)(value))
                return null;
            return err(field, "invalid_url", ruleMessage(rule, "Informe uma URL válida"), "url");
        },
    },
    {
        ruleType: "plate",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidPlate)(value))
                return null;
            return err(field, "invalid_plate", ruleMessage(rule, "Informe uma placa válida"), "plate");
        },
    },
    {
        ruleType: "renavam",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidRenavam)(value))
                return null;
            return err(field, "invalid_renavam", ruleMessage(rule, "Informe um RENAVAM válido"), "renavam");
        },
    },
    {
        ruleType: "chassi",
        validate(value, field, rule) {
            if (typeof value !== "string" || (0, validators_util_1.isValidChassi)(value))
                return null;
            return err(field, "invalid_chassi", ruleMessage(rule, "Informe um chassi válido"), "chassi");
        },
    },
    {
        ruleType: "fileRequired",
        validate(value, field, rule) {
            if (typeof value === "string" && value.trim())
                return null;
            return err(field, "file_required", ruleMessage(rule, "Anexe um arquivo"), "fileRequired");
        },
    },
    {
        ruleType: "minItems",
        validate(value, field, rule) {
            if (!Array.isArray(value))
                return null;
            const min = ruleNumberValue(rule);
            if (min === null)
                return null;
            if (value.length < min) {
                return err(field, "min_items", ruleMessage(rule, `Selecione ao menos ${min} opções`), "minItems");
            }
            return null;
        },
    },
    {
        ruleType: "maxItems",
        validate(value, field, rule) {
            if (!Array.isArray(value))
                return null;
            const max = ruleNumberValue(rule);
            if (max === null)
                return null;
            if (value.length > max) {
                return err(field, "max_items", ruleMessage(rule, `Selecione no máximo ${max} opções`), "maxItems");
            }
            return null;
        },
    },
    {
        ruleType: "mask",
        validate(_value, _field, _rule) {
            return null;
        },
    },
];
function applyGenericRules(value, field, context) {
    if (context.profile !== "v2")
        return [];
    const schema = field.validation;
    if (!schema || schema.version !== 1 || !schema.rules?.length)
        return [];
    const errors = [];
    for (const rule of schema.rules) {
        const validator = exports.genericRuleValidators.find((item) => item.ruleType === rule.type);
        if (!validator)
            continue;
        const error = validator.validate(value, field, rule, context);
        if (error)
            errors.push(error);
    }
    return errors;
}

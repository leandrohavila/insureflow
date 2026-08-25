"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDateBrToIso = exports.isValidDateBr = exports.isValidEmail = exports.isValidRenavam = exports.isValidPlate = exports.isValidPhone = exports.isValidCep = exports.isValidCnpj = exports.isValidCpf = void 0;
exports.onlyDigits = onlyDigits;
exports.formatDateBrMask = formatDateBrMask;
exports.applyInputMask = applyInputMask;
exports.getFieldMask = getFieldMask;
function onlyDigits(value, maxLength) {
    return value.replace(/\D/g, "").slice(0, maxLength);
}
function formatDateBrMask(value) {
    const digits = onlyDigits(value, 8);
    if (digits.length <= 2)
        return digits;
    if (digits.length <= 4)
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function applyInputMask(value, mask) {
    if (mask === "cpf") {
        return onlyDigits(value, 11)
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    if (mask === "cnpj") {
        return onlyDigits(value, 14)
            .replace(/(\d{2})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1/$2")
            .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
    if (mask === "cep") {
        return onlyDigits(value, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");
    }
    if (mask === "phone") {
        const digits = onlyDigits(value, 11);
        if (digits.length <= 10) {
            return digits
                .replace(/(\d{2})(\d)/, "($1) $2")
                .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
        }
        return digits
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
    }
    if (mask === "plate") {
        return value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 7);
    }
    return value;
}
function getFieldMask(field) {
    const settings = (field.settings ?? {});
    const mask = settings.mask;
    if (mask)
        return mask;
    const inputKind = settings.inputKind;
    if (inputKind === "cpf")
        return "cpf";
    if (inputKind === "cnpj")
        return "cnpj";
    if (inputKind === "cep")
        return "cep";
    if (inputKind === "plate")
        return "plate";
    if (field.type === "PHONE" || inputKind === "phone")
        return "phone";
    return undefined;
}
var validators_util_1 = require("./validators.util");
Object.defineProperty(exports, "isValidCpf", { enumerable: true, get: function () { return validators_util_1.isValidCpf; } });
Object.defineProperty(exports, "isValidCnpj", { enumerable: true, get: function () { return validators_util_1.isValidCnpj; } });
Object.defineProperty(exports, "isValidCep", { enumerable: true, get: function () { return validators_util_1.isValidCep; } });
Object.defineProperty(exports, "isValidPhone", { enumerable: true, get: function () { return validators_util_1.isValidPhone; } });
Object.defineProperty(exports, "isValidPlate", { enumerable: true, get: function () { return validators_util_1.isValidPlate; } });
Object.defineProperty(exports, "isValidRenavam", { enumerable: true, get: function () { return validators_util_1.isValidRenavam; } });
Object.defineProperty(exports, "isValidEmail", { enumerable: true, get: function () { return validators_util_1.isValidEmail; } });
Object.defineProperty(exports, "isValidDateBr", { enumerable: true, get: function () { return validators_util_1.isValidDateBr; } });
Object.defineProperty(exports, "parseDateBrToIso", { enumerable: true, get: function () { return validators_util_1.parseDateBrToIso; } });

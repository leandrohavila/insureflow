"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmptyAnswer = isEmptyAnswer;
exports.normalizeAnswerForSubmit = normalizeAnswerForSubmit;
const validators_util_1 = require("./validators.util");
const field_util_1 = require("./field.util");
function isEmptyAnswer(field, value) {
    const kind = (0, field_util_1.resolveSemanticKind)(field);
    if (field.type === "BOOLEAN" || kind === "checkbox") {
        return value === null || value === undefined;
    }
    if (field.type === "MULTI_SELECT" || kind === "multiselect") {
        return !Array.isArray(value) || value.length === 0;
    }
    if (value === null || value === undefined)
        return true;
    if (typeof value === "string")
        return value.trim() === "";
    if (Array.isArray(value))
        return value.length === 0;
    return false;
}
function normalizeAnswerForSubmit(field, value) {
    const kind = (0, field_util_1.resolveSemanticKind)(field);
    if (kind === "date" || field.type === "DATE") {
        if (typeof value !== "string")
            return undefined;
        const trimmed = value.trim();
        if (!trimmed)
            return undefined;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        const iso = (0, validators_util_1.parseDateBrToIso)(trimmed);
        return iso ?? undefined;
    }
    if (kind === "number" || kind === "currency" || kind === "decimal") {
        if (value === "" || value === null || value === undefined)
            return undefined;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
    }
    if (kind === "multiselect" || field.type === "MULTI_SELECT") {
        return Array.isArray(value) ? value : [];
    }
    return value;
}

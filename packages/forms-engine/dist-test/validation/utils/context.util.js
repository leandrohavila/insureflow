"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidationContext = createValidationContext;
exports.createClientValidationContext = createClientValidationContext;
exports.createServerValidationContext = createServerValidationContext;
exports.fieldsToDescriptors = fieldsToDescriptors;
const field_util_1 = require("./field.util");
function createValidationContext(options) {
    return {
        locale: "pt-BR",
        ...options,
    };
}
function createClientValidationContext(answers, options) {
    return createValidationContext({
        ...options,
        surface: "client",
        answers,
    });
}
function createServerValidationContext(answers, options) {
    return createValidationContext({
        ...options,
        surface: "server",
        answers,
    });
}
function fieldsToDescriptors(fields) {
    return fields.map((field) => (0, field_util_1.toFormFieldDescriptor)(field));
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRuleContext = buildRuleContext;
exports.resolveFieldSection = resolveFieldSection;
exports.resolveAnswerValue = resolveAnswerValue;
const field_util_1 = require("../validation/utils/field.util");
const rules_util_1 = require("./utils/rules.util");
function buildRuleContext(input) {
    const fieldKeys = (0, rules_util_1.collectTemplateFieldKeys)(input.template);
    const sections = (0, rules_util_1.collectTemplateSections)(input.template);
    return {
        template: input.template,
        submission: input.submission,
        answers: input.answers,
        visibleFieldKeys: new Set(fieldKeys),
        hiddenFieldKeys: new Set(),
        currentField: input.currentField,
        currentSection: input.currentSection,
        currentUser: input.currentUser,
        tenant: input.tenant,
        metadata: input.metadata,
        // Expose section lists through metadata for consumers
        ...(sections.length > 0
            ? {}
            : {}),
    };
}
function resolveFieldSection(field) {
    return (0, field_util_1.getFieldSection)(field);
}
function resolveAnswerValue(answers, fieldKey) {
    return answers[fieldKey];
}

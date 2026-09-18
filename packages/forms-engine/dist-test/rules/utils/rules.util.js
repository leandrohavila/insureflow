"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRulesProfile = resolveRulesProfile;
exports.isConditionGroup = isConditionGroup;
exports.parseRulesFromSettings = parseRulesFromSettings;
exports.collectTemplateSections = collectTemplateSections;
exports.collectTemplateFieldKeys = collectTemplateFieldKeys;
exports.createBaselineEvaluationState = createBaselineEvaluationState;
exports.isFieldRequiredByRules = isFieldRequiredByRules;
exports.isFieldVisibleByRules = isFieldVisibleByRules;
exports.isFieldDisabledByRules = isFieldDisabledByRules;
exports.isSectionVisibleByRules = isSectionVisibleByRules;
exports.createRuleId = createRuleId;
exports.createEmptyRule = createEmptyRule;
exports.createConditionGroup = createConditionGroup;
const field_util_1 = require("../../validation/utils/field.util");
function resolveRulesProfile(settings) {
    const engineVersion = settings?.engineVersion;
    return engineVersion === 2 ? "v2" : "v1";
}
function isConditionGroup(node) {
    return (typeof node === "object" &&
        node !== null &&
        "logic" in node &&
        "conditions" in node &&
        Array.isArray(node.conditions));
}
function parseRulesFromSettings(settings) {
    if (!settings || !Array.isArray(settings.rules))
        return [];
    return settings.rules.flatMap((item) => {
        if (!item || typeof item !== "object")
            return [];
        const record = item;
        const id = typeof record.id === "string" ? record.id.trim() : "";
        const name = typeof record.name === "string" ? record.name.trim() : "";
        if (!id || !name)
            return [];
        const conditions = Array.isArray(record.conditions)
            ? record.conditions
            : [];
        const actions = Array.isArray(record.actions) ? record.actions : [];
        return [
            {
                id,
                name,
                enabled: record.enabled !== false,
                conditionLogic: record.conditionLogic === "or" || record.conditionLogic === "and"
                    ? record.conditionLogic
                    : "and",
                conditions,
                actions: actions.filter((action) => Boolean(action && typeof action === "object" && "type" in action)),
            },
        ];
    });
}
function collectTemplateSections(template) {
    const sections = new Set();
    for (const field of template.fields) {
        sections.add((0, field_util_1.getFieldSection)(field));
    }
    return [...sections];
}
function collectTemplateFieldKeys(template) {
    return template.fields.map((field) => field.key);
}
function createBaselineEvaluationState(template) {
    const fieldKeys = collectTemplateFieldKeys(template);
    const sections = collectTemplateSections(template);
    return {
        visibleFieldKeys: new Set(fieldKeys),
        hiddenFieldKeys: new Set(),
        requiredFieldKeys: new Set(template.fields.filter((field) => field.required).map((field) => field.key)),
        optionalFieldKeys: new Set(),
        disabledFieldKeys: new Set(),
        enabledFieldKeys: new Set(),
        visibleSections: new Set(sections),
        hiddenSections: new Set(),
        valueOverrides: {},
        clearedFieldKeys: new Set(),
        executedActions: [],
        matchedRuleIds: [],
    };
}
function isFieldRequiredByRules(field, requiredFieldKeys, optionalFieldKeys) {
    if (optionalFieldKeys.has(field.key))
        return false;
    if (requiredFieldKeys.has(field.key))
        return true;
    return field.required;
}
function isFieldVisibleByRules(fieldKey, visibleFieldKeys, hiddenFieldKeys) {
    if (hiddenFieldKeys.has(fieldKey))
        return false;
    return visibleFieldKeys.has(fieldKey);
}
function isFieldDisabledByRules(fieldKey, disabledFieldKeys, enabledFieldKeys) {
    if (enabledFieldKeys.has(fieldKey))
        return false;
    return disabledFieldKeys.has(fieldKey);
}
function isSectionVisibleByRules(section, visibleSections, hiddenSections) {
    if (hiddenSections.has(section))
        return false;
    return visibleSections.has(section);
}
function createRuleId() {
    return `rule_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function createEmptyRule(name = "Nova regra") {
    return {
        id: createRuleId(),
        name,
        enabled: true,
        conditionLogic: "and",
        conditions: [],
        actions: [],
    };
}
function createConditionGroup(logic = "and") {
    return { logic, conditions: [] };
}

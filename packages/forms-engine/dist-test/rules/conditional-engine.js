"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConditionalEngine = exports.ConditionalEngine = void 0;
const field_util_1 = require("../validation/utils/field.util");
const rule_engine_1 = require("./rule-engine");
const rules_util_1 = require("./utils/rules.util");
/**
 * Consumidor de alto nível do RuleEngine — expõe estado condicional
 * para campos e seções sem duplicar lógica de avaliação.
 */
class ConditionalEngine {
    ruleEngine;
    constructor(ruleEngine = rule_engine_1.defaultRuleEngine) {
        this.ruleEngine = ruleEngine;
    }
    evaluate(input) {
        const result = this.ruleEngine.evaluate(input);
        return {
            ...result,
            fieldStates: this.buildFieldStates(input.template, result),
            sectionStates: this.buildSectionStates(input.template, result),
        };
    }
    evaluateWithRules(template, answers, rules) {
        return this.evaluate({ template, answers, rules });
    }
    getFieldState(field, result) {
        const visible = (0, rules_util_1.isFieldVisibleByRules)(field.key, result.visibleFieldKeys, result.hiddenFieldKeys);
        const required = (0, rules_util_1.isFieldRequiredByRules)(field, result.requiredFieldKeys, result.optionalFieldKeys);
        const disabled = (0, rules_util_1.isFieldDisabledByRules)(field.key, result.disabledFieldKeys, result.enabledFieldKeys);
        const value = result.valueOverrides[field.key];
        return {
            visible,
            required,
            disabled,
            ...(value !== undefined ? { value } : {}),
        };
    }
    getSectionState(section, result) {
        return {
            visible: (0, rules_util_1.isSectionVisibleByRules)(section, result.visibleSections, result.hiddenSections),
        };
    }
    buildFieldStates(template, result) {
        return Object.fromEntries(template.fields.map((field) => [field.key, this.getFieldState(field, result)]));
    }
    buildSectionStates(template, result) {
        const sections = new Set(template.fields.map((field) => (0, field_util_1.getFieldSection)(field)));
        return Object.fromEntries([...sections].map((section) => [section, this.getSectionState(section, result)]));
    }
}
exports.ConditionalEngine = ConditionalEngine;
exports.defaultConditionalEngine = new ConditionalEngine();

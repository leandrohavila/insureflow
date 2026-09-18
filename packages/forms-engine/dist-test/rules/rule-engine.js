"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRuleEngine = exports.RuleEngine = void 0;
const field_util_1 = require("../validation/utils/field.util");
const rule_context_1 = require("./rule-context");
const rule_evaluator_1 = require("./rule-evaluator");
const rules_util_1 = require("./utils/rules.util");
class RuleEngine {
    evaluator;
    constructor(evaluator = rule_evaluator_1.defaultRuleEvaluator) {
        this.evaluator = evaluator;
    }
    evaluate(input) {
        const profile = (0, rules_util_1.resolveRulesProfile)(input.template.settings);
        const rules = input.rules ?? (0, rules_util_1.parseRulesFromSettings)(input.template.settings ?? {});
        if (profile !== "v2") {
            return this.buildInactiveResult(input.template);
        }
        const context = (0, rule_context_1.buildRuleContext)(input);
        const state = (0, rules_util_1.createBaselineEvaluationState)(input.template);
        for (const rule of rules) {
            this.evaluator.evaluateRule(rule, state, context);
        }
        return this.toResult(state, true);
    }
    evaluateField(field, input) {
        const section = (0, field_util_1.getFieldSection)(field);
        return this.evaluate({
            ...input,
            currentField: field,
            currentSection: section,
        });
    }
    evaluateSection(section, input) {
        return this.evaluate({
            ...input,
            currentSection: section,
        });
    }
    evaluateTemplate(input) {
        return this.evaluate(input);
    }
    evaluateSubmission(input) {
        return this.evaluate(input);
    }
    testRule(rule, input) {
        const profile = (0, rules_util_1.resolveRulesProfile)(input.template.settings);
        if (profile !== "v2") {
            const inactive = this.buildInactiveResult(input.template);
            return {
                matched: false,
                executedActions: [],
                affectedFieldKeys: [],
                affectedSections: [],
                state: inactive,
            };
        }
        const context = (0, rule_context_1.buildRuleContext)(input);
        const state = (0, rules_util_1.createBaselineEvaluationState)(input.template);
        const matched = this.evaluator.evaluateRule(rule, state, context);
        const result = this.toResult(state, true);
        const affectedFieldKeys = new Set();
        const affectedSections = new Set();
        for (const executed of result.executedActions) {
            if (executed.action.targetFieldKey) {
                affectedFieldKeys.add(executed.action.targetFieldKey);
            }
            if (executed.action.targetSection) {
                affectedSections.add(executed.action.targetSection);
            }
        }
        return {
            matched,
            executedActions: result.executedActions,
            affectedFieldKeys: [...affectedFieldKeys],
            affectedSections: [...affectedSections],
            state: result,
        };
    }
    isFieldVisible(fieldKey, result) {
        return (0, rules_util_1.isFieldVisibleByRules)(fieldKey, result.visibleFieldKeys, result.hiddenFieldKeys);
    }
    isFieldRequired(field, result) {
        return (0, rules_util_1.isFieldRequiredByRules)(field, result.requiredFieldKeys, result.optionalFieldKeys);
    }
    isFieldDisabled(fieldKey, result) {
        return (0, rules_util_1.isFieldDisabledByRules)(fieldKey, result.disabledFieldKeys, result.enabledFieldKeys);
    }
    isSectionVisible(section, result) {
        return (0, rules_util_1.isSectionVisibleByRules)(section, result.visibleSections, result.hiddenSections);
    }
    applyValueOverrides(answers, result) {
        if (!result.rulesActive)
            return answers;
        const next = { ...answers };
        for (const [key, value] of Object.entries(result.valueOverrides)) {
            next[key] = value;
        }
        for (const key of result.clearedFieldKeys) {
            delete next[key];
        }
        return next;
    }
    buildInactiveResult(template) {
        const baseline = (0, rules_util_1.createBaselineEvaluationState)(template);
        return this.toResult(baseline, false);
    }
    toResult(state, rulesActive) {
        return {
            rulesActive,
            matchedRuleIds: [...state.matchedRuleIds],
            visibleFieldKeys: new Set(state.visibleFieldKeys),
            hiddenFieldKeys: new Set(state.hiddenFieldKeys),
            requiredFieldKeys: new Set(state.requiredFieldKeys),
            optionalFieldKeys: new Set(state.optionalFieldKeys),
            disabledFieldKeys: new Set(state.disabledFieldKeys),
            enabledFieldKeys: new Set(state.enabledFieldKeys),
            visibleSections: new Set(state.visibleSections),
            hiddenSections: new Set(state.hiddenSections),
            valueOverrides: { ...state.valueOverrides },
            clearedFieldKeys: new Set(state.clearedFieldKeys),
            jumpToSection: state.jumpToSection,
            executedActions: [...state.executedActions],
        };
    }
}
exports.RuleEngine = RuleEngine;
exports.defaultRuleEngine = new RuleEngine();

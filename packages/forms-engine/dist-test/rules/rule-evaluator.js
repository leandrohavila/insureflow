"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRuleEvaluator = exports.RuleEvaluator = void 0;
const action_executor_1 = require("./action-executor");
const condition_evaluator_1 = require("./condition-evaluator");
class RuleEvaluator {
    conditionEvaluator;
    actionExecutor;
    constructor(conditionEvaluator = condition_evaluator_1.defaultConditionEvaluator, actionExecutor = action_executor_1.defaultActionExecutor) {
        this.conditionEvaluator = conditionEvaluator;
        this.actionExecutor = actionExecutor;
    }
    evaluateRule(rule, state, context) {
        if (!rule.enabled)
            return false;
        const matched = this.conditionEvaluator.evaluateNodes(rule.conditions, rule.conditionLogic ?? "and", context);
        if (matched) {
            state.matchedRuleIds.push(rule.id);
            this.actionExecutor.executeRule(rule, state, context);
        }
        return matched;
    }
}
exports.RuleEvaluator = RuleEvaluator;
exports.defaultRuleEvaluator = new RuleEvaluator();

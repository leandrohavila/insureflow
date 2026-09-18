"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConditionEvaluator = exports.ConditionEvaluator = void 0;
const rule_registry_1 = require("./rule-registry");
const rules_util_1 = require("./utils/rules.util");
const rule_context_1 = require("./rule-context");
class ConditionEvaluator {
    registry;
    constructor(registry = rule_registry_1.defaultRuleRegistry) {
        this.registry = registry;
    }
    evaluateNodes(nodes, logic, context) {
        if (nodes.length === 0)
            return true;
        if (logic === "and") {
            return nodes.every((node) => this.evaluateNode(node, context));
        }
        return nodes.some((node) => this.evaluateNode(node, context));
    }
    evaluateNode(node, context) {
        if ((0, rules_util_1.isConditionGroup)(node)) {
            return this.evaluateGroup(node, context);
        }
        return this.evaluateCondition(node, context);
    }
    evaluateGroup(group, context) {
        return this.evaluateNodes(group.conditions, group.logic, context);
    }
    evaluateCondition(condition, context) {
        const left = (0, rule_context_1.resolveAnswerValue)(context.answers, condition.fieldKey);
        const handler = this.registry.getOperator(condition.operator);
        if (!handler)
            return false;
        return handler.evaluate(left, condition, context);
    }
}
exports.ConditionEvaluator = ConditionEvaluator;
exports.defaultConditionEvaluator = new ConditionEvaluator();

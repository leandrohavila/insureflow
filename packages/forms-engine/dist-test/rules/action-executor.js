"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultActionExecutor = exports.ActionExecutor = void 0;
const rule_registry_1 = require("./rule-registry");
class ActionExecutor {
    registry;
    constructor(registry = rule_registry_1.defaultRuleRegistry) {
        this.registry = registry;
    }
    executeRule(rule, state, context) {
        for (const action of rule.actions) {
            this.executeAction(action, state, context, rule);
        }
    }
    executeAction(action, state, context, rule) {
        const handler = this.registry.getAction(action.type);
        if (!handler)
            return;
        handler.execute(action, state, context, rule);
    }
}
exports.ActionExecutor = ActionExecutor;
exports.defaultActionExecutor = new ActionExecutor();

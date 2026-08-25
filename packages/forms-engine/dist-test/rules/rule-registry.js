"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRuleRegistry = exports.RuleRegistry = void 0;
const index_1 = require("./actions/index");
const index_2 = require("./operators/index");
class RuleRegistry {
    operators = new Map();
    actions = new Map();
    constructor() {
        for (const operator of index_2.nativeRuleOperators) {
            this.registerOperator(operator);
        }
        for (const action of index_1.nativeRuleActions) {
            this.registerAction(action);
        }
    }
    registerOperator(handler) {
        this.operators.set(handler.operator, handler);
    }
    registerAction(handler) {
        this.actions.set(handler.actionType, handler);
    }
    getOperator(operator) {
        return this.operators.get(operator);
    }
    getAction(actionType) {
        return this.actions.get(actionType);
    }
    listOperators() {
        return [...this.operators.values()];
    }
    listActions() {
        return [...this.actions.values()];
    }
}
exports.RuleRegistry = RuleRegistry;
exports.defaultRuleRegistry = new RuleRegistry();

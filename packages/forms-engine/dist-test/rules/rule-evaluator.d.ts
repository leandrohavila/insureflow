import type { FormRuleDefinition, RuleContext, RuleEvaluationState } from "./types/index";
import { type ActionExecutor } from "./action-executor";
import { type ConditionEvaluator } from "./condition-evaluator";
export declare class RuleEvaluator {
    private readonly conditionEvaluator;
    private readonly actionExecutor;
    constructor(conditionEvaluator?: ConditionEvaluator, actionExecutor?: ActionExecutor);
    evaluateRule(rule: FormRuleDefinition, state: RuleEvaluationState, context: RuleContext): boolean;
}
export declare const defaultRuleEvaluator: RuleEvaluator;
//# sourceMappingURL=rule-evaluator.d.ts.map
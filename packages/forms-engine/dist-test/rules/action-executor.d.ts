import type { FormRuleDefinition, RuleActionDefinition, RuleContext, RuleEvaluationState } from "./types/index";
import { type RuleRegistry } from "./rule-registry";
export declare class ActionExecutor {
    private readonly registry;
    constructor(registry?: RuleRegistry);
    executeRule(rule: FormRuleDefinition, state: RuleEvaluationState, context: RuleContext): void;
    executeAction(action: RuleActionDefinition, state: RuleEvaluationState, context: RuleContext, rule: FormRuleDefinition): void;
}
export declare const defaultActionExecutor: ActionExecutor;
//# sourceMappingURL=action-executor.d.ts.map
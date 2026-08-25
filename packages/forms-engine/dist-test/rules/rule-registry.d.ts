import type { RuleActionHandler, RuleActionType, RuleOperator, RuleOperatorHandler } from "./types/index";
export declare class RuleRegistry {
    private readonly operators;
    private readonly actions;
    constructor();
    registerOperator(handler: RuleOperatorHandler): void;
    registerAction(handler: RuleActionHandler): void;
    getOperator(operator: RuleOperator): RuleOperatorHandler | undefined;
    getAction(actionType: RuleActionType): RuleActionHandler | undefined;
    listOperators(): RuleOperatorHandler[];
    listActions(): RuleActionHandler[];
}
export declare const defaultRuleRegistry: RuleRegistry;
//# sourceMappingURL=rule-registry.d.ts.map
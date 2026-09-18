import type { RuleCondition, RuleConditionGroup, RuleConditionNode, RuleContext } from "./types/index";
import { type RuleRegistry } from "./rule-registry";
export declare class ConditionEvaluator {
    private readonly registry;
    constructor(registry?: RuleRegistry);
    evaluateNodes(nodes: RuleConditionNode[], logic: "and" | "or", context: RuleContext): boolean;
    evaluateNode(node: RuleConditionNode, context: RuleContext): boolean;
    evaluateGroup(group: RuleConditionGroup, context: RuleContext): boolean;
    evaluateCondition(condition: RuleCondition, context: RuleContext): boolean;
}
export declare const defaultConditionEvaluator: ConditionEvaluator;
//# sourceMappingURL=condition-evaluator.d.ts.map
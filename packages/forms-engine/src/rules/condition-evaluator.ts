import type {
  RuleCondition,
  RuleConditionGroup,
  RuleConditionNode,
  RuleContext,
} from "./types/index"
import { defaultRuleRegistry, type RuleRegistry } from "./rule-registry"
import { isConditionGroup } from "./utils/rules.util"
import { resolveAnswerValue } from "./rule-context"

export class ConditionEvaluator {
  constructor(private readonly registry: RuleRegistry = defaultRuleRegistry) {}

  evaluateNodes(
    nodes: RuleConditionNode[],
    logic: "and" | "or",
    context: RuleContext,
  ): boolean {
    if (nodes.length === 0) return true

    if (logic === "and") {
      return nodes.every((node) => this.evaluateNode(node, context))
    }

    return nodes.some((node) => this.evaluateNode(node, context))
  }

  evaluateNode(node: RuleConditionNode, context: RuleContext): boolean {
    if (isConditionGroup(node)) {
      return this.evaluateGroup(node, context)
    }
    return this.evaluateCondition(node, context)
  }

  evaluateGroup(group: RuleConditionGroup, context: RuleContext): boolean {
    return this.evaluateNodes(group.conditions, group.logic, context)
  }

  evaluateCondition(condition: RuleCondition, context: RuleContext): boolean {
    const left = resolveAnswerValue(context.answers, condition.fieldKey)
    const handler = this.registry.getOperator(condition.operator)
    if (!handler) return false
    return handler.evaluate(left, condition, context)
  }
}

export const defaultConditionEvaluator = new ConditionEvaluator()

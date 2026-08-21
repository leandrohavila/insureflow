import type { FormRuleDefinition, RuleContext, RuleEvaluationState } from "./types/index"
import { defaultActionExecutor, type ActionExecutor } from "./action-executor"
import {
  defaultConditionEvaluator,
  type ConditionEvaluator,
} from "./condition-evaluator"

export class RuleEvaluator {
  constructor(
    private readonly conditionEvaluator: ConditionEvaluator = defaultConditionEvaluator,
    private readonly actionExecutor: ActionExecutor = defaultActionExecutor,
  ) {}

  evaluateRule(
    rule: FormRuleDefinition,
    state: RuleEvaluationState,
    context: RuleContext,
  ): boolean {
    if (!rule.enabled) return false

    const matched = this.conditionEvaluator.evaluateNodes(
      rule.conditions,
      rule.conditionLogic ?? "and",
      context,
    )

    if (matched) {
      state.matchedRuleIds.push(rule.id)
      this.actionExecutor.executeRule(rule, state, context)
    }

    return matched
  }
}

export const defaultRuleEvaluator = new RuleEvaluator()

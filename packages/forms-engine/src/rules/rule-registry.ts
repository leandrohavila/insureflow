import type {
  RuleActionHandler,
  RuleActionType,
  RuleOperator,
  RuleOperatorHandler,
} from "./types/index"
import { nativeRuleActions } from "./actions/index"
import { nativeRuleOperators } from "./operators/index"

export class RuleRegistry {
  private readonly operators = new Map<RuleOperator, RuleOperatorHandler>()
  private readonly actions = new Map<RuleActionType, RuleActionHandler>()

  constructor() {
    for (const operator of nativeRuleOperators) {
      this.registerOperator(operator)
    }
    for (const action of nativeRuleActions) {
      this.registerAction(action)
    }
  }

  registerOperator(handler: RuleOperatorHandler): void {
    this.operators.set(handler.operator, handler)
  }

  registerAction(handler: RuleActionHandler): void {
    this.actions.set(handler.actionType, handler)
  }

  getOperator(operator: RuleOperator): RuleOperatorHandler | undefined {
    return this.operators.get(operator)
  }

  getAction(actionType: RuleActionType): RuleActionHandler | undefined {
    return this.actions.get(actionType)
  }

  listOperators(): RuleOperatorHandler[] {
    return [...this.operators.values()]
  }

  listActions(): RuleActionHandler[] {
    return [...this.actions.values()]
  }
}

export const defaultRuleRegistry = new RuleRegistry()

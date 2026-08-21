import type {
  FormRuleDefinition,
  RuleActionDefinition,
  RuleContext,
  RuleEvaluationState,
} from "./types/index"
import { defaultRuleRegistry, type RuleRegistry } from "./rule-registry"

export class ActionExecutor {
  constructor(private readonly registry: RuleRegistry = defaultRuleRegistry) {}

  executeRule(
    rule: FormRuleDefinition,
    state: RuleEvaluationState,
    context: RuleContext,
  ): void {
    for (const action of rule.actions) {
      this.executeAction(action, state, context, rule)
    }
  }

  executeAction(
    action: RuleActionDefinition,
    state: RuleEvaluationState,
    context: RuleContext,
    rule: FormRuleDefinition,
  ): void {
    const handler = this.registry.getAction(action.type)
    if (!handler) return
    handler.execute(action, state, context, rule)
  }
}

export const defaultActionExecutor = new ActionExecutor()

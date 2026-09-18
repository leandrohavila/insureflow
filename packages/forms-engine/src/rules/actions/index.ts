import type {
  FormRuleDefinition,
  RuleActionDefinition,
  RuleActionHandler,
  RuleContext,
  RuleEvaluationState,
} from "../types/index"

function requireFieldKey(action: RuleActionDefinition, actionType: string): string {
  const key = action.targetFieldKey?.trim()
  if (!key) {
    throw new Error(`Ação ${actionType} requer targetFieldKey`)
  }
  return key
}

function requireSection(action: RuleActionDefinition, actionType: string): string {
  const section = action.targetSection?.trim()
  if (!section) {
    throw new Error(`Ação ${actionType} requer targetSection`)
  }
  return section
}

export const nativeRuleActions: RuleActionHandler[] = [
  {
    actionType: "showField",
    execute(action, state, _context, rule) {
      const key = requireFieldKey(action, "showField")
      state.visibleFieldKeys.add(key)
      state.hiddenFieldKeys.delete(key)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "hideField",
    execute(action, state, _context, rule) {
      const key = requireFieldKey(action, "hideField")
      state.hiddenFieldKeys.add(key)
      state.visibleFieldKeys.delete(key)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "requireField",
    execute(action, state, _context, rule) {
      const key = requireFieldKey(action, "requireField")
      state.requiredFieldKeys.add(key)
      state.optionalFieldKeys.delete(key)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "optionalField",
    execute(action, state, _context, rule) {
      const key = requireFieldKey(action, "optionalField")
      state.optionalFieldKeys.add(key)
      state.requiredFieldKeys.delete(key)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "enableField",
    execute(action, state, _context, rule) {
      const key = requireFieldKey(action, "enableField")
      state.enabledFieldKeys.add(key)
      state.disabledFieldKeys.delete(key)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "disableField",
    execute(action, state, _context, rule) {
      const key = requireFieldKey(action, "disableField")
      state.disabledFieldKeys.add(key)
      state.enabledFieldKeys.delete(key)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "setValue",
    execute(action, state, _context, rule) {
      const key = requireFieldKey(action, "setValue")
      state.valueOverrides[key] = action.value
      state.clearedFieldKeys.delete(key)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "clearValue",
    execute(action, state, _context, rule) {
      const key = requireFieldKey(action, "clearValue")
      state.clearedFieldKeys.add(key)
      delete state.valueOverrides[key]
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "showSection",
    execute(action, state, _context, rule) {
      const section = requireSection(action, "showSection")
      state.visibleSections.add(section)
      state.hiddenSections.delete(section)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "hideSection",
    execute(action, state, _context, rule) {
      const section = requireSection(action, "hideSection")
      state.hiddenSections.add(section)
      state.visibleSections.delete(section)
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
  {
    actionType: "jumpToSection",
    execute(action, state, _context, rule) {
      const section = requireSection(action, "jumpToSection")
      state.jumpToSection = section
      state.executedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        action,
      })
    },
  },
]

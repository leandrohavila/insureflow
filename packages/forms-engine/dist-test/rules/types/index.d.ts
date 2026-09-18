import type { FormFieldDescriptor, TemplateDescriptor } from "../../validation/types/index";
export declare const RULE_OPERATORS: readonly ["equals", "notEquals", "greaterThan", "greaterOrEqual", "lessThan", "lessOrEqual", "contains", "startsWith", "endsWith", "between", "in", "notIn", "isEmpty", "isFilled", "exists", "notExists"];
export type RuleOperator = (typeof RULE_OPERATORS)[number];
export declare const RULE_ACTION_TYPES: readonly ["showField", "hideField", "requireField", "optionalField", "enableField", "disableField", "setValue", "clearValue", "showSection", "hideSection", "jumpToSection"];
export type RuleActionType = (typeof RULE_ACTION_TYPES)[number];
export type RuleCondition = {
    fieldKey: string;
    operator: RuleOperator;
    value?: unknown;
    /** Segundo valor para operador `between` */
    valueTo?: unknown;
};
export type RuleConditionGroup = {
    logic: "and" | "or";
    conditions: RuleConditionNode[];
};
export type RuleConditionNode = RuleCondition | RuleConditionGroup;
export type RuleActionDefinition = {
    type: RuleActionType;
    targetFieldKey?: string;
    targetSection?: string;
    value?: unknown;
};
export type FormRuleDefinition = {
    id: string;
    name: string;
    enabled: boolean;
    /** Lógica entre itens de primeiro nível; default `and` */
    conditionLogic?: "and" | "or";
    conditions: RuleConditionNode[];
    actions: RuleActionDefinition[];
};
export type RuleUserContext = {
    id: string;
    name?: string;
    email?: string;
    roles?: string[];
};
export type RuleTenantContext = {
    id: string;
    name?: string;
};
export type RuleSubmissionContext = {
    id?: string;
    status?: string;
};
export type RuleContext = {
    template: TemplateDescriptor;
    submission?: RuleSubmissionContext;
    answers: Record<string, unknown>;
    visibleFieldKeys: ReadonlySet<string>;
    hiddenFieldKeys: ReadonlySet<string>;
    currentField?: FormFieldDescriptor;
    currentSection?: string;
    currentUser?: RuleUserContext;
    tenant?: RuleTenantContext;
    metadata?: Record<string, unknown>;
};
export type ExecutedAction = {
    ruleId: string;
    ruleName: string;
    action: RuleActionDefinition;
};
export type RuleEvaluationState = {
    visibleFieldKeys: Set<string>;
    hiddenFieldKeys: Set<string>;
    requiredFieldKeys: Set<string>;
    optionalFieldKeys: Set<string>;
    disabledFieldKeys: Set<string>;
    enabledFieldKeys: Set<string>;
    visibleSections: Set<string>;
    hiddenSections: Set<string>;
    valueOverrides: Record<string, unknown>;
    clearedFieldKeys: Set<string>;
    jumpToSection?: string;
    executedActions: ExecutedAction[];
    matchedRuleIds: string[];
};
export type RuleEngineResult = {
    /** `false` quando engineVersion !== 2 — regras ignoradas */
    rulesActive: boolean;
    matchedRuleIds: string[];
    visibleFieldKeys: ReadonlySet<string>;
    hiddenFieldKeys: ReadonlySet<string>;
    requiredFieldKeys: ReadonlySet<string>;
    optionalFieldKeys: ReadonlySet<string>;
    disabledFieldKeys: ReadonlySet<string>;
    enabledFieldKeys: ReadonlySet<string>;
    visibleSections: ReadonlySet<string>;
    hiddenSections: ReadonlySet<string>;
    valueOverrides: Record<string, unknown>;
    clearedFieldKeys: ReadonlySet<string>;
    jumpToSection?: string;
    executedActions: ExecutedAction[];
};
export type SingleRuleTestResult = {
    matched: boolean;
    executedActions: ExecutedAction[];
    affectedFieldKeys: string[];
    affectedSections: string[];
    state: RuleEngineResult;
};
export type RuleOperatorHandler = {
    readonly operator: RuleOperator;
    evaluate(left: unknown, condition: RuleCondition, context: RuleContext): boolean;
};
export type RuleActionHandler = {
    readonly actionType: RuleActionType;
    execute(action: RuleActionDefinition, state: RuleEvaluationState, context: RuleContext, rule: FormRuleDefinition): void;
};
export type ConditionalFieldState = {
    visible: boolean;
    required: boolean;
    disabled: boolean;
    value?: unknown;
};
export type ConditionalSectionState = {
    visible: boolean;
};
export type ConditionalEngineResult = RuleEngineResult & {
    fieldStates: Record<string, ConditionalFieldState>;
    sectionStates: Record<string, ConditionalSectionState>;
};
//# sourceMappingURL=index.d.ts.map
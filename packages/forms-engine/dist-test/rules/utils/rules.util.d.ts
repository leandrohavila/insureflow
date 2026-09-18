import type { FormFieldDescriptor, TemplateDescriptor } from "../../validation/types/index";
import type { FormRuleDefinition, RuleConditionGroup, RuleConditionNode } from "../types/index";
export declare function resolveRulesProfile(settings?: Record<string, unknown> | null): "v1" | "v2";
export declare function isConditionGroup(node: RuleConditionNode): node is RuleConditionGroup;
export declare function parseRulesFromSettings(settings?: Record<string, unknown> | null): FormRuleDefinition[];
export declare function collectTemplateSections(template: TemplateDescriptor): string[];
export declare function collectTemplateFieldKeys(template: TemplateDescriptor): string[];
export declare function createBaselineEvaluationState(template: TemplateDescriptor): {
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
    executedActions: import("../types/index").ExecutedAction[];
    matchedRuleIds: string[];
};
export declare function isFieldRequiredByRules(field: FormFieldDescriptor, requiredFieldKeys: ReadonlySet<string>, optionalFieldKeys: ReadonlySet<string>): boolean;
export declare function isFieldVisibleByRules(fieldKey: string, visibleFieldKeys: ReadonlySet<string>, hiddenFieldKeys: ReadonlySet<string>): boolean;
export declare function isFieldDisabledByRules(fieldKey: string, disabledFieldKeys: ReadonlySet<string>, enabledFieldKeys: ReadonlySet<string>): boolean;
export declare function isSectionVisibleByRules(section: string, visibleSections: ReadonlySet<string>, hiddenSections: ReadonlySet<string>): boolean;
export declare function createRuleId(): string;
export declare function createEmptyRule(name?: string): FormRuleDefinition;
export declare function createConditionGroup(logic?: "and" | "or"): RuleConditionGroup;
//# sourceMappingURL=rules.util.d.ts.map
import type { FormFieldDescriptor, TemplateDescriptor } from "../validation/types/index";
import type { RuleContext, RuleSubmissionContext, RuleTenantContext, RuleUserContext } from "./types/index";
export type BuildRuleContextInput = {
    template: TemplateDescriptor;
    answers: Record<string, unknown>;
    submission?: RuleSubmissionContext;
    currentField?: FormFieldDescriptor;
    currentSection?: string;
    currentUser?: RuleUserContext;
    tenant?: RuleTenantContext;
    metadata?: Record<string, unknown>;
};
export declare function buildRuleContext(input: BuildRuleContextInput): RuleContext;
export declare function resolveFieldSection(field: FormFieldDescriptor): string;
export declare function resolveAnswerValue(answers: Record<string, unknown>, fieldKey: string): unknown;
//# sourceMappingURL=rule-context.d.ts.map
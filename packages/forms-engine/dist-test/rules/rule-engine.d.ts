import type { FormFieldDescriptor } from "../validation/types/index";
import type { FormRuleDefinition, RuleEngineResult, SingleRuleTestResult } from "./types/index";
import { type BuildRuleContextInput } from "./rule-context";
import { type RuleEvaluator } from "./rule-evaluator";
export type RuleEngineEvaluateInput = BuildRuleContextInput & {
    rules?: FormRuleDefinition[];
};
export declare class RuleEngine {
    private readonly evaluator;
    constructor(evaluator?: RuleEvaluator);
    evaluate(input: RuleEngineEvaluateInput): RuleEngineResult;
    evaluateField(field: FormFieldDescriptor, input: RuleEngineEvaluateInput): RuleEngineResult;
    evaluateSection(section: string, input: RuleEngineEvaluateInput): RuleEngineResult;
    evaluateTemplate(input: RuleEngineEvaluateInput): RuleEngineResult;
    evaluateSubmission(input: RuleEngineEvaluateInput): RuleEngineResult;
    testRule(rule: FormRuleDefinition, input: RuleEngineEvaluateInput): SingleRuleTestResult;
    isFieldVisible(fieldKey: string, result: RuleEngineResult): boolean;
    isFieldRequired(field: FormFieldDescriptor, result: RuleEngineResult): boolean;
    isFieldDisabled(fieldKey: string, result: RuleEngineResult): boolean;
    isSectionVisible(section: string, result: RuleEngineResult): boolean;
    applyValueOverrides(answers: Record<string, unknown>, result: RuleEngineResult): Record<string, unknown>;
    private buildInactiveResult;
    private toResult;
}
export declare const defaultRuleEngine: RuleEngine;
//# sourceMappingURL=rule-engine.d.ts.map
import type { FormFieldDescriptor, TemplateDescriptor } from "../validation/types/index";
import type { ConditionalEngineResult, ConditionalFieldState, ConditionalSectionState, FormRuleDefinition, RuleEngineResult } from "./types/index";
import { type RuleEngine, type RuleEngineEvaluateInput } from "./rule-engine";
/**
 * Consumidor de alto nível do RuleEngine — expõe estado condicional
 * para campos e seções sem duplicar lógica de avaliação.
 */
export declare class ConditionalEngine {
    private readonly ruleEngine;
    constructor(ruleEngine?: RuleEngine);
    evaluate(input: RuleEngineEvaluateInput): ConditionalEngineResult;
    evaluateWithRules(template: TemplateDescriptor, answers: Record<string, unknown>, rules: FormRuleDefinition[]): ConditionalEngineResult;
    getFieldState(field: FormFieldDescriptor, result: RuleEngineResult): ConditionalFieldState;
    getSectionState(section: string, result: RuleEngineResult): ConditionalSectionState;
    private buildFieldStates;
    private buildSectionStates;
}
export declare const defaultConditionalEngine: ConditionalEngine;
//# sourceMappingURL=conditional-engine.d.ts.map
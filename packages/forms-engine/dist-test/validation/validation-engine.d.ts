import type { FormFieldDescriptor, TemplateDescriptor, ValidationContext, ValidationResult } from "./types/index";
import { type ValidationRegistry } from "./validation-registry";
export declare class ValidationEngine {
    private readonly registry;
    constructor(registry?: ValidationRegistry);
    validateField(field: FormFieldDescriptor, value: unknown, context: ValidationContext): ValidationResult;
    validateSection(fields: FormFieldDescriptor[], answers: Record<string, unknown>, section: string, context: ValidationContext): ValidationResult;
    validateSubmission(fields: FormFieldDescriptor[], answers: Record<string, unknown>, context: ValidationContext): ValidationResult;
    validateTemplate(template: TemplateDescriptor): ValidationResult;
    buildSubmitAnswers(fields: FormFieldDescriptor[], answers: Record<string, unknown>): Record<string, unknown>;
    buildDraftAnswers(fields: FormFieldDescriptor[], answers: Record<string, unknown>, context: ValidationContext): Record<string, unknown>;
    private validateFields;
}
export declare const defaultValidationEngine: ValidationEngine;
//# sourceMappingURL=validation-engine.d.ts.map
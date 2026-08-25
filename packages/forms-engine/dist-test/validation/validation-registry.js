"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultValidationRegistry = exports.ValidationRegistry = void 0;
const index_1 = require("./validators/index");
class ValidationRegistry {
    validatorsByKind = new Map();
    validatorsById = new Map();
    genericRulesByType = new Map();
    metadataByKind = new Map();
    constructor() {
        for (const validator of index_1.nativeValidators) {
            this.registerValidator(validator);
        }
        for (const ruleValidator of index_1.genericRuleValidators) {
            this.genericRulesByType.set(ruleValidator.ruleType, ruleValidator);
        }
    }
    registerValidator(validator) {
        this.validatorsById.set(validator.id, validator);
        for (const kind of validator.kinds) {
            const existing = this.validatorsByKind.get(kind) ?? [];
            existing.push(validator);
            this.validatorsByKind.set(kind, existing);
        }
    }
    registerMetadata(metadata) {
        this.metadataByKind.set(metadata.kind, metadata);
    }
    getValidatorsForKind(kind) {
        return this.validatorsByKind.get(kind) ?? [];
    }
    getValidatorById(id) {
        return this.validatorsById.get(id);
    }
    getGenericRuleValidator(ruleType) {
        return this.genericRulesByType.get(ruleType);
    }
    getMetadata(kind) {
        return this.metadataByKind.get(kind);
    }
    listMetadata() {
        return [...this.metadataByKind.values()];
    }
    listValidators() {
        return [...this.validatorsById.values()];
    }
}
exports.ValidationRegistry = ValidationRegistry;
exports.defaultValidationRegistry = new ValidationRegistry();

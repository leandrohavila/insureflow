"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conditional_engine_1 = require("./conditional-engine");
const condition_evaluator_1 = require("./condition-evaluator");
const rule_engine_1 = require("./rule-engine");
const rule_registry_1 = require("./rule-registry");
const value_util_1 = require("./utils/value.util");
function field(key, label, required = false, section = "Geral") {
    return {
        key,
        label,
        type: "TEXT",
        required,
        order: 0,
        settings: { section },
    };
}
function template(fields, rules = []) {
    return {
        name: "Test",
        settings: { engineVersion: 2, rules },
        fields,
    };
}
describe("value utils", () => {
    it("detects empty values", () => {
        expect((0, value_util_1.isEmptyValue)("")).toBe(true);
        expect((0, value_util_1.isEmptyValue)("  ")).toBe(true);
        expect((0, value_util_1.isEmptyValue)(null)).toBe(true);
        expect((0, value_util_1.isEmptyValue)([])).toBe(true);
        expect((0, value_util_1.isEmptyValue)("x")).toBe(false);
        expect((0, value_util_1.isEmptyValue)(0)).toBe(false);
    });
    it("normalizes comparables", () => {
        expect((0, value_util_1.normalizeComparable)(" Sim ")).toBe("sim");
        expect((0, value_util_1.normalizeComparable)(true)).toBe(true);
    });
});
describe("RuleRegistry", () => {
    it("registers native operators and actions", () => {
        expect(rule_registry_1.defaultRuleRegistry.getOperator("equals")).toBeDefined();
        expect(rule_registry_1.defaultRuleRegistry.getOperator("between")).toBeDefined();
        expect(rule_registry_1.defaultRuleRegistry.getAction("showField")).toBeDefined();
        expect(rule_registry_1.defaultRuleRegistry.getAction("jumpToSection")).toBeDefined();
    });
    it("allows custom operator registration", () => {
        const registry = rule_registry_1.defaultRuleRegistry;
        registry.registerOperator({
            operator: "equals",
            evaluate(left, condition) {
                return String(left) === String(condition.value);
            },
        });
        expect(registry.getOperator("equals")).toBeDefined();
    });
});
describe("operators", () => {
    const ctx = {
        template: template([]),
        answers: {},
        visibleFieldKeys: new Set(),
        hiddenFieldKeys: new Set(),
    };
    it("evaluates comparison operators", () => {
        const evaluator = condition_evaluator_1.defaultConditionEvaluator;
        expect(evaluator.evaluateCondition({ fieldKey: "a", operator: "greaterThan", value: 5 }, { ...ctx, answers: { a: 10 } })).toBe(true);
        expect(evaluator.evaluateCondition({ fieldKey: "a", operator: "lessOrEqual", value: 10 }, { ...ctx, answers: { a: 10 } })).toBe(true);
        expect(evaluator.evaluateCondition({ fieldKey: "a", operator: "between", value: 1, valueTo: 5 }, { ...ctx, answers: { a: 3 } })).toBe(true);
    });
    it("evaluates string operators", () => {
        const evaluator = condition_evaluator_1.defaultConditionEvaluator;
        expect(evaluator.evaluateCondition({ fieldKey: "a", operator: "contains", value: "cond" }, { ...ctx, answers: { a: "segundo condutor" } })).toBe(true);
        expect(evaluator.evaluateCondition({ fieldKey: "a", operator: "startsWith", value: "blind" }, { ...ctx, answers: { a: "blindado" } })).toBe(true);
    });
    it("evaluates in/notIn/isEmpty/isFilled", () => {
        const evaluator = condition_evaluator_1.defaultConditionEvaluator;
        expect(evaluator.evaluateCondition({ fieldKey: "a", operator: "in", value: ["pf", "pj"] }, { ...ctx, answers: { a: "pj" } })).toBe(true);
        expect(evaluator.evaluateCondition({ fieldKey: "a", operator: "isEmpty" }, { ...ctx, answers: { a: "" } })).toBe(true);
        expect(evaluator.evaluateCondition({ fieldKey: "a", operator: "isFilled" }, { ...ctx, answers: { a: "sim" } })).toBe(true);
    });
});
describe("RuleEngine scenarios", () => {
    const fields = [
        field("person_type", "Tipo pessoa"),
        field("cpf", "CPF", true, "Documentos"),
        field("cnpj", "CNPJ", false, "Documentos"),
        field("has_second_driver", "Segundo condutor?"),
        field("second_driver_name", "Nome 2º condutor", false, "Condutores"),
        field("is_armored", "Blindado?"),
        field("armored_details", "Detalhes blindagem", false, "Veículo"),
    ];
    it("ignores rules on engineVersion 1", () => {
        const result = rule_engine_1.defaultRuleEngine.evaluate({
            template: {
                name: "Legacy",
                settings: { engineVersion: 1 },
                fields,
            },
            answers: { person_type: "pj" },
            rules: [
                {
                    id: "r1",
                    name: "hide cpf",
                    enabled: true,
                    conditions: [{ fieldKey: "person_type", operator: "equals", value: "pj" }],
                    actions: [{ type: "hideField", targetFieldKey: "cpf" }],
                },
            ],
        });
        expect(result.rulesActive).toBe(false);
        expect(result.hiddenFieldKeys.has("cpf")).toBe(false);
    });
    it("PF/PJ — show/hide document fields", () => {
        const rules = [
            {
                id: "pj",
                name: "PJ",
                enabled: true,
                conditions: [{ fieldKey: "person_type", operator: "equals", value: "pj" }],
                actions: [
                    { type: "hideField", targetFieldKey: "cpf" },
                    { type: "showField", targetFieldKey: "cnpj" },
                    { type: "requireField", targetFieldKey: "cnpj" },
                ],
            },
            {
                id: "pf",
                name: "PF",
                enabled: true,
                conditions: [{ fieldKey: "person_type", operator: "equals", value: "pf" }],
                actions: [
                    { type: "hideField", targetFieldKey: "cnpj" },
                    { type: "showField", targetFieldKey: "cpf" },
                ],
            },
        ];
        const pj = rule_engine_1.defaultRuleEngine.evaluate({
            template: template(fields, rules),
            answers: { person_type: "pj" },
        });
        expect(pj.rulesActive).toBe(true);
        expect(pj.hiddenFieldKeys.has("cpf")).toBe(true);
        expect(pj.requiredFieldKeys.has("cnpj")).toBe(true);
        const pf = rule_engine_1.defaultRuleEngine.evaluate({
            template: template(fields, rules),
            answers: { person_type: "pf" },
        });
        expect(pf.hiddenFieldKeys.has("cnpj")).toBe(true);
        expect(pf.visibleFieldKeys.has("cpf")).toBe(true);
    });
    it("segundo condutor — conditional show", () => {
        const rules = [
            {
                id: "second",
                name: "Segundo condutor",
                enabled: true,
                conditions: [
                    { fieldKey: "has_second_driver", operator: "equals", value: "yes" },
                ],
                actions: [
                    { type: "showField", targetFieldKey: "second_driver_name" },
                    { type: "requireField", targetFieldKey: "second_driver_name" },
                ],
            },
        ];
        const hidden = rule_engine_1.defaultRuleEngine.evaluate({
            template: template(fields, rules),
            answers: { has_second_driver: "no" },
        });
        expect(hidden.requiredFieldKeys.has("second_driver_name")).toBe(false);
        const visible = rule_engine_1.defaultRuleEngine.evaluate({
            template: template(fields, rules),
            answers: { has_second_driver: "yes" },
        });
        expect(visible.requiredFieldKeys.has("second_driver_name")).toBe(true);
    });
    it("blindado — show details section field", () => {
        const rules = [
            {
                id: "armored",
                name: "Blindado",
                enabled: true,
                conditions: [{ fieldKey: "is_armored", operator: "equals", value: true }],
                actions: [{ type: "showField", targetFieldKey: "armored_details" }],
            },
        ];
        const result = rule_engine_1.defaultRuleEngine.evaluate({
            template: template(fields, rules),
            answers: { is_armored: true },
        });
        expect(result.visibleFieldKeys.has("armored_details")).toBe(true);
    });
    it("supports AND/OR condition groups", () => {
        const rules = [
            {
                id: "group",
                name: "Group",
                enabled: true,
                conditionLogic: "and",
                conditions: [
                    {
                        logic: "or",
                        conditions: [
                            { fieldKey: "person_type", operator: "equals", value: "pf" },
                            { fieldKey: "person_type", operator: "equals", value: "pj" },
                        ],
                    },
                    { fieldKey: "has_second_driver", operator: "equals", value: "yes" },
                ],
                actions: [{ type: "showField", targetFieldKey: "second_driver_name" }],
            },
        ];
        const matched = rule_engine_1.defaultRuleEngine.testRule(rules[0], {
            template: template(fields, rules),
            answers: { person_type: "pf", has_second_driver: "yes" },
        });
        expect(matched.matched).toBe(true);
        const notMatched = rule_engine_1.defaultRuleEngine.testRule(rules[0], {
            template: template(fields, rules),
            answers: { person_type: "pf", has_second_driver: "no" },
        });
        expect(notMatched.matched).toBe(false);
    });
    it("executes hide section and disable field actions", () => {
        const rules = [
            {
                id: "hide-section",
                name: "Hide docs",
                enabled: true,
                conditions: [{ fieldKey: "person_type", operator: "isFilled" }],
                actions: [
                    { type: "hideSection", targetSection: "Documentos" },
                    { type: "disableField", targetFieldKey: "cpf" },
                ],
            },
        ];
        const result = rule_engine_1.defaultRuleEngine.evaluate({
            template: template(fields, rules),
            answers: { person_type: "pf" },
        });
        expect(result.hiddenSections.has("Documentos")).toBe(true);
        expect(result.disabledFieldKeys.has("cpf")).toBe(true);
    });
});
describe("ConditionalEngine", () => {
    it("exposes field and section states", () => {
        const fields = [
            field("flag", "Flag"),
            field("target", "Target"),
        ];
        const rules = [
            {
                id: "r1",
                name: "Show target",
                enabled: true,
                conditions: [{ fieldKey: "flag", operator: "equals", value: "1" }],
                actions: [{ type: "showField", targetFieldKey: "target" }],
            },
        ];
        const result = conditional_engine_1.defaultConditionalEngine.evaluate({
            template: template(fields, rules),
            answers: { flag: "0" },
        });
        expect(result.fieldStates.target?.visible).toBe(true);
        expect(result.sectionStates.Geral?.visible).toBe(true);
    });
});
describe("RuleEngine.testRule", () => {
    it("returns TRUE/FALSE with affected entities", () => {
        const fields = [field("a", "A"), field("b", "B")];
        const rule = {
            id: "t",
            name: "Test",
            enabled: true,
            conditions: [{ fieldKey: "a", operator: "equals", value: "x" }],
            actions: [{ type: "hideField", targetFieldKey: "b" }],
        };
        const test = rule_engine_1.defaultRuleEngine.testRule(rule, {
            template: template(fields, [rule]),
            answers: { a: "x" },
        });
        expect(test.matched).toBe(true);
        expect(test.affectedFieldKeys).toContain("b");
        expect(test.executedActions.length).toBe(1);
    });
});

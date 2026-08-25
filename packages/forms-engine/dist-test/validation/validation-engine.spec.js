"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
function field(partial) {
    return {
        required: false,
        order: 0,
        settings: {},
        ...partial,
    };
}
describe("validators.util", () => {
    it("validates CPF", () => {
        expect((0, index_1.isValidCpf)("390.533.447-05")).toBe(true);
        expect((0, index_1.isValidCpf)("111.111.111-11")).toBe(false);
    });
    it("validates CNPJ", () => {
        expect((0, index_1.isValidCnpj)("11.222.333/0001-60")).toBe(true);
        expect((0, index_1.isValidCnpj)("11.111.111/1111-11")).toBe(false);
    });
    it("validates CEP", () => {
        expect((0, index_1.isValidCep)("01310-100")).toBe(true);
        expect((0, index_1.isValidCep)("1234")).toBe(false);
    });
    it("validates email", () => {
        expect((0, index_1.isValidEmail)("user@example.com")).toBe(true);
        expect((0, index_1.isValidEmail)("invalid")).toBe(false);
    });
    it("validates phone", () => {
        expect((0, index_1.isValidPhone)("(11) 98765-4321")).toBe(true);
        expect((0, index_1.isValidPhone)("123")).toBe(false);
    });
    it("validates plate", () => {
        expect((0, index_1.isValidPlate)("ABC1D23")).toBe(true);
        expect((0, index_1.isValidPlate)("ABC1234")).toBe(true);
        expect((0, index_1.isValidPlate)("AB123")).toBe(false);
    });
    it("validates renavam", () => {
        expect((0, index_1.isValidRenavam)("12345678901")).toBe(true);
        expect((0, index_1.isValidRenavam)("11111111111")).toBe(false);
    });
});
describe("ValidationEngine", () => {
    const engine = new index_1.ValidationEngine(index_1.defaultValidationRegistry);
    it("requires field on finalize", () => {
        const fields = [field({ key: "name", label: "Nome", type: "TEXT", required: true })];
        const context = (0, index_1.createClientValidationContext)({}, { mode: "finalize", profile: "v1" });
        const result = engine.validateSubmission(fields, {}, context);
        expect(result.valid).toBe(false);
        expect(result.errors[0]?.code).toBe("required");
    });
    it("skips required on draft", () => {
        const fields = [field({ key: "name", label: "Nome", type: "TEXT", required: true })];
        const context = (0, index_1.createClientValidationContext)({}, { mode: "draft", profile: "v1" });
        const result = engine.validateSubmission(fields, {}, context);
        expect(result.valid).toBe(true);
    });
    it("validates CPF on client v1", () => {
        const fields = [
            field({
                key: "cpf",
                label: "CPF",
                type: "TEXT",
                settings: { inputKind: "cpf" },
            }),
        ];
        const context = (0, index_1.createClientValidationContext)({ cpf: "111.111.111-11" }, { mode: "finalize", profile: "v1" });
        const result = engine.validateSubmission(fields, { cpf: "111.111.111-11" }, context);
        expect(result.valid).toBe(false);
        expect(result.errors[0]?.code).toBe("invalid_cpf");
    });
    it("skips CPF checksum on server v1", () => {
        const fields = [
            field({
                key: "cpf",
                label: "CPF",
                type: "TEXT",
                settings: { inputKind: "cpf" },
            }),
        ];
        const context = (0, index_1.createServerValidationContext)({ cpf: "111.111.111-11" }, { mode: "finalize", profile: "v1" });
        const result = engine.validateSubmission(fields, { cpf: "111.111.111-11" }, context);
        expect(result.valid).toBe(true);
    });
    it("validates regex rule on v2 profile", () => {
        const fields = [
            field({
                key: "code",
                label: "Código",
                type: "TEXT",
                validation: {
                    version: 1,
                    rules: [{ type: "pattern", value: "^[A-Z]{3}$", message: "Use 3 letras" }],
                },
            }),
        ];
        const context = (0, index_1.createClientValidationContext)({ code: "abc" }, { mode: "finalize", profile: "v2" });
        const result = engine.validateSubmission(fields, { code: "abc" }, context);
        expect(result.valid).toBe(false);
        expect(result.errors[0]?.message).toBe("Use 3 letras");
    });
    it("validates min and max length on v2", () => {
        const fields = [
            field({
                key: "name",
                label: "Nome",
                type: "TEXT",
                validation: {
                    version: 1,
                    rules: [
                        { type: "minLength", value: 3 },
                        { type: "maxLength", value: 5 },
                    ],
                },
            }),
        ];
        const context = (0, index_1.createClientValidationContext)({ name: "ab" }, { mode: "finalize", profile: "v2" });
        const result = engine.validateSubmission(fields, { name: "ab" }, context);
        expect(result.valid).toBe(false);
        const ok = engine.validateSubmission(fields, { name: "Ana" }, (0, index_1.createClientValidationContext)({ name: "Ana" }, { mode: "finalize", profile: "v2" }));
        expect(ok.valid).toBe(true);
    });
    it("validateTemplate detects duplicate keys", () => {
        const result = engine.validateTemplate({
            name: "Teste",
            fields: [
                field({ key: "a", label: "A", type: "TEXT" }),
                field({ key: "a", label: "A2", type: "TEXT" }),
            ],
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some((error) => error.code === "duplicate_key")).toBe(true);
    });
    it("validateSection filters by section", () => {
        const fields = [
            field({
                key: "a",
                label: "A",
                type: "TEXT",
                required: true,
                settings: { section: "S1" },
            }),
            field({
                key: "b",
                label: "B",
                type: "TEXT",
                settings: { section: "S2" },
            }),
        ];
        const context = (0, index_1.createClientValidationContext)({}, { mode: "finalize", profile: "v1" });
        const result = engine.validateSection(fields, {}, "S1", context);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.fieldKey).toBe("a");
    });
    it("registry lists native validators", () => {
        expect(index_1.defaultValidationRegistry.listValidators().length).toBeGreaterThan(10);
    });
    it("toFormFieldDescriptor parses validation schema", () => {
        const descriptor = (0, index_1.toFormFieldDescriptor)({
            key: "x",
            label: "X",
            type: "TEXT",
            required: false,
            order: 0,
            validation: { version: 1, rules: [{ type: "minLength", value: 2 }] },
        });
        expect(descriptor.validation?.version).toBe(1);
    });
});

import type { FormFieldDescriptor } from "../types/index";
type MaskKind = "cpf" | "cnpj" | "cep" | "phone" | "plate";
export declare function onlyDigits(value: string, maxLength: number): string;
export declare function formatDateBrMask(value: string): string;
export declare function applyInputMask(value: string, mask?: MaskKind): string;
export declare function getFieldMask(field: FormFieldDescriptor): MaskKind | undefined;
export { isValidCpf, isValidCnpj, isValidCep, isValidPhone, isValidPlate, isValidRenavam, isValidEmail, isValidDateBr, parseDateBrToIso, } from "./validators.util";
//# sourceMappingURL=masks.util.d.ts.map
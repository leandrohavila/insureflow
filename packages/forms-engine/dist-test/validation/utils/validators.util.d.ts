export declare function onlyDigits(value: string, maxLength?: number): string;
export declare function isRepeatedDigits(digits: string): boolean;
export declare function isValidCpf(value: string): boolean;
export declare function isValidCnpj(value: string): boolean;
export declare function isValidCep(value: string): boolean;
export declare function isValidPhone(value: string): boolean;
export declare function isValidEmail(value: string): boolean;
export declare function isValidUrl(value: string): boolean;
/** Placa Mercosul (ABC1D23) ou legado (ABC1234) */
export declare function isValidPlate(value: string): boolean;
/** RENAVAM — 11 dígitos numéricos */
export declare function isValidRenavam(value: string): boolean;
/** Chassi / VIN — 17 caracteres alfanuméricos (sem I, O, Q) */
export declare function isValidChassi(value: string): boolean;
export declare function parseDateBrToIso(value: string): string | null;
export declare function isValidDateBr(value: string): boolean;
export declare function isValidIsoDate(value: string): boolean;
export declare function isValidTime(value: string): boolean;
export declare function isValidDateTime(value: string): boolean;
export declare function isValidNumber(value: unknown): value is number;
export declare function parseFiniteNumber(value: unknown): number | null;
export declare function normalizeOptionValues(options: unknown): Array<{
    label: string;
    value: string;
}>;
export declare function slugifyOptionValue(label: string): string;
//# sourceMappingURL=validators.util.d.ts.map
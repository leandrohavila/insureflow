"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlyDigits = onlyDigits;
exports.isRepeatedDigits = isRepeatedDigits;
exports.isValidCpf = isValidCpf;
exports.isValidCnpj = isValidCnpj;
exports.isValidCep = isValidCep;
exports.isValidPhone = isValidPhone;
exports.isValidEmail = isValidEmail;
exports.isValidUrl = isValidUrl;
exports.isValidPlate = isValidPlate;
exports.isValidRenavam = isValidRenavam;
exports.isValidChassi = isValidChassi;
exports.parseDateBrToIso = parseDateBrToIso;
exports.isValidDateBr = isValidDateBr;
exports.isValidIsoDate = isValidIsoDate;
exports.isValidTime = isValidTime;
exports.isValidDateTime = isValidDateTime;
exports.isValidNumber = isValidNumber;
exports.parseFiniteNumber = parseFiniteNumber;
exports.normalizeOptionValues = normalizeOptionValues;
exports.slugifyOptionValue = slugifyOptionValue;
function onlyDigits(value, maxLength) {
    const digits = value.replace(/\D/g, "");
    return maxLength !== undefined ? digits.slice(0, maxLength) : digits;
}
function isRepeatedDigits(digits) {
    return /^(\d)\1+$/.test(digits);
}
function cpfCheckDigit(digits, factor) {
    let sum = 0;
    for (let index = 0; index < digits.length; index += 1) {
        sum += Number(digits[index]) * (factor - index);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
}
function isValidCpf(value) {
    const cpf = onlyDigits(value, 11);
    if (cpf.length !== 11 || isRepeatedDigits(cpf))
        return false;
    const base = cpf.slice(0, 9);
    const d1 = cpfCheckDigit(base, 10);
    const d2 = cpfCheckDigit(`${base}${d1}`, 11);
    return cpf === `${base}${d1}${d2}`;
}
function cnpjWeight(index) {
    const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    return weights[index] ?? weights[index - weights.length] ?? 2;
}
function cnpjCheckDigit(digits) {
    let sum = 0;
    const offset = 14 - digits.length - 1;
    for (let index = 0; index < digits.length; index += 1) {
        sum += Number(digits[index]) * cnpjWeight(index + offset);
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
}
function isValidCnpj(value) {
    const cnpj = onlyDigits(value, 14);
    if (cnpj.length !== 14 || isRepeatedDigits(cnpj))
        return false;
    const base = cnpj.slice(0, 12);
    const d1 = cnpjCheckDigit(base);
    const d2 = cnpjCheckDigit(`${base}${d1}`);
    return cnpj === `${base}${d1}${d2}`;
}
function isValidCep(value) {
    return onlyDigits(value, 8).length === 8;
}
function isValidPhone(value) {
    const digits = onlyDigits(value, 11);
    return digits.length >= 10 && digits.length <= 11;
}
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function isValidUrl(value) {
    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    }
    catch {
        return false;
    }
}
/** Placa Mercosul (ABC1D23) ou legado (ABC1234) */
function isValidPlate(value) {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length !== 7)
        return false;
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalized);
}
/** RENAVAM — 11 dígitos numéricos */
function isValidRenavam(value) {
    const digits = onlyDigits(value, 11);
    if (digits.length !== 11 || isRepeatedDigits(digits))
        return false;
    return true;
}
/** Chassi / VIN — 17 caracteres alfanuméricos (sem I, O, Q) */
function isValidChassi(value) {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length !== 17)
        return false;
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalized);
}
function parseDateBrToIso(value) {
    const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match)
        return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 9999) {
        return null;
    }
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day) {
        return null;
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function isValidDateBr(value) {
    return parseDateBrToIso(value) !== null;
}
function isValidIsoDate(value) {
    return !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}
function isValidTime(value) {
    return /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.test(value.trim());
}
function isValidDateTime(value) {
    const trimmed = value.trim();
    if (isValidIsoDate(trimmed))
        return true;
    const brDateTime = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+([01]\d|2[0-3]):([0-5]\d)$/);
    if (!brDateTime)
        return false;
    return isValidDateBr(`${brDateTime[1]}/${brDateTime[2]}/${brDateTime[3]}`);
}
function isValidNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function parseFiniteNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
function normalizeOptionValues(options) {
    if (!options)
        return [];
    if (Array.isArray(options)) {
        return options.flatMap((item) => {
            if (typeof item === "string") {
                const label = item.trim();
                if (!label)
                    return [];
                return [{ label, value: slugifyOptionValue(label) }];
            }
            if (item && typeof item === "object") {
                const record = item;
                const label = String(record.label ?? "").trim();
                if (!label)
                    return [];
                const value = String(record.value ?? slugifyOptionValue(label)).trim();
                return [{ label, value: value || slugifyOptionValue(label) }];
            }
            return [];
        });
    }
    return [];
}
function slugifyOptionValue(label) {
    return label
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

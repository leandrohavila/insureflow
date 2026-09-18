export const LEAD_DOCUMENT_TYPES = ['cpf', 'cnpj'] as const;
export type LeadDocumentType = (typeof LEAD_DOCUMENT_TYPES)[number];

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

export function stripDocumentDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function isRepeatedDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function cpfCheckDigit(digits: string, factor: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * (factor - i);
  }
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

export function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== CPF_LENGTH || isRepeatedDigits(digits)) return false;
  const base = digits.slice(0, 9);
  const d1 = cpfCheckDigit(base, 10);
  const d2 = cpfCheckDigit(`${base}${d1}`, 11);
  return digits === `${base}${d1}${d2}`;
}

function cnpjWeight(index: number): number {
  const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return weights[index] ?? weights[index - weights.length] ?? 2;
}

function cnpjCheckDigit(digits: string): number {
  let sum = 0;
  const offset = CNPJ_LENGTH - digits.length - 1;
  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * cnpjWeight(i + offset);
  }
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function isValidCnpjDigits(digits: string): boolean {
  if (digits.length !== CNPJ_LENGTH || isRepeatedDigits(digits)) return false;
  const base = digits.slice(0, 12);
  const d1 = cnpjCheckDigit(base);
  const d2 = cnpjCheckDigit(`${base}${d1}`);
  return digits === `${base}${d1}${d2}`;
}

export function normalizeCpf(value: string): string | null {
  const digits = stripDocumentDigits(value);
  if (digits.length !== CPF_LENGTH) return null;
  return isValidCpfDigits(digits) ? digits : null;
}

export function normalizeCnpj(value: string): string | null {
  const digits = stripDocumentDigits(value);
  if (digits.length !== CNPJ_LENGTH) return null;
  return isValidCnpjDigits(digits) ? digits : null;
}

export function normalizeDocument(
  documentType: LeadDocumentType | undefined,
  document: string | undefined,
): { documentType: LeadDocumentType; document: string } | null {
  if (!documentType || !document?.trim()) return null;

  const normalized =
    documentType === 'cpf' ? normalizeCpf(document) : normalizeCnpj(document);

  if (!normalized) return null;

  return { documentType, document: normalized };
}

export function isCompleteDocumentForLookup(digits: string): boolean {
  return digits.length === CPF_LENGTH || digits.length === CNPJ_LENGTH;
}

export function inferDocumentTypeFromDigits(
  digits: string,
): LeadDocumentType | null {
  if (digits.length === CPF_LENGTH) return 'cpf';
  if (digits.length === CNPJ_LENGTH) return 'cnpj';
  return null;
}

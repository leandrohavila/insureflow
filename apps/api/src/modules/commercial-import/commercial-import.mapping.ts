import { INTEREST_CATEGORIES } from '../../common/constants/interest-categories';
import {
  inferDocumentTypeFromDigits,
  normalizeDocument,
  stripDocumentDigits,
} from '../../common/utils/document.util';

export type ImportRowError = {
  row: number;
  field?: string;
  message: string;
};

export type ParsedLeadImportRow = {
  row: number;
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  document?: string;
  documentType?: 'cpf' | 'cnpj';
  company?: string;
  city?: string;
  uf?: string;
  source?: string;
  interestCategories: string[];
  currentInsurer?: string;
  coverageDueAt?: string;
  premiumAtual?: number;
  notes?: string;
  ownerLabel?: string;
  businessUnitLabel?: string;
};

export type ParsedCustomerImportRow = {
  row: number;
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  company?: string;
  city?: string;
  uf?: string;
  product?: string;
  insurer?: string;
  policyNumber?: string;
  startDate?: string;
  endDate?: string;
  premium?: number;
  ownerLabel?: string;
  businessUnitLabel?: string;
  notes?: string;
};

const PRODUCT_ALIASES: Record<string, string> = {
  auto: 'AUTO_INSURANCE',
  'seguro auto': 'AUTO_INSURANCE',
  automovel: 'AUTO_INSURANCE',
  automóvel: 'AUTO_INSURANCE',
  residencial: 'HOME_INSURANCE',
  'seguro residencial': 'HOME_INSURANCE',
  vida: 'LIFE_INSURANCE',
  'seguro de vida': 'LIFE_INSURANCE',
  saude: 'HEALTH_INSURANCE',
  saúde: 'HEALTH_INSURANCE',
  'seguro saúde': 'HEALTH_INSURANCE',
};

function cell(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = (row[key] ?? '').trim();
    if (value) return value;
  }
  return '';
}

function parsePremium(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const normalized = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  if (Number.isNaN(n) || n < 0) return Number.NaN;
  return n;
}

function parseDate(value: string): string | undefined {
  if (!value) return undefined;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}T12:00:00.000Z`;
  const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const day = br[1].padStart(2, '0');
    const month = br[2].padStart(2, '0');
    return `${br[3]}-${month}-${day}T12:00:00.000Z`;
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

export function mapInterestProduct(raw: string): string[] {
  if (!raw.trim()) return [];
  const parts = raw.split(/[;,|/]/).map((part) => part.trim()).filter(Boolean);
  const mapped: string[] = [];
  for (const part of parts) {
    const key = part
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const alias = PRODUCT_ALIASES[key] ?? PRODUCT_ALIASES[part.toLowerCase()];
    if (alias) {
      mapped.push(alias);
      continue;
    }
    const exact = (INTEREST_CATEGORIES as readonly string[]).find(
      (item) => item === part || item === part.toUpperCase(),
    );
    if (exact) mapped.push(exact);
  }
  return [...new Set(mapped)];
}

export function parseDocument(raw: string) {
  const digits = stripDocumentDigits(raw);
  const documentType = inferDocumentTypeFromDigits(digits);
  if (!documentType) return null;
  return normalizeDocument(documentType, digits);
}

export function composeImportNotes(
  base: string | undefined,
  extras: Array<[string, string | undefined]>,
) {
  const bits = extras
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => `${label}: ${value!.trim()}`);
  const extra = bits.join(' | ');
  return [base?.trim(), extra].filter(Boolean).join('\n');
}

export function parseLeadRow(
  rowNumber: number,
  raw: Record<string, string>,
): { ok: true; data: ParsedLeadImportRow } | { ok: false; errors: ImportRowError[] } {
  const errors: ImportRowError[] = [];
  const name = cell(raw, 'Nome');
  if (!name) errors.push({ row: rowNumber, field: 'Nome', message: 'Nome é obrigatório' });

  const documentRaw = cell(raw, 'CPF/CNPJ');
  let document: ParsedLeadImportRow['document'];
  let documentType: ParsedLeadImportRow['documentType'];
  if (documentRaw) {
    const parsed = parseDocument(documentRaw);
    if (!parsed) {
      errors.push({
        row: rowNumber,
        field: 'CPF/CNPJ',
        message: 'CPF/CNPJ inválido',
      });
    } else {
      document = parsed.document;
      documentType = parsed.documentType;
    }
  }

  const due = cell(raw, 'Data Renovação', 'Data Vencimento');
  const coverageDueAt = due ? parseDate(due) : undefined;
  if (due && !coverageDueAt) {
    errors.push({
      row: rowNumber,
      field: 'Data Renovação',
      message: 'Data de renovação inválida',
    });
  }

  const premiumRaw = cell(raw, 'Prêmio Atual');
  const premiumAtual = parsePremium(premiumRaw);
  if (premiumRaw && Number.isNaN(premiumAtual)) {
    errors.push({
      row: rowNumber,
      field: 'Prêmio Atual',
      message: 'Prêmio inválido',
    });
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      row: rowNumber,
      name,
      phone: cell(raw, 'Telefone') || undefined,
      whatsapp: cell(raw, 'WhatsApp') || undefined,
      email: cell(raw, 'Email') || undefined,
      document,
      documentType,
      company: cell(raw, 'Empresa') || undefined,
      city: cell(raw, 'Cidade') || undefined,
      uf: cell(raw, 'UF') || undefined,
      source: cell(raw, 'Origem') || 'importacao',
      interestCategories: mapInterestProduct(cell(raw, 'Produto Interesse')),
      currentInsurer: cell(raw, 'Seguradora Atual') || undefined,
      coverageDueAt,
      premiumAtual: Number.isFinite(premiumAtual) ? premiumAtual : undefined,
      notes: cell(raw, 'Observações', 'Observação') || undefined,
      ownerLabel: cell(raw, 'Responsável') || undefined,
      businessUnitLabel: cell(raw, 'Business Unit') || undefined,
    },
  };
}

export function parseCustomerRow(
  rowNumber: number,
  raw: Record<string, string>,
):
  | { ok: true; data: ParsedCustomerImportRow }
  | { ok: false; errors: ImportRowError[] } {
  const errors: ImportRowError[] = [];
  const name = cell(raw, 'Nome');
  if (!name) errors.push({ row: rowNumber, field: 'Nome', message: 'Nome é obrigatório' });

  const documentRaw = cell(raw, 'CPF/CNPJ');
  const parsedDoc = parseDocument(documentRaw);
  if (!parsedDoc) {
    errors.push({
      row: rowNumber,
      field: 'CPF/CNPJ',
      message: 'CPF/CNPJ é obrigatório e deve ser válido',
    });
  }

  const startRaw = cell(raw, 'Vigência Inicial', 'Data Início');
  const endRaw = cell(raw, 'Vigência Final', 'Data Vencimento');
  const startDate = startRaw ? parseDate(startRaw) : undefined;
  const endDate = endRaw ? parseDate(endRaw) : undefined;
  if (startRaw && !startDate) {
    errors.push({
      row: rowNumber,
      field: 'Vigência Inicial',
      message: 'Vigência inicial inválida',
    });
  }
  if (endRaw && !endDate) {
    errors.push({
      row: rowNumber,
      field: 'Vigência Final',
      message: 'Vigência final inválida',
    });
  }

  const premiumRaw = cell(raw, 'Prêmio', 'Prêmio Anual');
  const premium = parsePremium(premiumRaw);
  if (premiumRaw && Number.isNaN(premium)) {
    errors.push({ row: rowNumber, field: 'Prêmio', message: 'Prêmio inválido' });
  }

  if (errors.length || !parsedDoc) return { ok: false, errors };

  return {
    ok: true,
    data: {
      row: rowNumber,
      name,
      phone: cell(raw, 'Telefone') || undefined,
      whatsapp: cell(raw, 'WhatsApp') || undefined,
      email: cell(raw, 'Email') || undefined,
      document: parsedDoc.document,
      documentType: parsedDoc.documentType,
      company: cell(raw, 'Empresa') || undefined,
      city: cell(raw, 'Cidade') || undefined,
      uf: cell(raw, 'UF') || undefined,
      product: cell(raw, 'Produto', 'Produto Contratado') || undefined,
      insurer: cell(raw, 'Seguradora', 'Seguradora Atual') || undefined,
      policyNumber: cell(raw, 'Número Apólice') || undefined,
      startDate,
      endDate,
      premium: Number.isFinite(premium) ? premium : undefined,
      ownerLabel: cell(raw, 'Responsável', 'Corretor Responsável') || undefined,
      businessUnitLabel: cell(raw, 'Business Unit') || undefined,
      notes: cell(raw, 'Observações', 'Observação') || undefined,
    },
  };
}

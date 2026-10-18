import { stripDocumentDigits } from '../../common/utils/document.util';

export type CustomerMatchCandidate = {
  id: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
};

function isCompleteDocument(digits: string) {
  return digits.length === 11 || digits.length === 14;
}

/**
 * Documento completo identifica a pessoa.
 * Sem documento, e-mail só une quando há um único cadastro.
 * Telefone só une quando o número inteiro coincide com um único cadastro.
 * Os últimos dígitos, sozinhos, não identificam ninguém.
 */
export function selectExistingCustomer(input: {
  documentDigits: string;
  email: string | null;
  phoneDigits: string;
  byDocument: CustomerMatchCandidate | null;
  byEmail: CustomerMatchCandidate[];
  byPhone: CustomerMatchCandidate[];
}): CustomerMatchCandidate | null {
  if (isCompleteDocument(input.documentDigits)) {
    return input.byDocument;
  }

  const email = input.email?.trim().toLowerCase() || null;
  if (email) {
    if (input.byEmail.length === 1) return input.byEmail[0] ?? null;
    if (input.byEmail.length > 1) return null;
  }

  if (input.phoneDigits.length >= 10) {
    const exact = input.byPhone.filter(
      (candidate) =>
        stripDocumentDigits(candidate.phone ?? '') === input.phoneDigits,
    );
    if (exact.length === 1) return exact[0] ?? null;
  }

  return null;
}

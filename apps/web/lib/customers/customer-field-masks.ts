import {
  formatCnpjMask,
  formatCpfMask,
  formatPhoneBrMask,
  stripDocumentDigits,
} from "@/lib/documents/document"
import type { CustomerType } from "@/lib/data-access/modules/customers"

const CPF_LENGTH = 11
const CNPJ_LENGTH = 14

export function stripNonDigits(value: string): string {
  return stripDocumentDigits(value)
}

export function formatCpf(value: string): string {
  return formatCpfMask(value)
}

export function formatCnpj(value: string): string {
  return formatCnpjMask(value)
}

export function formatPhone(value: string): string {
  return formatPhoneBrMask(value)
}

export function formatCustomerDocument(type: CustomerType, value: string): string {
  const digits = stripNonDigits(value)
  return type === "PF" ? formatCpf(digits) : formatCnpj(digits)
}

export function customerDocumentPlaceholder(type: CustomerType): string {
  return type === "PF" ? "000.000.000-00" : "00.000.000/0000-00"
}

export function getCustomerDocumentError(
  type: CustomerType,
  maskedValue: string,
): string | null {
  const digits = stripNonDigits(maskedValue)
  if (!digits) return null
  const expected = type === "PF" ? CPF_LENGTH : CNPJ_LENGTH
  const label = type === "PF" ? "CPF" : "CNPJ"
  if (digits.length < expected) {
    return `${label} incompleto`
  }
  return null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getCustomerEmailError(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return null
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Informe um e-mail válido"
  }
  return null
}

export function formatStoredCustomerDocument(
  type: CustomerType,
  document: string | null | undefined,
): string {
  if (!document?.trim()) return ""
  return formatCustomerDocument(type, document)
}

export function formatStoredCustomerPhone(
  phone: string | null | undefined,
): string {
  if (!phone?.trim()) return ""
  return formatPhone(phone)
}

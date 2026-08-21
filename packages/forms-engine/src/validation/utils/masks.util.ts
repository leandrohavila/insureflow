import type { FormFieldDescriptor } from "../types/index"
import { toFormFieldDescriptor } from "./field.util"

type MaskKind = "cpf" | "cnpj" | "cep" | "phone" | "plate"

export function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}

export function formatDateBrMask(value: string) {
  const digits = onlyDigits(value, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function applyInputMask(value: string, mask?: MaskKind) {
  if (mask === "cpf") {
    return onlyDigits(value, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  if (mask === "cnpj") {
    return onlyDigits(value, 14)
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
  }

  if (mask === "cep") {
    return onlyDigits(value, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2")
  }

  if (mask === "phone") {
    const digits = onlyDigits(value, 11)
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d{1,4})$/, "$1-$2")
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
  }

  if (mask === "plate") {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 7)
  }

  return value
}

export function getFieldMask(field: FormFieldDescriptor): MaskKind | undefined {
  const settings = (field.settings ?? {}) as Record<string, unknown>
  const mask = settings.mask as MaskKind | undefined
  if (mask) return mask

  const inputKind = settings.inputKind as string | undefined
  if (inputKind === "cpf") return "cpf"
  if (inputKind === "cnpj") return "cnpj"
  if (inputKind === "cep") return "cep"
  if (inputKind === "plate") return "plate"
  if (field.type === "PHONE" || inputKind === "phone") return "phone"
  return undefined
}

export {
  isValidCpf,
  isValidCnpj,
  isValidCep,
  isValidPhone,
  isValidPlate,
  isValidRenavam,
  isValidEmail,
  isValidDateBr,
  parseDateBrToIso,
} from "./validators.util"

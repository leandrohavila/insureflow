/**
 * Camada de apresentação do valor do negócio.
 * A API continua recebendo um número. A máscara só organiza a digitação em pt-BR.
 */

export function formatDealValueFromNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) return ""
  const [intPart, decPart] = value.toFixed(2).split(".")
  return maskDealValue(`${intPart},${decPart}`)
}

export function maskDealValue(raw: string): string {
  let text = raw.replace(/R\$/gi, "").trim()
  if (text.includes(".") && !text.includes(",")) {
    const parts = text.split(".")
    const last = parts[parts.length - 1] ?? ""
    if (parts.length === 2 && last.length > 0 && last.length <= 2) {
      text = `${parts[0]},${last}`
    }
  }

  text = text.replace(/\./g, "")
  const cleaned = text.replace(/[^\d,]/g, "")
  const commaAt = cleaned.indexOf(",")
  const intDigits = (commaAt === -1 ? cleaned : cleaned.slice(0, commaAt)).replace(
    /^0+(?=\d)/,
    "",
  )
  const decimalDigits =
    commaAt === -1 ? "" : cleaned.slice(commaAt + 1).replace(/,/g, "").slice(0, 2)

  if (!intDigits && commaAt === -1) return ""

  const intFormatted = (intDigits || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const body = commaAt === -1 ? intFormatted : `${intFormatted},${decimalDigits}`
  return `R$ ${body}`
}

export function parseDealValue(display: string): number | null {
  const masked = maskDealValue(display)
  if (!masked) return null
  const numeric = masked.replace(/R\$\s?/, "").replace(/\./g, "").replace(",", ".")
  const value = Number(numeric)
  if (!Number.isFinite(value) || value < 0) return null
  return value
}

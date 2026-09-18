export const PROPERTY_PURPOSE_LABELS: Record<string, string> = {
  SALE: "Venda",
  RENT: "Locação",
  SALE_AND_RENT: "Venda e Locação",
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartamento",
  HOUSE: "Casa",
  LAND: "Terreno",
  COMMERCIAL: "Comercial",
  OTHER: "Outro",
}

export function formatPropertyPrice(value: number, purpose?: string) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
  return purpose === "RENT" ? `${formatted}/mês` : formatted
}

export function formatPropertyDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

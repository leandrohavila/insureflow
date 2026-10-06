import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatArea(value: number) {
  const digits = Number.isInteger(value) ? 0 : 2;
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  return `${formatted} m²`;
}

export function formatCount(value: number, singular: string, plural: string) {
  const amount = new Intl.NumberFormat("pt-BR").format(value);
  return `${amount} ${value === 1 ? singular : plural}`;
}

export function formatRooms(value: number) {
  return formatCount(value, "quarto", "quartos");
}

export function formatBathrooms(value: number) {
  return formatCount(value, "banheiro", "banheiros");
}

export function formatParking(value: number) {
  return formatCount(value, "vaga", "vagas");
}

function nationalDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  return digits;
}

export function formatPhoneBR(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  const digits = nationalDigits(raw);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return raw;
}

export function formatWhatsAppDisplay(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  const digits = nationalDigits(raw);
  if (digits.length === 11) return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return raw.startsWith("+") ? raw : `+${digits || raw}`;
}

export function isExclusiveListing(
  features: { key: string; label: string; value: boolean | string | number | null }[] | undefined,
) {
  return (features ?? []).some((feature) => {
    if (!/exclusiv/i.test(`${feature.key} ${feature.label}`)) return false;
    if (typeof feature.value === "boolean") return feature.value;
    if (typeof feature.value === "number") return feature.value !== 0;
    if (typeof feature.value === "string") {
      const normalized = feature.value.trim().toLowerCase();
      return normalized !== "" && !["0", "false", "nao", "não", "no"].includes(normalized);
    }
    return false;
  });
}

export function purposeLabel(purpose: string) {
  if (purpose === "RENT") return "Locação";
  if (purpose === "SALE_AND_RENT") return "Venda e locação";
  if (purpose === "SEASONAL") return "Temporada";
  return "Venda";
}

export function typeLabel(type: string) {
  const labels: Record<string, string> = {
    APARTMENT: "Apartamento",
    HOUSE: "Casa",
    LAND: "Terreno",
    COMMERCIAL: "Comercial",
    CONDOMINIUM: "Condomínio",
    OTHER: "Imóvel",
  };
  return labels[type] ?? "Imóvel";
}

export function coverImage<T extends { url: string; isCover: boolean }>(images: T[]) {
  return images.find((image) => image.isCover) ?? images[0] ?? null;
}

export function resolveCover(property: {
  coverImage?: { url: string; alt?: string | null } | null;
  images: { url: string; alt?: string | null; isCover: boolean }[];
}) {
  if (property.coverImage?.url) return property.coverImage;
  return coverImage(property.images);
}

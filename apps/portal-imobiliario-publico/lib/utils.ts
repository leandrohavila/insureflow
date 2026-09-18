import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function purposeLabel(purpose: string) {
  if (purpose === "RENT") return "Aluguel";
  if (purpose === "SALE_AND_RENT") return "Venda e aluguel";
  return "Venda";
}

export function typeLabel(type: string) {
  const labels: Record<string, string> = {
    APARTMENT: "Apartamento",
    HOUSE: "Casa",
    LAND: "Terreno",
    COMMERCIAL: "Comercial",
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

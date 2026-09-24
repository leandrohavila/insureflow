import type { PortalConfig } from "@/types/property";

export const CATEGORY_LINKS = [
  { slug: "casas", type: "HOUSE", label: "Casas" },
  { slug: "apartamentos", type: "APARTMENT", label: "Apartamentos" },
  { slug: "terrenos", type: "LAND", label: "Terrenos" },
  { slug: "condominios", type: "CONDOMINIUM", label: "Condomínios" },
  { slug: "comerciais", type: "COMMERCIAL", label: "Comerciais" },
] as const;

export function categoryBySlug(slug: string) {
  return CATEGORY_LINKS.find((item) => item.slug === slug) ?? null;
}

export function whatsappHref(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${withCountry}${query}`;
}

export function companyName(config: PortalConfig | null) {
  return config?.companyName?.trim() || "Imobiliária";
}

export function socialHref(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

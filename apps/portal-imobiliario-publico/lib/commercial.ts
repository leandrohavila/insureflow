import { portalOrigin } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
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

export function attendanceWhatsappMessage(name: string) {
  return `Olá, quero falar com a ${name} sobre um imóvel em Uberaba.`;
}

export function attendanceWhatsappHref(phone: string | null | undefined, name: string) {
  const value = phone?.trim();
  if (!value) return null;
  return whatsappHref(value, attendanceWhatsappMessage(name));
}

export function propertyWhatsappMessage(property: {
  title: string;
  publicCode?: string | null;
  slug: string;
}) {
  const code = property.publicCode?.trim() || property.slug;
  return `Olá, tenho interesse no imóvel ${property.title} (cód. ${code}).`;
}

export function propertyShareHref(property: { title: string; slug: string; price: number }) {
  const url = `${portalOrigin()}/imoveis/${property.slug}`;
  const text = `${property.title}\n${formatPrice(property.price)}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function propertyWhatsappHref(
  phone: string | null | undefined,
  property: { title: string; publicCode?: string | null; slug: string },
) {
  const value = phone?.trim();
  if (!value) return null;
  return whatsappHref(value, propertyWhatsappMessage(property));
}

export const ABOUT_TEXT_FALLBACK =
  "Atuamos na compra, venda e locação de imóveis em Uberaba e região, oferecendo atendimento personalizado, segurança jurídica e acompanhamento completo durante toda a negociação.";

export const DIFFERENTIAL_FALLBACK = [
  "Atendimento Personalizado",
  "Segurança Jurídica",
  "Melhores Oportunidades",
  "Acompanhamento Completo",
] as const;

export function companyName(config: PortalConfig | null) {
  return config?.companyName?.trim() || "Grupo Ávila Imóveis";
}

export function aboutSectionTitle(config: PortalConfig | null, name: string) {
  const custom = config?.aboutTitle?.trim();
  if (custom) return custom;
  if (/^grupo\b/i.test(name)) return `Sobre o ${name}`;
  return `Sobre a ${name}`;
}

export function portalDifferentials(config: PortalConfig | null) {
  const fromCrm = config?.differentials?.map((item) => item.trim()).filter(Boolean) ?? [];
  return fromCrm.length > 0 ? fromCrm : [...DIFFERENTIAL_FALLBACK];
}

export function socialHref(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

export const UBERABA_NEIGHBORHOODS = {
  centro: "Centro",
  abadia: "Abadia",
  fabricio: "Fabrício",
} as const;

export type UberabaNeighborhoodSlug = keyof typeof UBERABA_NEIGHBORHOODS;

export const UBERABA_LANDINGS = [
  {
    path: "/comprar-apartamento-uberaba",
    title: "Apartamentos à venda em Uberaba",
    description: "Apartamentos à venda em Uberaba. Compare preço, bairro e fale com a imobiliária.",
    purposeMode: "buy" as const,
    type: "APARTMENT" as const,
  },
  {
    path: "/comprar-casa-uberaba",
    title: "Casas à venda em Uberaba",
    description: "Casas à venda em Uberaba. Veja opções por bairro e agende uma visita.",
    purposeMode: "buy" as const,
    type: "HOUSE" as const,
  },
  {
    path: "/alugar-apartamento-uberaba",
    title: "Alugar apartamento em Uberaba",
    description: "Apartamentos para locação em Uberaba. Filtre por bairro e envie seu interesse.",
    purposeMode: "rent" as const,
    type: "APARTMENT" as const,
  },
  {
    path: "/alugar-casa-uberaba",
    title: "Alugar casa em Uberaba",
    description: "Casas para locação em Uberaba. Encontre o imóvel e fale pelo portal.",
    purposeMode: "rent" as const,
    type: "HOUSE" as const,
  },
  {
    path: "/terrenos-uberaba",
    title: "Terrenos em Uberaba",
    description: "Terrenos em Uberaba para construir ou investir. Veja localização, metragem e fale com a imobiliária.",
    type: "LAND" as const,
  },
  {
    path: "/imoveis-comerciais-uberaba",
    title: "Imóveis comerciais em Uberaba",
    description: "Salas, lojas e imóveis comerciais em Uberaba. Compare opções e chame no WhatsApp.",
    type: "COMMERCIAL" as const,
  },
] as const;

export const LOCAL_SEO_PATHS = [
  "/comprar-casa-uberaba",
  "/comprar-apartamento-uberaba",
  "/terrenos-uberaba",
  "/imoveis-comerciais-uberaba",
] as const;

export function uberabaLanding<T extends (typeof UBERABA_LANDINGS)[number]["path"]>(path: T) {
  const landing = UBERABA_LANDINGS.find((item) => item.path === path);
  if (!landing) throw new Error(`Landing ausente: ${path}`);
  return landing as Extract<(typeof UBERABA_LANDINGS)[number], { path: T }>;
}

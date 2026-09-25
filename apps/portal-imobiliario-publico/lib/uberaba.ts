export const UBERABA_NEIGHBORHOODS = {
  centro: "Centro",
  abadia: "Abadia",
  fabricio: "Fabrício",
} as const;

export type UberabaNeighborhoodSlug = keyof typeof UBERABA_NEIGHBORHOODS;

export const UBERABA_LANDINGS = [
  {
    path: "/comprar-apartamento-uberaba",
    title: "Comprar apartamento em Uberaba",
    description: "Apartamentos à venda em Uberaba. Compare preço, bairro e fale com a imobiliária.",
    purposeMode: "buy" as const,
    type: "APARTMENT" as const,
  },
  {
    path: "/comprar-casa-uberaba",
    title: "Comprar casa em Uberaba",
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
];

export function uberabaLanding(path: (typeof UBERABA_LANDINGS)[number]["path"]) {
  const landing = UBERABA_LANDINGS.find((item) => item.path === path);
  if (!landing) throw new Error(`Landing ausente: ${path}`);
  return landing;
}
